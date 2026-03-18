import pg from 'pg'
import { getDatabaseConfig } from '../config/database.js'

const { Pool } = pg

// Get database configuration for current environment
const dbConfig = getDatabaseConfig()

// Create connection pool
const pool = new Pool(dbConfig)

// Test database connection
pool.on('connect', () => {
  console.log(`✅ Connected to PostgreSQL database (${process.env.NODE_ENV || 'development'})`)
})

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client:', err)
})

// Helper function to execute queries
export const query = async (text, params) => {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    
    // Only log queries in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount })
    }
    
    return res
  } catch (error) {
    console.error('❌ Database query error:', error)
    throw error
  }
}

// Helper function to get a client from the pool
export const getClient = async () => {
  return await pool.connect()
}

// Helper function to close the pool
export const closePool = async () => {
  await pool.end()
}

// Helper function to test database connection
export const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW() as current_time')
    console.log('✅ PostgreSQL connection test successful:', result.rows[0].current_time)
    return true
  } catch (error) {
    console.error('❌ Database connection test failed:', error)
    return false
  }
}

export default pool