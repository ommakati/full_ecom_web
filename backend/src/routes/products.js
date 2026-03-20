import express from 'express'
import { query } from '../database/connection.js'
import { requireAdmin } from '../middleware/auth.js'
import { validateProduct } from '../middleware/validation.js'

const router = express.Router()

// GET /api/products - Retrieve all products
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
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to retrieve products',
        timestamp: new Date().toISOString()
      }
    })
  }
})

// GET /api/products/:id - Retrieve specific product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid product ID format',
          timestamp: new Date().toISOString()
        }
      })
    }
    
    const result = await query(
      'SELECT id, name, description, price, image_url, created_at, updated_at FROM products WHERE id = $1',
      [id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
          timestamp: new Date().toISOString()
        }
      })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to retrieve product',
        timestamp: new Date().toISOString()
      }
    })
  }
})

// POST /api/products - Create new product (admin only)
router.post('/', async (req, res) => {
  try {
    // Check if user is authenticated and is admin
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }
      })
    }

    if (!req.session.isAdmin) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
          timestamp: new Date().toISOString()
        }
      })
    }

    const { name, description, price, image_url } = req.body
    
    // Basic validation
    if (!name || !price) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name and price are required',
          timestamp: new Date().toISOString()
        }
      })
    }
    
    const result = await query(
      'INSERT INTO products (name, description, price, image_url) VALUES ($1, $2, $3, $4) RETURNING id, name, description, price, image_url, created_at, updated_at',
      [name.trim(), description?.trim() || null, parseFloat(price), image_url?.trim() || null]
    )
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating product:', error)
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to create product',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    })
  }
})

// PUT /api/products/:id - Update product (admin only)
router.put('/:id', async (req, res) => {
  try {
    // Check if user is authenticated and is admin
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }
      })
    }

    if (!req.session.isAdmin) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
          timestamp: new Date().toISOString()
        }
      })
    }

    const { id } = req.params
    const { name, description, price, image_url } = req.body
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid product ID format',
          timestamp: new Date().toISOString()
        }
      })
    }
    
    const result = await query(
      'UPDATE products SET name = $1, description = $2, price = $3, image_url = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, name, description, price, image_url, created_at, updated_at',
      [name.trim(), description?.trim() || null, parseFloat(price), image_url?.trim() || null, id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
          timestamp: new Date().toISOString()
        }
      })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating product:', error)
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update product',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    })
  }
})

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', async (req, res) => {
  try {
    // Check if user is authenticated and is admin
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }
      })
    }

    if (!req.session.isAdmin) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
          timestamp: new Date().toISOString()
        }
      })
    }

    const { id } = req.params
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid product ID format',
          timestamp: new Date().toISOString()
        }
      })
    }
    
    const result = await query(
      'DELETE FROM products WHERE id = $1 RETURNING id, name',
      [id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
          timestamp: new Date().toISOString()
        }
      })
    }
    
    res.json({
      message: 'Product deleted successfully',
      product: result.rows[0]
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to delete product',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    })
  }
})

export default router