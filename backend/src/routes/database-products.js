import express from 'express'
import { query } from '../database/connection.js'
import { dbAdminAuth } from './database-auth.js'

const router = express.Router()

// GET /api/products - Get all products (public)
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, description, price, image_url, created_at, updated_at FROM products ORDER BY created_at DESC'
    )
    
    res.json({
      products: result.rows,
      count: result.rows.length
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({
      error: 'Failed to fetch products',
      details: error.message
    })
  }
})

// GET /api/products/:id - Get single product (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await query(
      'SELECT id, name, description, price, image_url, created_at, updated_at FROM products WHERE id = $1',
      [id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Product not found'
      })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({
      error: 'Failed to fetch product',
      details: error.message
    })
  }
})

// POST /api/products - Create product (admin only)
router.post('/', dbAdminAuth, async (req, res) => {
  try {
    const { name, description, price, image_url } = req.body
    
    if (!name || !price) {
      return res.status(400).json({
        error: 'Name and price are required'
      })
    }
    
    const result = await query(
      'INSERT INTO products (name, description, price, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [name.trim(), description?.trim() || null, parseFloat(price), image_url?.trim() || null]
    )
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating product:', error)
    res.status(500).json({
      error: 'Failed to create product',
      details: error.message
    })
  }
})

// PUT /api/products/:id - Update product (admin only)
router.put('/:id', dbAdminAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, price, image_url } = req.body
    
    if (!name || !price) {
      return res.status(400).json({
        error: 'Name and price are required'
      })
    }
    
    const result = await query(
      'UPDATE products SET name = $1, description = $2, price = $3, image_url = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name.trim(), description?.trim() || null, parseFloat(price), image_url?.trim() || null, id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Product not found'
      })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating product:', error)
    res.status(500).json({
      error: 'Failed to update product',
      details: error.message
    })
  }
})

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', dbAdminAuth, async (req, res) => {
  try {
    const { id } = req.params
    
    // Check if product has been ordered
    const orderCheck = await query(
      'SELECT COUNT(*) as order_count FROM order_items WHERE product_id = $1',
      [id]
    )
    
    if (parseInt(orderCheck.rows[0].order_count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete product',
        message: 'This product has been ordered and cannot be deleted. Consider marking it as unavailable instead.',
        details: `Product is referenced in ${orderCheck.rows[0].order_count} order(s)`
      })
    }
    
    const result = await query(
      'DELETE FROM products WHERE id = $1 RETURNING id, name',
      [id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Product not found'
      })
    }
    
    res.json({
      message: 'Product deleted successfully',
      product: result.rows[0]
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    res.status(500).json({
      error: 'Failed to delete product',
      details: error.message
    })
  }
})

export default router