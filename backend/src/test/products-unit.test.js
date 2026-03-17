import request from 'supertest'
import express from 'express'
import session from 'express-session'
import productsRouter from '../routes/products.js'

// Mock the database connection
const mockQuery = jest.fn()
jest.unstable_mockModule('../database/connection.js', () => ({
  query: mockQuery
}))

// Import after mocking
const { query } = await import('../database/connection.js')

// Create test app
const app = express()
app.use(express.json())
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}))

// Mock admin session middleware
app.use((req, res, next) => {
  if (req.path.includes('/api/products') && (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE')) {
    req.session = { userId: 'admin-id', isAdmin: true }
  }
  next()
})

app.use('/api/products', productsRouter)

describe('Products API Unit Tests', () => {
  beforeEach(() => {
    mockQuery.mockClear()
  })

  describe('GET /api/products', () => {
    test('should return all products with correct structure', async () => {
      const mockProducts = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test Product',
          description: 'Test Description',
          price: '29.99',
          image_url: 'https://example.com/image.jpg',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockQuery.mockResolvedValue({ rows: mockProducts })

      const response = await request(app)
        .get('/api/products')
        .expect(200)

      expect(response.body).toHaveProperty('products')
      expect(response.body).toHaveProperty('count')
      expect(response.body.products).toEqual(mockProducts)
      expect(response.body.count).toBe(1)
      expect(query).toHaveBeenCalledWith(
        'SELECT id, name, description, price, image_url, created_at, updated_at FROM products ORDER BY created_at DESC'
      )
    })

    test('should handle database errors gracefully', async () => {
      query.mockRejectedValue(new Error('Database connection failed'))

      const response = await request(app)
        .get('/api/products')
        .expect(500)

      expect(response.body.error.code).toBe('DATABASE_ERROR')
      expect(response.body.error.message).toBe('Failed to retrieve products')
    })
  })

  describe('GET /api/products/:id', () => {
    test('should return specific product by valid UUID', async () => {
      const mockProduct = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Product',
        description: 'Test Description',
        price: '29.99',
        image_url: 'https://example.com/image.jpg',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      query.mockResolvedValue({ rows: [mockProduct] })

      const response = await request(app)
        .get('/api/products/123e4567-e89b-12d3-a456-426614174000')
        .expect(200)

      expect(response.body).toEqual(mockProduct)
      expect(query).toHaveBeenCalledWith(
        'SELECT id, name, description, price, image_url, created_at, updated_at FROM products WHERE id = $1',
        ['123e4567-e89b-12d3-a456-426614174000']
      )
    })

    test('should return 404 for non-existent product', async () => {
      query.mockResolvedValue({ rows: [] })

      const response = await request(app)
        .get('/api/products/123e4567-e89b-12d3-a456-426614174000')
        .expect(404)

      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND')
    })

    test('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')
        .expect(400)

      expect(response.body.error.code).toBe('INVALID_ID')
      expect(query).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/products', () => {
    test('should create new product with valid data', async () => {
      const newProduct = {
        name: 'New Product',
        description: 'New Description',
        price: 39.99,
        image_url: 'https://example.com/new-image.jpg'
      }

      const mockCreatedProduct = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        ...newProduct,
        price: '39.99',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      query.mockResolvedValue({ rows: [mockCreatedProduct] })

      const response = await request(app)
        .post('/api/products')
        .send(newProduct)
        .expect(201)

      expect(response.body).toEqual(mockCreatedProduct)
      expect(query).toHaveBeenCalledWith(
        'INSERT INTO products (name, description, price, image_url) VALUES ($1, $2, $3, $4) RETURNING id, name, description, price, image_url, created_at, updated_at',
        ['New Product', 'New Description', 39.99, 'https://example.com/new-image.jpg']
      )
    })

    test('should validate required fields', async () => {
      const invalidProduct = {
        description: 'Missing name and price'
      }

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400)

      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(query).not.toHaveBeenCalled()
    })

    test('should validate price is non-negative', async () => {
      const invalidProduct = {
        name: 'Test Product',
        price: -10
      }

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400)

      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(query).not.toHaveBeenCalled()
    })
  })

  describe('PUT /api/products/:id', () => {
    test('should update existing product', async () => {
      const updatedData = {
        name: 'Updated Product',
        description: 'Updated Description',
        price: 49.99,
        image_url: 'https://example.com/updated-image.jpg'
      }

      const mockUpdatedProduct = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...updatedData,
        price: '49.99',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T01:00:00Z'
      }

      query.mockResolvedValue({ rows: [mockUpdatedProduct] })

      const response = await request(app)
        .put('/api/products/123e4567-e89b-12d3-a456-426614174000')
        .send(updatedData)
        .expect(200)

      expect(response.body).toEqual(mockUpdatedProduct)
      expect(query).toHaveBeenCalledWith(
        'UPDATE products SET name = $1, description = $2, price = $3, image_url = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, name, description, price, image_url, created_at, updated_at',
        ['Updated Product', 'Updated Description', 49.99, 'https://example.com/updated-image.jpg', '123e4567-e89b-12d3-a456-426614174000']
      )
    })

    test('should return 404 for non-existent product', async () => {
      query.mockResolvedValue({ rows: [] })

      const response = await request(app)
        .put('/api/products/123e4567-e89b-12d3-a456-426614174000')
        .send({ name: 'Test', price: 10 })
        .expect(404)

      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND')
    })
  })

  describe('DELETE /api/products/:id', () => {
    test('should delete existing product', async () => {
      const mockDeletedProduct = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Deleted Product'
      }

      query.mockResolvedValue({ rows: [mockDeletedProduct] })

      const response = await request(app)
        .delete('/api/products/123e4567-e89b-12d3-a456-426614174000')
        .expect(200)

      expect(response.body.message).toBe('Product deleted successfully')
      expect(response.body.product).toEqual(mockDeletedProduct)
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM products WHERE id = $1 RETURNING id, name',
        ['123e4567-e89b-12d3-a456-426614174000']
      )
    })

    test('should return 404 for non-existent product', async () => {
      query.mockResolvedValue({ rows: [] })

      const response = await request(app)
        .delete('/api/products/123e4567-e89b-12d3-a456-426614174000')
        .expect(404)

      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND')
    })
  })

  describe('Authentication', () => {
    test('should require admin for POST requests', async () => {
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
        .send({ name: 'Test', price: 10 })
        .expect(401)

      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })

    test('should require admin for PUT requests', async () => {
      const testApp = express()
      testApp.use(express.json())
      testApp.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      }))
      testApp.use('/api/products', productsRouter)

      const response = await request(testApp)
        .put('/api/products/123e4567-e89b-12d3-a456-426614174000')
        .send({ name: 'Test', price: 10 })
        .expect(401)

      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })

    test('should require admin for DELETE requests', async () => {
      const testApp = express()
      testApp.use(express.json())
      testApp.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      }))
      testApp.use('/api/products', productsRouter)

      const response = await request(testApp)
        .delete('/api/products/123e4567-e89b-12d3-a456-426614174000')
        .expect(401)

      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })
  })
})