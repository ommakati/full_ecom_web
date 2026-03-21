import express from 'express'
import { query } from '../database/connection.js'
import { dbAuth, dbAdminAuth } from './database-auth.js'

const router = express.Router()

// GET /api/orders - Get user's orders
router.get('/', dbAuth, async (req, res) => {
  try {
    const userId = req.user.id
    
    const result = await query(`
      SELECT 
        o.id,
        o.user_id,
        o.total_amount,
        o.status,
        o.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', p.name,
              'product_image_url', p.image_url,
              'quantity', oi.quantity,
              'price', oi.price,
              'item_total', (oi.quantity * oi.price)
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1
      GROUP BY o.id, o.user_id, o.total_amount, o.status, o.created_at
      ORDER BY o.created_at DESC
    `, [userId])
    
    res.json({
      orders: result.rows,
      total_orders: result.rows.length
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    res.status(500).json({
      error: 'Failed to fetch orders',
      details: error.message
    })
  }
})

// GET /api/orders/:id - Get single order by ID
router.get('/:id', dbAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const isAdmin = req.user.isAdmin
    
    // Build query based on user role
    let whereClause = 'WHERE o.id = $1'
    let params = [id]
    
    // Non-admin users can only see their own orders
    if (!isAdmin) {
      whereClause += ' AND o.user_id = $2'
      params.push(userId)
    }
    
    const result = await query(`
      SELECT 
        o.id,
        o.user_id,
        u.email as user_email,
        o.total_amount,
        o.status,
        o.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', p.name,
              'product_image_url', p.image_url,
              'quantity', oi.quantity,
              'price', oi.price,
              'item_total', (oi.quantity * oi.price)
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      ${whereClause}
      GROUP BY o.id, o.user_id, u.email, o.total_amount, o.status, o.created_at
    `, params)
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Order not found'
      })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching order:', error)
    res.status(500).json({
      error: 'Failed to fetch order',
      details: error.message
    })
  }
})

// GET /api/orders/admin/all - Get all orders (admin only)
router.get('/admin/all', dbAdminAuth, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        o.id,
        o.user_id,
        u.email as user_email,
        o.total_amount,
        o.status,
        o.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', p.name,
              'product_image_url', p.image_url,
              'quantity', oi.quantity,
              'price', oi.price,
              'item_total', (oi.quantity * oi.price)
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id, o.user_id, u.email, o.total_amount, o.status, o.created_at
      ORDER BY o.created_at DESC
    `)
    
    res.json({
      orders: result.rows,
      total_orders: result.rows.length
    })
  } catch (error) {
    console.error('Error fetching all orders:', error)
    res.status(500).json({
      error: 'Failed to fetch orders',
      details: error.message
    })
  }
})

// POST /api/orders - Create new order
router.post('/', dbAuth, async (req, res) => {
  try {
    const userId = req.user.id
    
    // Get cart items from database
    const cartResult = await query(`
      SELECT 
        ci.product_id,
        ci.quantity,
        p.price
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1
    `, [userId])
    
    if (cartResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Cart is empty',
        message: 'Cannot create order with empty cart'
      })
    }
    
    const items = cartResult.rows
    
    // Calculate total amount
    let totalAmount = 0
    for (const item of items) {
      totalAmount += item.quantity * parseFloat(item.price)
    }
    
    // Start transaction
    await query('BEGIN')
    
    try {
      // Create order
      const orderResult = await query(
        'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING *',
        [userId, totalAmount, 'pending']
      )
      
      const order = orderResult.rows[0]
      
      // Create order items
      for (const item of items) {
        await query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [order.id, item.product_id, item.quantity, item.price]
        )
      }
      
      // Clear cart after successful order
      await query('DELETE FROM cart_items WHERE user_id = $1', [userId])
      
      // Commit transaction
      await query('COMMIT')
      
      res.status(201).json({
        message: 'Order created successfully',
        order: {
          ...order,
          items: items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: parseFloat(item.price),
            item_total: item.quantity * parseFloat(item.price)
          }))
        }
      })
    } catch (error) {
      // Rollback transaction
      await query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({
      error: 'Failed to create order',
      details: error.message
    })
  }
})

// PATCH /api/orders/admin/:id/status - Update order status (admin only)
router.patch('/admin/:id/status', dbAdminAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    
    if (!status) {
      return res.status(400).json({
        error: 'Status is required'
      })
    }
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status'
      })
    }
    
    const result = await query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Order not found'
      })
    }
    
    res.json({
      message: 'Order status updated successfully',
      order: result.rows[0]
    })
  } catch (error) {
    console.error('Error updating order status:', error)
    res.status(500).json({
      error: 'Failed to update order status',
      details: error.message
    })
  }
})

export default router