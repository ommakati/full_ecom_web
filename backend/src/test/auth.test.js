import request from 'supertest'
import express from 'express'
import session from 'express-session'
import { query } from '../database/connection.js'
import authRoutes from '../routes/auth.js'

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
  return app
}

describe('Authentication System', () => {
  let app
  const testUser = {
    email: 'test@example.com',
    password: 'testpassword123'
  }

  beforeAll(() => {
    app = createTestApp()
  })

  beforeEach(async () => {
    // Clean up test user before each test
    await query('DELETE FROM users WHERE email = $1', [testUser.email])
  })

  afterEach(async () => {
    // Clean up test user after each test
    await query('DELETE FROM users WHERE email = $1', [testUser.email])
  })

  describe('POST /auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(201)

      expect(response.body.user).toBeDefined()
      expect(response.body.user.email).toBe(testUser.email)
      expect(response.body.user.id).toBeDefined()
      expect(response.body.user.isAdmin).toBe(false)
      expect(response.body.user.createdAt).toBeDefined()
      
      // Verify user was created in database
      const dbUser = await query('SELECT * FROM users WHERE email = $1', [testUser.email])
      expect(dbUser.rows.length).toBe(1)
    })

    it('should reject registration with missing email', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ password: testUser.password })
        .expect(400)

      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.details).toContainEqual({
        field: 'email',
        message: 'Email is required'
      })
    })

    it('should reject registration with missing password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ email: testUser.email })
        .expect(400)

      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.details).toContainEqual({
        field: 'password',
        message: 'Password is required'
      })
    })

    it('should reject registration with invalid email format', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ email: 'invalid-email', password: testUser.password })
        .expect(400)

      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.details).toContainEqual({
        field: 'email',
        message: 'Email format is invalid'
      })
    })

    it('should reject registration with short password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ email: testUser.email, password: '123' })
        .expect(400)

      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.details).toContainEqual({
        field: 'password',
        message: 'Password must be at least 6 characters long'
      })
    })

    it('should reject registration with duplicate email', async () => {
      // First registration
      await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(201)

      // Second registration with same email
      const response = await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(409)

      expect(response.body.error.code).toBe('USER_EXISTS')
    })
  })

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create test user for login tests
      await request(app)
        .post('/auth/register')
        .send(testUser)
    })

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send(testUser)
        .expect(200)

      expect(response.body.user).toBeDefined()
      expect(response.body.user.email).toBe(testUser.email)
      expect(response.body.user.id).toBeDefined()
    })

    it('should reject login with missing email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ password: testUser.password })
        .expect(400)

      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: testUser.email })
        .expect(400)

      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: testUser.password })
        .expect(401)

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS')
    })

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401)

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS')
    })
  })

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(200)

      expect(response.body.message).toBe('Logged out successfully')
    })

    it('should handle logout when no session exists', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(200)

      expect(response.body.message).toBe('No active session')
    })
  })

  describe('GET /auth/profile', () => {
    it('should return user profile when authenticated', async () => {
      // Register and login
      const agent = request.agent(app)
      await agent.post('/auth/register').send(testUser)
      
      const response = await agent
        .get('/auth/profile')
        .expect(200)

      expect(response.body.user).toBeDefined()
      expect(response.body.user.email).toBe(testUser.email)
    })

    it('should reject profile request when not authenticated', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .expect(401)

      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })
  })
})