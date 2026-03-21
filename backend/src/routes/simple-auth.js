import express from 'express'
import bcrypt from 'bcrypt'
import { query } from '../database/connection.js'

const router = express.Router()

// Simple token storage (in production, use Redis or database)
const activeSessions = new Map()

// Generate simple session token
const generateToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Handle OPTIONS requests for CORS preflight
router.options('*', (req, res) => {
  res.status(200).end()
})

// Simple auth middleware
export const simpleAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-auth-token']
  
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({
      error: 'Authentication required - please login again',
      code: 'UNAUTHORIZED'
    })
  }
  
  const user = activeSessions.get(token)
  
  if (!user) {
    return res.status(401).json({
      error: 'Invalid token - please login again',
      code: 'UNAUTHORIZED'
    })
  }
  
  req.user = user
  next()
}

// Simple admin auth middleware
export const simpleAdminAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-auth-token']
  
  console.log('Admin auth check - Token:', token ? token.substring(0, 10) + '...' : 'none');
  console.log('Active sessions count:', activeSessions.size);
  
  if (!token || !activeSessions.has(token)) {
    console.log('Admin auth failed: No valid token');
    return res.status(401).json({
      error: 'Authentication required - please login again',
      code: 'UNAUTHORIZED'
    })
  }
  
  const user = activeSessions.get(token)
  
  if (!user) {
    console.log('Admin auth failed: User not found for token');
    return res.status(401).json({
      error: 'Invalid token - please login again',
      code: 'UNAUTHORIZED'
    })
  }
  
  if (!user.isAdmin) {
    console.log('Admin auth failed: User is not admin:', user.email);
    return res.status(403).json({
      error: 'Admin access required',
      code: 'FORBIDDEN'
    })
  }
  
  console.log('Admin auth success:', user.email);
  req.user = user
  next()
}

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', { email: req.body?.email, hasPassword: !!req.body?.password });
    
    const { email, password } = req.body

    if (!email || !password) {
      console.log('Login failed: Missing credentials');
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
      console.log('Login failed: User not found:', email);
      return res.status(401).json({
        error: 'Invalid credentials'
      })
    }

    const user = result.rows[0]

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      console.log('Login failed: Invalid password for:', email);
      return res.status(401).json({
        error: 'Invalid credentials'
      })
    }

    // Generate token
    const token = generateToken()
    
    // Store session
    activeSessions.set(token, {
      id: user.id,
      email: user.email,
      isAdmin: user.is_admin
    })

    console.log('Login successful:', email, 'Token:', token.substring(0, 10) + '...');

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
    
    // Store session
    activeSessions.set(token, {
      id: user.id,
      email: user.email,
      isAdmin: user.is_admin
    })

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
router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-auth-token']
  
  if (token) {
    activeSessions.delete(token)
  }
  
  res.json({ message: 'Logged out' })
})

// Get current user
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-auth-token']
  
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({
      error: 'Not authenticated'
    })
  }
  
  const user = activeSessions.get(token)
  res.json({ user })
})

export default router