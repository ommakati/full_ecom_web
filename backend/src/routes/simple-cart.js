import express from 'express'
import { query } from '../database/connection.js'
import { simpleAuth } from './simple-auth.js'

const router = express.Router()

// GET /api/cart - Get current cart
router.get('/', simpleAuth, async (req, res) => {
  try {
    const userId = req.user.id
    
    const result = await query(`
      SELECT 
        ci.id,
        ci.product_id,
        ci.quantity,
        p.name as product_name,
        p.description as product_description,
        p.price,
        p.image_url as product_image_url,
        (ci.quantity * p.price) as item_total
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at DESC
    `, [userId])
    
    const items = result.rows
    const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.item_total), 0)
    
    res.json({
      items,
      total_amount: totalAmount,
      item_count: items.length
    })
  } catch (error) {
    console.error('Error fetching cart:', error)
    res.status(500).json({
      error: 'Failed to fetch cart',
      details: error.message
    })
  }
})

// POST /api/cart/items - Add item to cart
router.post('/items', simpleAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { product_id, quantity = 1 } = req.body
    
    if (!product_id) {
      return res.status(400).json({
        error: 'Product ID is required'
      })
    }
    
    // Check if product exists
    const productResult = await query('SELECT id, name, price FROM products WHERE id = $1', [product_id])
    if (productResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Product not found'
      })
    }
    
    // Check if item already in cart
    const existingResult = await query(
      'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [userId, product_id]
    )
    
    if (existingResult.rows.length > 0) {
      // Update existing item
      const newQuantity = existingResult.rows[0].quantity + quantity
      const updateResult = await query(
        'UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *',
        [newQuantity, existingResult.rows[0].id]
      )
      
      res.json(updateResult.rows[0])
    } else {
      // Add new item
      const insertResult = await query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
        [userId, product_id, quantity]
      )
      
      res.status(201).json(insertResult.rows[0])
    }
  } catch (error) {
    console.error('Error adding to cart:', error)
    res.status(500).json({
      error: 'Failed to add to cart',
      details: error.message
    })
  }
})

// PUT /api/cart/items/:id - Update cart item quantity
router.put('/items/:id', simpleAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const { quantity } = req.body
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        error: 'Valid quantity is required'
      })
    }
    
    const result = await query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [quantity, id, userId]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Cart item not found'
      })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating cart item:', error)
    res.status(500).json({
      error: 'Failed to update cart item',
      details: error.message
    })
  }
})

// DELETE /api/cart/items/:id - Remove item from cart
router.delete('/items/:id', simpleAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    
    const result = await query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Cart item not found'
      })
    }
    
    res.json({
      message: 'Item removed from cart',
      item: result.rows[0]
    })
  } catch (error) {
    console.error('Error removing from cart:', error)
    res.status(500).json({
      error: 'Failed to remove from cart',
      details: error.message
    })
  }
})

// DELETE /api/cart - Clear entire cart
router.delete('/', simpleAuth, async (req, res) => {
  try {
    const userId = req.user.id
    
    const result = await query('DELETE FROM cart_items WHERE user_id = $1', [userId])
    
    res.json({
      message: 'Cart cleared successfully',
      items_removed: result.rowCount
    })
  } catch (error) {
    console.error('Error clearing cart:', error)
    res.status(500).json({
      error: 'Failed to clear cart',
      details: error.message
    })
  }
})

export default router