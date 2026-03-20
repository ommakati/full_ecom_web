import express from 'express'
import { query, getClient } from '../database/connection.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// Helper function to validate UUID format
const isValidUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// Helper function to get session ID
const getSessionId = (req) => {
  return req.sessionID || req.session.id
}

// POST /api/orders - Create new order
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId
    const sessionId = getSessionId(req)

    if (!sessionId) {
      return res.status(400).json({
        error: {
          code: 'NO_SESSION',
          message: 'Session not found',
          timestamp: new Date().toISOString()
        }
      })
    }

    // Get cart contents
    const cartResult = await query(`
      SELECT 
        ci.product_id,
        ci.quantity,
        p.name as product_name,
        p.price as product_price
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.session_id = $1
    `, [sessionId])

    if (cartResult.rows.length === 0) {
      return res.status(400).json({
        error: {
          code: 'EMPTY_CART',
          message: 'Cannot create order with empty cart',
          timestamp: new Date().toISOString()
        }
      })
    }

    // Calculate total amount
    const cartItems = cartResult.rows
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.product_price) * item.quantity)
    }, 0)

    // Validate total amount
    if (totalAmount <= 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_TOTAL',
          message: 'Order total must be greater than zero',
          timestamp: new Date().toISOString()
        }
      })
    }

    // Begin transaction
    const client = await getClient()
    
    try {
      await client.query('BEGIN')
      
      // Create order
      const orderResult = await client.query(`
        INSERT INTO orders (user_id, total_amount, status)
        VALUES ($1, $2, 'pending')
        RETURNING id, user_id, total_amount, status, created_at
      `, [userId, totalAmount])

      const order = orderResult.rows[0]

      // Create order items one by one to ensure they use the same transaction
      const orderItems = []
      for (const item of cartItems) {
        const result = await client.query(`
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES ($1, $2, $3, $4)
          RETURNING id, product_id, quantity, price
        `, [order.id, item.product_id, item.quantity, item.product_price])
        orderItems.push(result.rows[0])
      }

      // Clear cart after successful order creation
      await client.query('DELETE FROM cart_items WHERE session_id = $1', [sessionId])

      // Commit transaction
      await client.query('COMMIT')
      client.release()

      // Format response with order details
      const orderItemsWithDetails = orderItems.map((item, index) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: cartItems[index].product_name,
        quantity: item.quantity,
        price: parseFloat(item.price),
        item_total: item.quantity * parseFloat(item.price)
      }))

      res.status(201).json({
        id: order.id,
        user_id: order.user_id,
        total_amount: parseFloat(order.total_amount),
        status: order.status,
        created_at: order.created_at,
        items: orderItemsWithDetails
      })
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK')
      client.release()
      throw error
    }
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to create order',
        timestamp: new Date().toISOString()
      }
    })
  }
})

