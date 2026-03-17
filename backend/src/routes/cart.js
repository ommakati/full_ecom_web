import express from 'express'
import { query } from '../database/connection.js'
import { validateQuantity } from '../middleware/validation.js'

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

// GET /api/cart - Get current cart contents
router.get('/', async (req, res) => {
  try {
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

    const result = await query(`
      SELECT 
        ci.id,
        ci.quantity,
        ci.created_at,
        ci.updated_at,
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.price as product_price,
        p.image_url as product_image_url,
        (ci.quantity * p.price) as item_total
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.session_id = $1
      ORDER BY ci.created_at DESC
    `, [sessionId])

    const items = result.rows.map(row => ({
      id: row.id,
      quantity: row.quantity,
      created_at: row.created_at,
      updated_at: row.updated_at,
      product: {
        id: row.product_id,
        name: row.product_name,
        description: row.product_description,
        price: parseFloat(row.product_price),
        image_url: row.product_image_url
      },
      item_total: parseFloat(row.item_total)
    }))

    const totalAmount = items.reduce((sum, item) => sum + item.item_total, 0)
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

    res.json({
      items,
      summary: {
        total_items: items.length,
        total_quantity: totalQuantity,
        total_amount: totalAmount
      }
    })
  } catch (error) {
    console.error('Error fetching cart contents:', error)
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to retrieve cart contents',
        timestamp: new Date().toISOString()
      }
    })
  }
})

// POST /api/cart/items - Add item to cart
router.post('/items', validateQuantity, async (req, res) => {
  try {
    const { product_id, quantity } = req.body
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

    if (!product_id) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
          timestamp: new Date().toISOString()
        }
      })
    }

    if (!isValidUUID(product_id)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid product ID format',
          timestamp: new Date().toISOString()
        }
      })
    }

    // Check if product exists
    const productResult = await query(
      'SELECT id, name, price FROM products WHERE id = $1',
      [product_id]
    )

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
          timestamp: new Date().toISOString()
        }
      })
    }

    // Check if item already exists in cart
    const existingResult = await query(
      'SELECT id, quantity FROM cart_items WHERE session_id = $1 AND product_id = $2',
      [sessionId, product_id]
    )

    let result
    if (existingResult.rows.length > 0) {
      // Update existing item quantity
      const newQuantity = existingResult.rows[0].quantity + quantity
      result = await query(`
        UPDATE cart_items 
        SET quantity = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE session_id = $2 AND product_id = $3
        RETURNING id, quantity, created_at, updated_at
      `, [newQuantity, sessionId, product_id])
    } else {
      // Insert new item
      result = await query(`
        INSERT INTO cart_items (session_id, product_id, quantity)
        VALUES ($1, $2, $3)
        RETURNING id, quantity, created_at, updated_at
      `, [sessionId, product_id, quantity])
    }

    const cartItem = result.rows[0]
    const product = productResult.rows[0]

    res.status(201).json({
      id: cartItem.id,
      quantity: cartItem.quantity,
      created_at: cartItem.created_at,
      updated_at: cartItem.updated_at,
      product: {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price)
      },
      item_total: cartItem.quantity * parseFloat(product.price)
    })
  } catch (error) {
    console.error('Error adding item to cart:', error)
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to add item to cart',
        timestamp: new Date().toISOString()
      }
    })
  }
})

// PUT /api/cart/items/:id - Update cart item quantity
router.put('/items/:id', validateQuantity, async (req, res) => {
  try {
    const { id } = req.params
    const { quantity } = req.body
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

    if (!isValidUUID(id)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid cart item ID format',
          timestamp: new Date().toISOString()
        }
      })
    }

    const result = await query(`
      UPDATE cart_items 
      SET quantity = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 AND session_id = $3
      RETURNING id, product_id, quantity, created_at, updated_at
    `, [quantity, id, sessionId])

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'CART_ITEM_NOT_FOUND',
          message: 'Cart item not found',
          timestamp: new Date().toISOString()
        }
      })
    }

    // Get product details
    const productResult = await query(
      'SELECT id, name, price FROM products WHERE id = $1',
      [result.rows[0].product_id]
    )

    const cartItem = result.rows[0]
    const product = productResult.rows[0]

    res.json({
      id: cartItem.id,
      quantity: cartItem.quantity,
      created_at: cartItem.created_at,
      updated_at: cartItem.updated_at,
      product: {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price)
      },
      item_total: cartItem.quantity * parseFloat(product.price)
    })
  } catch (error) {
    console.error('Error updating cart item:', error)
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update cart item',
        timestamp: new Date().toISOString()
      }
    })
  }
})

// DELETE /api/cart/items/:id - Remove item from cart
router.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params
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

    if (!isValidUUID(id)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid cart item ID format',
          timestamp: new Date().toISOString()
        }
      })
    }

    const result = await query(
      'DELETE FROM cart_items WHERE id = $1 AND session_id = $2 RETURNING id, product_id, quantity',
      [id, sessionId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'CART_ITEM_NOT_FOUND',
          message: 'Cart item not found',
          timestamp: new Date().toISOString()
        }
      })
    }

    res.json({
      message: 'Item removed from cart successfully',
      removed_item: {
        id: result.rows[0].id,
        product_id: result.rows[0].product_id,
        quantity: result.rows[0].quantity
      }
    })
  } catch (error) {
    console.error('Error removing cart item:', error)
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to remove cart item',
        timestamp: new Date().toISOString()
      }
    })
  }
})

// DELETE /api/cart - Clear entire cart
router.delete('/', async (req, res) => {
  try {
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

    const result = await query(
      'DELETE FROM cart_items WHERE session_id = $1 RETURNING id',
      [sessionId]
    )

    res.json({
      message: 'Cart cleared successfully',
      removed_items_count: result.rows.length
    })
  } catch (error) {
    console.error('Error clearing cart:', error)
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to clear cart',
        timestamp: new Date().toISOString()
      }
    })
  }
})

export default router