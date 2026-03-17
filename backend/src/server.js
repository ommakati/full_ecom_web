import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import session from 'express-session'
import dotenv from 'dotenv'
import { testConnection } from './database/connection.js'
import { rateLimit } from './middleware/rateLimiting.js'
import apiRoutes from './routes/index.js'

// Load environment-specific configuration
const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: `.env.${env}` })
dotenv.config() // Fallback to .env

const app = express()
const PORT = process.env.PORT || 5000

// Request logging middleware
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString()
  const method = req.method
  const url = req.url
  const userAgent = req.get('User-Agent') || 'Unknown'
  
  console.log(`[${timestamp}] ${method} ${url} - ${userAgent}`)
  
  // Log response time
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    const status = res.statusCode
    console.log(`[${timestamp}] ${method} ${url} - ${status} (${duration}ms)`)
  })
  
  next()
}

// Security and parsing middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Request logging (only in development)
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger)
}

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  name: 'ecommerce.sid' // Custom session name
}))

// Rate limiting
app.use('/api', rateLimit())

// API Routes
app.use('/api', apiRoutes)

// Input validation error handler
const handleValidationError = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }))
    
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors,
        timestamp: new Date().toISOString()
      }
    })
  }
  next(err)
}

// Database error handler
const handleDatabaseError = (err, req, res, next) => {
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        return res.status(409).json({
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'Resource already exists',
            timestamp: new Date().toISOString()
          }
        })
      case '23503': // Foreign key violation
        return res.status(400).json({
          error: {
            code: 'INVALID_REFERENCE',
            message: 'Referenced resource does not exist',
            timestamp: new Date().toISOString()
          }
        })
      case '23502': // Not null violation
        return res.status(400).json({
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Required field is missing',
            timestamp: new Date().toISOString()
          }
        })
    }
  }
  next(err)
}

// General error handling middleware
app.use(handleValidationError)
app.use(handleDatabaseError)

app.use((err, req, res, next) => {
  // Log error details (but don't expose them in production)
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  })
  
  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Something went wrong!',
      ...(isDevelopment && { stack: err.stack }),
      timestamp: new Date().toISOString()
    }
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      timestamp: new Date().toISOString()
    }
  })
})

// Start server
const startServer = async () => {
  try {
    // Test database connection before starting server
    const dbConnected = await testConnection()
    
    if (!dbConnected) {
      console.warn('⚠️  Database connection failed, but starting server anyway')
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`)
      console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
      console.log(`💾 Database: ${dbConnected ? '✓ Connected' : '✗ Disconnected'}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()