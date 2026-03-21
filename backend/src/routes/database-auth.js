import express from 'express'
import bcrypt from 'bcrypt'
import { query } from '../database/connection.js'

const router = express.Router()

// Generate simple session token
const generateToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Database-backed auth middleware
export const dbAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-auth-token']
    
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required - no token provided'
      })
    }

    // Check token in database
    const result = await query(
      'SELECT u.id, u.email, u.is_admin FROM users u JOIN user_sessions s ON u.id = s.user_id WHERE s.token = $1 AND s.expires_at > NOW()',
      [token]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid or expired token - please login again'
      })
    }

    req.user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      isAdmin: result.rows[0].is_admin
    }
    
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({
      error: 'Authentication error'
    })
  }
}

// Database-backed admin auth middleware
export const dbAdminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-auth-token']
    
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required - no token provided'
      })
    }

    // Check token in database
    const result = await query(
      'SELECT u.id, u.email, u.is_admin FROM users u JOIN user_sessions s ON u.id = s.user_id WHERE s.token = $1 AND s.expires_at > NOW()',
      [token]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid or expired token - please login again'
      })
    }

    const user = result.rows[0]
    
    if (!user.is_admin) {
      return res.status(403).json({
        error: 'Admin access required'
      })
    }

    req.user = {
      id: user.id,
      email: user.email,
      isAdmin: user.is_admin
    }
    
    next()
  } catch (error) {
    console.error('Admin auth middleware error:', error)
    res.status(500).json({
      error: 'Authentication error'
    })
  }
}

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      })
    }

    // Find user
    const result = await query(
      'SELECT id, email, password_hash, is_admin FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials'
      })
    }

    const user = result.rows[0]

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid credentials'
      })
    }

    // Generate token
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store token in database
    await query(
      'INSERT INTO user_sessions (user_id, token, expires_at) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3',
      [user.id, token, expiresAt]
    )

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.is_admin
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: 'Login failed'
    })
  }
})

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      })
    }

    // Check if user exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'User already exists'
      })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const result = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, is_admin',
      [email, passwordHash]
    )

    const user = result.rows[0]

    // Generate token
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store token in database
    await query(
      'INSERT INTO user_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    )

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.is_admin
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({
      error: 'Registration failed'
    })
  }
})

// Logout endpoint
router.post('/logout', dbAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-auth-token']
    
    if (token) {
      await query('DELETE FROM user_sessions WHERE token = $1', [token])
    }
    
    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      error: 'Logout failed'
    })
  }
})

// Get current user
router.get('/me', dbAuth, async (req, res) => {
  res.json({ user: req.user })
})

export default router