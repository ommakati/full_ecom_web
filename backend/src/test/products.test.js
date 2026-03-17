import request from 'supertest'
import express from 'express'
import session from 'express-session'
import { query } from '../database/connection.js'
import productsRouter from '../routes/products.js'

// Create test app
const app = express()
app.use(express.json())
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}))
app.use('/api/products', productsRouter)

// Test data
const testProduct = {
  name: 'Test Product',
  description: 'A test product description',
  price: 29.99,
  image_url: 'https://example.com/image.jpg'
}

const adminSession = {
  userId: 'test-admin-id',
  isAdmin: true
}

const userSession = {
  userId: 'test-user-id',
  isAdmin: false
}

describe('Products API', () => {
  let testProductId

  beforeAll(async () => {
    // Clean up any existing test data
    await query('DELETE FROM products WHERE name LIKE $1', ['Test%'])
  })

  afterAll(async () => {
    // Clean up test data
    await query('DELETE FROM products WHERE name LIKE $1', ['Test%'])
  })

  describe('GET /api/products', () => {
    test('should return all products', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200)

      expect(response.body).toHaveProperty('products')
      expect(response.body).toHaveProperty('count')
      expect(Array.isArray(response.body.products)).toBe(true)
      expect(typeof response.body.count).toBe('number')
    })

    test('should return products with correct structure', async () => {
      // First create a test product
      const createResult = await query(
        'INSERT INTO products (name, description, price, image_url) VALUES ($1, $2, $3, $4) RETURNING id',
        [testProduct.name, testProduct.description, testProduct.price, testProduct.image_url]
      )
      testProductId = createResult.rows[0].id

      const response = await request(app)
        .get('/api/products')
        .expect(200)

      const products = response.body.products
      expect(products.length).toBeGreaterThan(0)
      
      const product = products.find(p => p.id === testProductId)
      expect(product).toBeDefined()
      expect(product).toHaveProperty('id')
      expect(product).toHaveProperty('name')
      expect(product).toHaveProperty('description')
      expect(product).toHaveProperty('price')
      expect(product).toHaveProperty('image_url')
      expect(product).toHaveProperty('created_at')
      expect(product).toHaveProperty('updated_at')
    })
  })

  describe('GET /api/products/:id', () => {
    test('should return specific product by ID', async () => {
      const response = await request(app)
        .get(`/api/products/${testProductId}`)
        .expect(200)

      expect(response.body.id).toBe(testProductId)
      expect(response.body.name).toBe(testProduct.name)
      expect(response.body.description).toBe(testProduct.description)
      expect(parseFloat(response.body.price)).toBe(testProduct.price)
      expect(response.body.image_url).toBe(testProduct.image_url)
    })

    test('should return 404 for non-existent product', async () => {
      const nonExistentId = '12345678-1234-1234-1234-123456789012'
      const response = await request(app)
        .get(`/api/products/${nonExistentId}`)
        .expect(404)

      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND')
    })

    test('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')
        .expect(400)

      expect(response.body.error.code).toBe('INVALID_ID')
    })
  })

  describe('POST /api/products', () => {
    test('should create new product with admin authentication', async () => {
      const agent = request.agent(app)
      
      // Set up admin session
      await agent
        .get('/api/products')
        .set('Cookie', [`connect.sid=s%3A${Buffer.from(JSON.stringify(adminSession)).toString('base64')}`])

      const newProduct = {
        name: 'Test New Product',
        description: 'A new test product',
        price: 39.99,
        image_url: 'https://example.com/new-image.jpg'
      }

      // Mock session middleware for this test
      app.use((req, res, next) => {
        req.session = adminSession
        next()
      })

      const response = await request(app)
        .post('/api/products')
        .send(newProduct)
        .expect(201)

      expect(response.body.name).toBe(newProduct.name)
      expect(response.body.description).toBe(newProduct.description)
      expect(parseFloat(response.body.price)).toBe(newProduct.price)
      expect(response.body.image_url).toBe(newProduct.image_url)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('created_at')
      expect(response.body).toHaveProperty('updated_at')

      // Clean up
      await query('DELETE FROM products WHERE id = $1', [response.body.id])
    })

    test('should require admin authentication', async () => {
      // Remove session middleware
      const testApp = express()
      testApp.use(express.json())
      testApp.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      }))
      testApp.use('/api/products', productsRouter)

      const response = await request(testApp)
        .post('/api/products')
        .send(testProduct)
        .expect(401)

      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })

    test('should validate required fields', async () => {
      app.use((req, res, next) => {
        req.session = adminSession
        next()
      })

      const invalidProduct = {
        description: 'Missing name and price'
      }

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400)

      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    test('should validate price is non-negative', async () => {
      app.use((req, res, next) => {
        req.session = adminSession
        next()
      })

      const invalidProduct = {
        name: 'Test Product',
        price: -10
      }

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400)

      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('PUT /api/products/:id', () => {
    test('should update existing product with admin authentication', async () => {
      app.use((req, res, next) => {
        req.session = adminSession
        next()
      })

      const updatedData = {
        name: 'Updated Test Product',
        description: 'Updated description',
        price: 49.99,
        image_url: 'https://example.com/updated-image.jpg'
      }

      const response = await request(app)
        .put(`/api/products/${testProductId}`)
        .send(updatedData)
        .expect(200)

      expect(response.body.id).toBe(testProductId)
      expect(response.body.name).toBe(updatedData.name)
      expect(response.body.description).toBe(updatedData.description)
      expect(parseFloat(response.body.price)).toBe(updatedData.price)
      expect(response.body.image_url).toBe(updatedData.image_url)
    })

    test('should return 404 for non-existent product', async () => {
      app.use((req, res, next) => {
        req.session = adminSession
        next()
      })

      const nonExistentId = '12345678-1234-1234-1234-123456789012'
      const response = await request(app)
        .put(`/api/products/${nonExistentId}`)
        .send(testProduct)
        .expect(404)

      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND')
    })

    test('should require admin authentication', async () => {
      const testApp = express()
      testApp.use(express.json())
      testApp.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      }))
      testApp.use('/api/products', productsRouter)

      const response = await request(testApp)
        .put(`/api/products/${testProductId}`)
        .send(testProduct)
        .expect(401)

      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('DELETE /api/products/:id', () => {
    test('should delete existing product with admin authentication', async () => {
      // Create a product to delete
      const createResult = await query(
        'INSERT INTO products (name, description, price) VALUES ($1, $2, $3) RETURNING id',
        ['Product to Delete', 'Will be deleted', 19.99]
      )
      const productToDeleteId = createResult.rows[0].id

      app.use((req, res, next) => {
        req.session = adminSession
        next()
      })

      const response = await request(app)
        .delete(`/api/products/${productToDeleteId}`)
        .expect(200)

      expect(response.body.message).toBe('Product deleted successfully')
      expect(response.body.product.id).toBe(productToDeleteId)

      // Verify product is deleted
      const checkResult = await query('SELECT * FROM products WHERE id = $1', [productToDeleteId])
      expect(checkResult.rows.length).toBe(0)
    })

    test('should return 404 for non-existent product', async () => {
      app.use((req, res, next) => {
        req.session = adminSession
        next()
      })

      const nonExistentId = '12345678-1234-1234-1234-123456789012'
      const response = await request(app)
        .delete(`/api/products/${nonExistentId}`)
        .expect(404)

      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND')
    })

    test('should require admin authentication', async () => {
      const testApp = express()
      testApp.use(express.json())
      testApp.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      }))
      testApp.use('/api/products', productsRouter)

      const response = await request(testApp)
        .delete(`/api/products/${testProductId}`)
        .expect(401)

      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })
  })
})