import request from 'supertest'
import express from 'express'
import session from 'express-session'
import { query } from '../database/connection.js'
import ordersRouter from '../routes/orders.js'
import authRoutes from '../routes/auth.js'
import cartRoutes from '../routes/cart.js'
import productsRoutes from '../routes/products.js'

// Create test app
const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }))
  app.use('/auth', authRoutes)
  app.use('/api/orders', ordersRouter)
  app.use('/api/cart', cartRoutes)
  app.use('/api/products', productsRoutes)
  return app
}

describe('Orders API Endpoints', () => {
  let app
  let testUser
  let testProduct1
  let testProduct2

  beforeAll(() => {
    app = createTestApp()
    testUser = {
      email: 'ordertest@example.com',
      password: 'testpassword123'
    }
  })

  beforeEach(async () => {
    // Clean up test data
    await query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id IN (SELECT id FROM users WHERE email = $1))', [testUser.email])
    await query('DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email = $1)', [testUser.email])
    await query('DELETE FROM cart_items WHERE session_id LIKE $1', ['%test%'])
    await query('DELETE FROM products WHERE name LIKE $1', ['Test Product%'])
    await query('DELETE FROM users WHERE email = $1', [testUser.email])

    // Create test products
    const product1Result = await query(`
      INSERT INTO products (name, description, price, image_url)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, price
    `, ['Test Product 1', 'Test Description 1', 10.99, 'test1.jpg'])
    testProduct1 = product1Result.rows[0]

    const product2Result = await query(`
      INSERT INTO products (name, description, price, image_url)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, price
    `, ['Test Product 2', 'Test Description 2', 25.50, 'test2.jpg'])
    testProduct2 = product2Result.rows[0]
  })

  afterEach(async () => {
    // Clean up test data
    await query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id IN (SELECT id FROM users WHERE email = $1))', [testUser.email])
    await query('DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email = $1)', [testUser.email])
    await query('DELETE FROM cart_items WHERE session_id LIKE $1', ['%test%'])
    await query('DELETE FROM products WHERE name LIKE $1', ['Test Product%'])
    await query('DELETE FROM users WHERE email = $1', [testUser.email])
  })

  describe('POST /api/orders', () => {
    it('should create order successfully with cart items', async () => {
      // Register and login user
      const agent = request.agent(app)
      await agent.post('/auth/register').send(testUser)

      // Add items to cart
      await agent
        .post('/api/cart/items')
        .send({ product_id: testProduct1.id, quantity: 2 })
        .expect(201)

      await agent
        .post('/api/cart/items')
        .send({ product_id: testProduct2.id, quantity: 1 })
        .expect(201)

      // Create order
      const response = await agent
        .post('/api/orders')
        .expect(201)

      expect(response.body.id).toBeDefined()
      expect(response.body.total_amount).toBe(47.48) // (10.99 * 2) + (25.50 * 1)
      expect(response.body.status).toBe('pending')
      expect(response.body.items).toHaveLength(2)
      expect(response.body.items[0].quantity).toBe(2)
      expect(response.body.items[1].quantity).toBe(1)

      // Verify cart is cleared
      const cartResponse = await agent.get('/api/cart')
      expect(cartResponse.body.items).toHaveLength(0)
    })

    it('should return error for empty cart', async () => {
      // Register and login user
      const agent = request.agent(app)
      await agent.post('/auth/register').send(testUser)

      // Try to create order with empty cart
      const response = await agent
        .post('/api/orders')
        .expect(400)

      expect(response.body.error.code).toBe('EMPTY_CART')
    })

    it('should return error when not authenticated', async () => {
      const response = await request(app)
        .post('/api/orders')
        .expect(401)

      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })

    it('should handle database transaction rollback on error', async () => {
      // Register and login user
      const agent = request.agent(app)
      await agent.post('/auth/register').send(testUser)

      // Add item to cart
      await agent
        .post('/api/cart/items')
        .send({ product_id: testProduct1.id, quantity: 1 })

      // Delete the product to cause a foreign key error
      await query('DELETE FROM products WHERE id = $1', [testProduct1.id])

      // Try to create order - should fail and rollback
      const response = await agent
        .post('/api/orders')
        .expect(500)

      expect(response.body.error.code).toBe('DATABASE_ERROR')

      // Verify no order was created
      const ordersResult = await query('SELECT * FROM orders')
      expect(ordersResult.rows.length).toBe(0)
    })
  })

  describe('GET /api/orders', () => {
    it('should return user orders successfully', async () => {
      // Register and login user
      const agent = request.agent(app)
      await agent.post('/auth/register').send(testUser)

      // Add items to cart and create order
      await agent
        .post('/api/cart/items')
        .send({ product_id: testProduct1.id, quantity: 2 })

      await agent.post('/api/orders')

      // Get orders
      const response = await agent
        .get('/api/orders')
        .expect(200)

      expect(response.body.orders).toHaveLength(1)
      expect(response.body.total_orders).toBe(1)
      expect(response.body.orders[0].total_amount).toBe(21.98) // 10.99 * 2
      expect(response.body.orders[0].items).toHaveLength(1)
    })

    it('should return empty array when user has no orders', async () => {
      // Register and login user
      const agent = request.agent(app)
      await agent.post('/auth/register').send(testUser)

      const response = await agent
        .get('/api/orders')
        .expect(200)

      expect(response.body.orders).toHaveLength(0)
      expect(response.body.total_orders).toBe(0)
    })

    it('should return error when not authenticated', async () => {
      const response = await request(app)
        .get('/api/orders')
        .expect(401)

      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('GET /api/orders/:id', () => {
    it('should return specific order details', async () => {
      // Register and login user
      const agent = request.agent(app)
      await agent.post('/auth/register').send(testUser)

      // Add items to cart and create order
      await agent
        .post('/api/cart/items')
        .send({ product_id: testProduct1.id, quantity: 2 })

      const orderResponse = await agent.post('/api/orders')
      const orderId = orderResponse.body.id

      // Get specific order
      const response = await agent
        .get(`/api/orders/${orderId}`)
        .expect(200)

      expect(response.body.id).toBe(orderId)
      expect(response.body.total_amount).toBe(21.98)
      expect(response.body.items).toHaveLength(1)
      expect(response.body.items[0].product_name).toBe('Test Product 1')
      expect(response.body.items[0].quantity).toBe(2)
    })

    it('should return 400 for invalid order ID format', async () => {
      // Register and login user
      const agent = request.agent(app)
      await agent.post('/auth/register').send(testUser)

      const response = await agent
        .get('/api/orders/invalid-id')
        .expect(400)

      expect(response.body.error.code).toBe('INVALID_ID')
    })

    it('should return 404 for non-existent order', async () => {
      // Register and login user
      const agent = request.agent(app)
      await agent.post('/auth/register').send(testUser)

      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'
      const response = await agent
        .get(`/api/orders/${nonExistentId}`)
        .expect(404)

      expect(response.body.error.code).toBe('ORDER_NOT_FOUND')
    })

    it('should return error when not authenticated', async () => {
      const orderId = '123e4567-e89b-12d3-a456-426614174000'
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .expect(401)

      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('Order validation', () => {
    it('should validate total amount is greater than zero', () => {
      const cartItems = [
        { product_price: '10.00', quantity: 2 },
        { product_price: '5.50', quantity: 1 }
      ]

      const totalAmount = cartItems.reduce((sum, item) => {
        return sum + (parseFloat(item.product_price) * item.quantity)
      }, 0)

      expect(totalAmount).toBe(25.50)
      expect(totalAmount).toBeGreaterThan(0)
    })

    it('should handle decimal precision in calculations', () => {
      const cartItems = [
        { product_price: '10.99', quantity: 2 },
        { product_price: '25.50', quantity: 1 }
      ]

      const totalAmount = cartItems.reduce((sum, item) => {
        return sum + (parseFloat(item.product_price) * item.quantity)
      }, 0)

      expect(totalAmount).toBe(47.48)
    })
  })

  describe('UUID validation', () => {
    it('should validate UUID format correctly', () => {
      const isValidUUID = (id) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        return uuidRegex.test(id)
      }

      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
      expect(isValidUUID('invalid-id')).toBe(false)
      expect(isValidUUID('')).toBe(false)
      expect(isValidUUID('123')).toBe(false)
    })
  })
})