// GET /api/orders - Get user's orders
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId

    // Get orders with basic info
    const ordersResult = await query(`
      SELECT id, user_id, total_amount, status, created_at
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId])

    if (ordersResult.rows.length === 0) {
      return res.json({
        orders: [],
        total_orders: 0
      })
    }

    // Get order items for all orders
    const orderIds = ordersResult.rows.map(order => order.id)
    const orderItemsResult = await query(`
      SELECT 
        oi.order_id,
        oi.id,
        oi.product_id,
        oi.quantity,
        oi.price,
        p.name as product_name,
        p.image_url as product_image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ANY($1)
      ORDER BY oi.created_at
    `, [orderIds])

    // Group order items by order_id
    const orderItemsMap = {}
    orderItemsResult.rows.forEach(item => {
      if (!orderItemsMap[item.order_id]) {
        orderItemsMap[item.order_id] = []
      }
      orderItemsMap[item.order_id].push({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_image_url: item.product_image_url,
        quantity: item.quantity,
        price: parseFloat(item.price),
        item_total: item.quantity * parseFloat(item.price)
      })
    })

    // Combine orders with their items
    const orders = ordersResult.rows.map(order => ({
      id: order.id,
      user_id: order.user_id,
      total_amount: parseFloat(order.total_amount),
      status: order.status,
      created_at: order.created_at,
      items: orderItemsMap[order.id] || []
    }))

    res.json({
      orders,
      total_orders: orders.length
    })
  } catch (error) {
    console.error('Error fetching user orders:', error)
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to retrieve orders',
        timestamp: new Date().toISOString()
      }
    })
  }
})

// GET /api/orders/:id - Get specific order details
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.session.userId

    if (!isValidUUID(id)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid order ID format',
          timestamp: new Date().toISOString()
        }
      })
    }

    // Get order details
    const orderResult = await query(`
      SELECT id, user_id, total_amount, status, created_at
      FROM orders
      WHERE id = $1 AND user_id = $2
    `, [id, userId])

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
          timestamp: new Date().toISOString()
        }
      })
    }

    const order = orderResult.rows[0]

    // Get order items
    const orderItemsResult = await query(`
      SELECT 
        oi.id,
        oi.product_id,
        oi.quantity,
        oi.price,
        oi.created_at,
        p.name as product_name,
        p.description as product_description,
        p.image_url as product_image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
      ORDER BY oi.created_at
    `, [id])

    const orderItems = orderItemsResult.rows.map(item => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_description: item.product_description,
      product_image_url: item.product_image_url,
      quantity: item.quantity,
      price: parseFloat(item.price),
      item_total: item.quantity * parseFloat(item.price),
      created_at: item.created_at
    }))

    res.json({
      id: order.id,
      user_id: order.user_id,
      total_amount: parseFloat(order.total_amount),
      status: order.status,
      created_at: order.created_at,
      items: orderItems
    })
  } catch (error) {
    console.error('Error fetching order details:', error)
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to retrieve order details',
        timestamp: new Date().toISOString()
      }
    })
  }
})

// GET /api/orders/admin/all - Get all orders (admin only)
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    // Get all orders with basic info
    const ordersResult = await query(`
      SELECT 
        o.id, 
        o.user_id, 
        o.total_amount, 
        o.status, 
        o.created_at,
        u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `)

    if (ordersResult.rows.length === 0) {
      return res.json({
        orders: [],
        total_orders: 0
      })
    }

    // Get order items for all orders
    const orderIds = ordersResult.rows.map(order => order.id)
    const orderItemsResult = await query(`
      SELECT 
        oi.order_id,
        oi.id,
        oi.product_id,
        oi.quantity,
        oi.price,
        p.name as product_name,
        p.image_url as product_image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ANY($1)
      ORDER BY oi.created_at
    `, [orderIds])

    // Group order items by order_id
    const orderItemsMap = {}
    orderItemsResult.rows.forEach(item => {
      if (!orderItemsMap[item.order_id]) {
        orderItemsMap[item.order_id] = []
      }
      orderItemsMap[item.order_id].push({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_image_url: item.product_image_url,
        quantity: item.quantity,
        price: parseFloat(item.price),
        item_total: item.quantity * parseFloat(item.price)
      })
    })

    // Combine orders with their items
    const orders = ordersResult.rows.map(order => ({
      id: order.id,
      user_id: order.user_id,
      user_email: order.user_email,
      total_amount: parseFloat(order.total_amount),
      status: order.status,
      created_at: order.created_at,
      items: orderItemsMap[order.id] || []
    }))

    res.json({
      orders,
      total_orders: orders.length
    })
  } catch (error) {
    console.error('Error fetching all orders:', error)
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to retrieve orders',
        timestamp: new Date().toISOString()
      }
    })
  }
})

// PATCH /api/orders/admin/:id/status - Update order status (admin only)
router.patch('/admin/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!isValidUUID(id)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid order ID format',
          timestamp: new Date().toISOString()
        }
      })
    }

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: 'Invalid order status. Must be one of: ' + validStatuses.join(', '),
          timestamp: new Date().toISOString()
        }
      })
    }

    // Update order status
    const result = await query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING id, status',
      [status, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
          timestamp: new Date().toISOString()
        }
      })
    }

    res.json({
      id: result.rows[0].id,
      status: result.rows[0].status,
      message: 'Order status updated successfully'
    })
  } catch (error) {
    console.error('Error updating order status:', error)
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update order status',
        timestamp: new Date().toISOString()
      }
    })
  }
})

export default router