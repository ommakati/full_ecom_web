// Main routes index - organizes all API routes
import express from 'express'
import { testConnection } from '../database/connection.js'
import authRoutes from './auth.js'
import productRoutes from './products.js'
import cartRoutes from './cart.js'
import orderRoutes from './orders.js'

const router = express.Router()

// Health check route
router.get('/health', async (req, res) => {
  try {
    const dbConnected = await testConnection()
    res.json({ 
      status: 'OK', 
      message: 'E-Commerce API is running',
      environment: process.env.NODE_ENV || 'development',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Service unavailable',
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    })
  }
})

// API Routes
router.use('/auth', authRoutes)
router.use('/products', productRoutes)
router.use('/cart', cartRoutes)
router.use('/orders', orderRoutes)

export default router