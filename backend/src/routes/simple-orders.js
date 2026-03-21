import express from 'express'
import { query } from '../database/connection.js'
import { simpleAuth, simpleAdminAuth } from './simple-auth.js'

const router = express.Router()

// GET /api/orders - Get user's orders
router.get('/', simpleAuth, async (req, res) => {
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
              'item_total', oi.item_total
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

// GET /api/orders/admin/all - Get all orders (admin only)
router.get('/admin/all', simpleAdminAuth, async (req, res) => {
  try {
    console.log('ADMIN ORDERS: User authenticated:', req.user);
    
    const result = await query(`
      SELECT o.*, u.email 
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("❌ ADMIN ORDERS ERROR:", error);

    res.status(500).json({
      error: error.message
    });
  }
});

// PATCH /api/orders/admin/:id/status - Update order status (admin only)
router.patch('/admin/:id/status', simpleAdminAuth, async (req, res) => {
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

// POST /api/orders - Create new order
router.post('/', simpleAuth, async (req, res) => {
  try {
    const userId = req.user.id
    
    // Get cart items
    const cartResult = await query(`
      SELECT 
        ci.id,
        ci.product_id,
        ci.quantity,
        p.name as product_name,
        p.price,
        (ci.quantity * p.price) as item_total
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1
    `, [userId])
    
    if (cartResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Cart is empty'
      })
    }
    
    const cartItems = cartResult.rows
    const totalAmount = cartItems.reduce((sum, item) => sum + parseFloat(item.item_total), 0)
    
    // Create order
    const orderResult = await query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING *',
      [userId, totalAmount, 'pending']
    )
    
    const order = orderResult.rows[0]
    
    // Create order items
    for (const item of cartItems) {
      await query(
        'INSERT INTO order_items (order_id, product_id, quantity, price, item_total) VALUES ($1, $2, $3, $4, $5)',
        [order.id, item.product_id, item.quantity, item.price, item.item_total]
      )
    }
    
    // Clear cart
    await query('DELETE FROM cart_items WHERE user_id = $1', [userId])
    
    res.status(201).json(order)
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({
      error: 'Failed to create order',
      details: error.message
    })
  }
})

export default router