import express from 'express'
import bcrypt from 'bcrypt'
import { query } from '../database/connection.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// Input validation helper
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePassword = (password) => {
  return password && password.length >= 6
}

// User registration endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
          details: [
            ...(!email ? [{ field: 'email', message: 'Email is required' }] : []),
            ...(!password ? [{ field: 'password', message: 'Password is required' }] : [])
          ],
          timestamp: new Date().toISOString()
        }
      })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format',
          details: [{ field: 'email', message: 'Email format is invalid' }],
          timestamp: new Date().toISOString()
        }
      })
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 6 characters long',
          details: [{ field: 'password', message: 'Password must be at least 6 characters long' }],
          timestamp: new Date().toISOString()
        }
      })
    }

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists',
          timestamp: new Date().toISOString()
        }
      })
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user
    const result = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, is_admin, created_at',
      [email, passwordHash]
    )

    const user = result.rows[0]

    // Create session
    req.session.userId = user.id
    req.session.email = user.email
    req.session.isAdmin = user.is_admin

    // Force session save before responding
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err)
        return res.status(500).json({
          error: {
            code: 'SESSION_ERROR',
            message: 'Failed to create session',
            timestamp: new Date().toISOString()
          }
        })
      }

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          isAdmin: user.is_admin,
          createdAt: user.created_at
        }
      })
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to register user',
        timestamp: new Date().toISOString()
      }
    })
  }
})

// User login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
          details: [
            ...(!email ? [{ field: 'email', message: 'Email is required' }] : []),
            ...(!password ? [{ field: 'password', message: 'Password is required' }] : [])
          ],
          timestamp: new Date().toISOString()
        }
      })
    }

    // Find user
    const result = await query(
      'SELECT id, email, password_hash, is_admin, created_at FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString()
        }
      })
    }

    const user = result.rows[0]

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString()
        }
      })
    }

    // Create session
    req.session.userId = user.id
    req.session.email = user.email
    req.session.isAdmin = user.is_admin

    // Force session save before responding
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err)
        return res.status(500).json({
          error: {
            code: 'SESSION_ERROR',
            message: 'Failed to create session',
            timestamp: new Date().toISOString()
          }
        })
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          isAdmin: user.is_admin,
          createdAt: user.created_at
        }
      })
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to login user',
        timestamp: new Date().toISOString()
      }
    })
  }
})

// User logout endpoint
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err)
        return res.status(500).json({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to logout user',
            timestamp: new Date().toISOString()
          }
        })
      }
      
      res.clearCookie('ecommerce.sid')
      res.json({
        message: 'Logged out successfully'
      })
    })
  } else {
    res.json({
      message: 'No active session'
    })
  }
})

// Get current user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, is_admin, created_at FROM users WHERE id = $1',
      [req.session.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString()
        }
      })
    }

    const user = result.rows[0]
    res.json({
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.is_admin,
        createdAt: user.created_at
      }
    })
  } catch (error) {
    console.error('Profile error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user profile',
        timestamp: new Date().toISOString()
      }
    })
  }
})

// Get current authenticated user (for checking auth status)
router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
        timestamp: new Date().toISOString()
      }
    })
  }

  res.json({
    user: {
      id: req.session.userId,
      email: req.session.email,
      isAdmin: req.session.isAdmin || false
    }
  })
})

export default router