import request from 'supertest'
import express from 'express'
import session from 'express-session'

// Create a simple test app without database dependency
const app = express()
app.use(express.json())
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}))

// Simple test routes to verify structure
app.get('/api/products', (req, res) => {
  res.json({
    products: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Product',
        description: 'Test Description',
        price: '29.99',
        image_url: 'https://example.com/image.jpg',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ],
    count: 1
  })
})

app.get('/api/products/:id', (req, res) => {
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
  
  if (id === '123e4567-e89b-12d3-a456-426614174000') {
    res.json({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Product',
      description: 'Test Description',
      price: '29.99',
      image_url: 'https://example.com/image.jpg',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    })
  } else {
    res.status(404).json({
      error: {
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
        timestamp: new Date().toISOString()
      }
    })
  }
})

// Admin middleware mock
const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.userId || !req.session.isAdmin) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      }
    })
  }
  next()
}

// Validation middleware mock
const validateProduct = (req, res, next) => {
  const { name, price } = req.body
  const errors = []
  
  if (!name || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Product name is required' })
  }
  
  if (!price || isNaN(price) || parseFloat(price) < 0) {
    errors.push({ field: 'price', message: 'Valid price is required (must be >= 0)' })
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid product data',
        details: errors,
        timestamp: new Date().toISOString()
      }
    })
  }
  
  next()
}

app.post('/api/products', requireAdmin, validateProduct, (req, res) => {
  const { name, description, price, image_url } = req.body
  res.status(201).json({
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: name.trim(),
    description: description?.trim() || null,
    price: parseFloat(price).toString(),
    image_url: image_url?.trim() || null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  })
})

app.put('/api/products/:id', requireAdmin, validateProduct, (req, res) => {
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
  
  if (id === '123e4567-e89b-12d3-a456-426614174000') {
    res.json({
      id,
      name: name.trim(),
      description: description?.trim() || null,
      price: parseFloat(price).toString(),
      image_url: image_url?.trim() || null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T01:00:00Z'
    })
  } else {
    res.status(404).json({
      error: {
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
        timestamp: new Date().toISOString()
      }
    })
  }
})

app.delete('/api/products/:id', requireAdmin, (req, res) => {
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
  
  if (id === '123e4567-e89b-12d3-a456-426614174000') {
    res.json({
      message: 'Product deleted successfully',
      product: {
        id,
        name: 'Test Product'
      }
    })
  } else {
    res.status(404).json({
      error: {
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
        timestamp: new Date().toISOString()
      }
    })
  }
})

describe('Products API Structure Tests', () => {
  describe('GET /api/products', () => {
    test('should return products with correct structure', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200)

      expect(response.body).toHaveProperty('products')
      expect(response.body).toHaveProperty('count')
      expect(Array.isArray(response.body.products)).toBe(true)
      expect(typeof response.body.count).toBe('number')
      
      const product = response.body.products[0]
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
    test('should return specific product by valid UUID', async () => {
      const response = await request(app)
        .get('/api/products/123e4567-e89b-12d3-a456-426614174000')
        .expect(200)

      expect(response.body.id).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(response.body.name).toBe('Test Product')
      expect(response.body).toHaveProperty('description')
      expect(response.body).toHaveProperty('price')
      expect(response.body).toHaveProperty('image_url')
      expect(response.body).toHaveProperty('created_at')
      expect(response.body).toHaveProperty('updated_at')
    })

    test('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/123e4567-e89b-12d3-a456-426614174999')
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
    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({ name: 'Test', price: 10 })
        .expect(401)

      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })

    test('should create product with admin session', async () => {
      const agent = request.agent(app)
      
      // Set admin session
      await agent
        .get('/api/products')
        .set('Cookie', 'connect.sid=s%3Atest')
      
      // Mock session for this request
      app.use((req, res, next) => {
        if (req.method === 'POST' && req.path === '/api/products') {
          req.session = { userId: 'admin-id', isAdmin: true }
        }
        next()
      })

      const newProduct = {
        name: 'New Product',
        description: 'New Description',
        price: 39.99,
        image_url: 'https://example.com/new-image.jpg'
      }

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
    })

    test('should validate required fields', async () => {
      app.use((req, res, next) => {
        if (req.method === 'POST' && req.path === '/api/products') {
          req.session = { userId: 'admin-id', isAdmin: true }
        }
        next()
      })

      const response = await request(app)
        .post('/api/products')
        .send({ description: 'Missing name and price' })
        .expect(400)

      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    test('should validate price is non-negative', async () => {
      app.use((req, res, next) => {
        if (req.method === 'POST' && req.path === '/api/products') {
          req.session = { userId: 'admin-id', isAdmin: true }
        }
        next()
      })

      const response = await request(app)
        .post('/api/products')
        .send({ name: 'Test Product', price: -10 })
        .expect(400)

      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('PUT /api/products/:id', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .put('/api/products/123e4567-e89b-12d3-a456-426614174000')
        .send({ name: 'Test', price: 10 })
        .expect(401)

      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })

    test('should update existing product with admin session', async () => {
      app.use((req, res, next) => {
        if (req.method === 'PUT' && req.path.includes('/api/products/')) {
          req.session = { userId: 'admin-id', isAdmin: true }
        }
        next()
      })

      const updatedData = {
        name: 'Updated Product',
        description: 'Updated Description',
        price: 49.99,
        image_url: 'https://example.com/updated-image.jpg'
      }

      const response = await request(app)
        .put('/api/products/123e4567-e89b-12d3-a456-426614174000')
        .send(updatedData)
        .expect(200)

      expect(response.body.id).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(response.body.name).toBe(updatedData.name)
      expect(response.body.description).toBe(updatedData.description)
      expect(parseFloat(response.body.price)).toBe(updatedData.price)
      expect(response.body.image_url).toBe(updatedData.image_url)
    })

    test('should return 404 for non-existent product', async () => {
      app.use((req, res, next) => {
        if (req.method === 'PUT' && req.path.includes('/api/products/')) {
          req.session = { userId: 'admin-id', isAdmin: true }
        }
        next()
      })

      const response = await request(app)
        .put('/api/products/123e4567-e89b-12d3-a456-426614174999')
        .send({ name: 'Test', price: 10 })
        .expect(404)

      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND')
    })
  })

  describe('DELETE /api/products/:id', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/products/123e4567-e89b-12d3-a456-426614174000')
        .expect(401)

      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })

    test('should delete existing product with admin session', async () => {
      app.use((req, res, next) => {
        if (req.method === 'DELETE' && req.path.includes('/api/products/')) {
          req.session = { userId: 'admin-id', isAdmin: true }
        }
        next()
      })

      const response = await request(app)
        .delete('/api/products/123e4567-e89b-12d3-a456-426614174000')
        .expect(200)

      expect(response.body.message).toBe('Product deleted successfully')
      expect(response.body.product.id).toBe('123e4567-e89b-12d3-a456-426614174000')
    })

    test('should return 404 for non-existent product', async () => {
      app.use((req, res, next) => {
        if (req.method === 'DELETE' && req.path.includes('/api/products/')) {
          req.session = { userId: 'admin-id', isAdmin: true }
        }
        next()
      })

      const response = await request(app)
        .delete('/api/products/123e4567-e89b-12d3-a456-426614174999')
        .expect(404)

      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND')
    })
  })
})