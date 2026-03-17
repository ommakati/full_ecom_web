import request from 'supertest'
import express from 'express'
import session from 'express-session'
import { query } from '../database/connection.js'
import cartRoutes from '../routes/cart.js'

// Create test app
const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  }))
  app.use('/api/cart', cartRoutes)
  return app
}

describe('Cart Endpoints', () => {
  let app
  let testProductId
  let agent

  beforeAll(async () => {
    app = createTestApp()
    agent = request.agent(app)

    // Create a test product
    const productResult = await query(
      'INSERT INTO products (name, description, price, image_url) VALUES ($1, $2, $3, $4) RETURNING id',
      ['Test Product', 'Test Description', 29.99, 'https://example.com/image.jpg']
    )
    testProductId = productResult.rows[0].id
  })

  afterAll(async () => {
    // Clean up test data
    await query('DELETE FROM cart_items WHERE product_id = $1', [testProductId])
    await query('DELETE FROM products WHERE id = $1', [testProductId])
  })

  beforeEach(async () => {
    // Clear cart items before each test
    await query('DELETE FROM cart_items')
  })

  describe('GET /api/cart', () => {
    it('should return empty cart for new session', async () => {
      const response = await agent.get('/api/cart')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        items: [],
        summary: {
          total_items: 0,
          total_quantity: 0,
          total_amount: 0
        }
      })
    })

    it('should return cart contents with items', async () => {
      // First add an item to cart
      await agent
        .post('/api/cart/items')
        .send({ product_id: testProductId, quantity: 2 })

      const response = await agent.get('/api/cart')

      expect(response.status).toBe(200)
      expect(response.body.items).toHaveLength(1)
      expect(response.body.items[0]).toMatchObject({
        quantity: 2,
        product: {
          id: testProductId,
          name: 'Test Product',
          price: 29.99
        },
        item_total: 59.98
      })
      expect(response.body.summary).toEqual({
        total_items: 1,
        total_quantity: 2,
        total_amount: 59.98
      })
    })
  })

  describe('POST /api/cart/items', () => {
    it('should add new item to cart', async () => {
      const response = await agent
        .post('/api/cart/items')
        .send({ product_id: testProductId, quantity: 1 })

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        quantity: 1,
        product: {
          id: testProductId,
          name: 'Test Product',
          price: 29.99
        },
        item_total: 29.99
      })
    })

    it('should update quantity when adding existing item', async () => {
      // Add item first time
      await agent
        .post('/api/cart/items')
        .send({ product_id: testProductId, quantity: 1 })

      // Add same item again
      const response = await agent
        .post('/api/cart/items')
        .send({ product_id: testProductId, quantity: 2 })

      expect(response.status).toBe(201)
      expect(response.body.quantity).toBe(3) // 1 + 2
      expect(response.body.item_total).toBe(89.97) // 3 * 29.99
    })

    it('should return 400 for missing product_id', async () => {
      const response = await agent
        .post('/api/cart/items')
        .send({ quantity: 1 })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.message).toBe('Product ID is required')
    })

    it('should return 400 for invalid product_id format', async () => {
      const response = await agent
        .post('/api/cart/items')
        .send({ product_id: 'invalid-uuid', quantity: 1 })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('INVALID_ID')
    })

    it('should return 404 for non-existent product', async () => {
      const response = await agent
        .post('/api/cart/items')
        .send({ product_id: '12345678-1234-1234-1234-123456789012', quantity: 1 })

      expect(response.status).toBe(404)
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND')
    })

    it('should return 400 for invalid quantity', async () => {
      const response = await agent
        .post('/api/cart/items')
        .send({ product_id: testProductId, quantity: 0 })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.message).toBe('Quantity must be between 1 and 100')
    })
  })

  describe('PUT /api/cart/items/:id', () => {
    let cartItemId

    beforeEach(async () => {
      // Add an item to cart first
      const response = await agent
        .post('/api/cart/items')
        .send({ product_id: testProductId, quantity: 1 })
      cartItemId = response.body.id
    })

    it('should update cart item quantity', async () => {
      const response = await agent
        .put(`/api/cart/items/${cartItemId}`)
        .send({ quantity: 3 })

      expect(response.status).toBe(200)
      expect(response.body.quantity).toBe(3)
      expect(response.body.item_total).toBe(89.97) // 3 * 29.99
    })

    it('should return 400 for invalid cart item ID format', async () => {
      const response = await agent
        .put('/api/cart/items/invalid-uuid')
        .send({ quantity: 2 })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('INVALID_ID')
    })

    it('should return 404 for non-existent cart item', async () => {
      const response = await agent
        .put('/api/cart/items/12345678-1234-1234-1234-123456789012')
        .send({ quantity: 2 })

      expect(response.status).toBe(404)
      expect(response.body.error.code).toBe('CART_ITEM_NOT_FOUND')
    })

    it('should return 400 for invalid quantity', async () => {
      const response = await agent
        .put(`/api/cart/items/${cartItemId}`)
        .send({ quantity: 101 })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('DELETE /api/cart/items/:id', () => {
    let cartItemId

    beforeEach(async () => {
      // Add an item to cart first
      const response = await agent
        .post('/api/cart/items')
        .send({ product_id: testProductId, quantity: 1 })
      cartItemId = response.body.id
    })

    it('should remove cart item', async () => {
      const response = await agent.delete(`/api/cart/items/${cartItemId}`)

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Item removed from cart successfully')
      expect(response.body.removed_item.id).toBe(cartItemId)

      // Verify item is removed
      const cartResponse = await agent.get('/api/cart')
      expect(cartResponse.body.items).toHaveLength(0)
    })

    it('should return 400 for invalid cart item ID format', async () => {
      const response = await agent.delete('/api/cart/items/invalid-uuid')

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('INVALID_ID')
    })

    it('should return 404 for non-existent cart item', async () => {
      const response = await agent.delete('/api/cart/items/12345678-1234-1234-1234-123456789012')

      expect(response.status).toBe(404)
      expect(response.body.error.code).toBe('CART_ITEM_NOT_FOUND')
    })
  })

  describe('DELETE /api/cart', () => {
    beforeEach(async () => {
      // Add multiple items to cart
      await agent
        .post('/api/cart/items')
        .send({ product_id: testProductId, quantity: 1 })
      await agent
        .post('/api/cart/items')
        .send({ product_id: testProductId, quantity: 2 })
    })

    it('should clear entire cart', async () => {
      const response = await agent.delete('/api/cart')

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Cart cleared successfully')
      expect(response.body.removed_items_count).toBe(1) // One unique product

      // Verify cart is empty
      const cartResponse = await agent.get('/api/cart')
      expect(cartResponse.body.items).toHaveLength(0)
    })

    it('should handle clearing empty cart', async () => {
      // Clear cart first
      await agent.delete('/api/cart')

      // Try to clear again
      const response = await agent.delete('/api/cart')

      expect(response.status).toBe(200)
      expect(response.body.removed_items_count).toBe(0)
    })
  })

  describe('Session handling', () => {
    it('should maintain separate carts for different sessions', async () => {
      const agent1 = request.agent(app)
      const agent2 = request.agent(app)

      // Add item to first session
      await agent1
        .post('/api/cart/items')
        .send({ product_id: testProductId, quantity: 1 })

      // Add item to second session
      await agent2
        .post('/api/cart/items')
        .send({ product_id: testProductId, quantity: 2 })

      // Check first session cart
      const cart1Response = await agent1.get('/api/cart')
      expect(cart1Response.body.summary.total_quantity).toBe(1)

      // Check second session cart
      const cart2Response = await agent2.get('/api/cart')
      expect(cart2Response.body.summary.total_quantity).toBe(2)
    })
  })
})