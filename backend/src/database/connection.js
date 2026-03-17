import pg from 'pg'
import { getDatabaseConfig } from '../config/database.js'

const { Pool } = pg

// Get database configuration for current environment
const dbConfig = getDatabaseConfig()

// Create connection pool
const pool = new Pool(dbConfig)

// Flag to track if we should use SQLite fallback
let useSQLiteFallback = false
let sqliteConnection = null

// Test database connection
pool.on('connect', () => {
  console.log(`Connected to PostgreSQL database (${process.env.NODE_ENV || 'development'})`)
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  // Don't exit, just log the error
  console.log('Switching to SQLite fallback mode')
  useSQLiteFallback = true
})

// Helper function to get SQLite connection
const getSQLiteConnection = async () => {
  if (!sqliteConnection) {
    const sqlite = await import('./sqlite-connection.js')
    sqliteConnection = sqlite
    await sqlite.initializeTables()
  }
  return sqliteConnection
}

// Helper function to execute queries
export const query = async (text, params) => {
  const start = Date.now()
  try {
    // Try PostgreSQL first if not in fallback mode
    if (!useSQLiteFallback) {
      try {
        const res = await pool.query(text, params)
        const duration = Date.now() - start
        
        // Only log queries in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Executed PostgreSQL query', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount })
        }
        
        return res
      } catch (pgError) {
        console.log('PostgreSQL query failed, switching to SQLite:', pgError.message)
        useSQLiteFallback = true
      }
    }
    
    // Use SQLite fallback
    const sqlite = await getSQLiteConnection()
    const res = await sqlite.query(text, params)
    const duration = Date.now() - start
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed SQLite query', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount })
    }
    
    return res
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

// Helper function to get a client from the pool
export const getClient = async () => {
  if (useSQLiteFallback) {
    // SQLite doesn't use connection pooling in the same way
    return null
  }
  return await pool.connect()
}

// Helper function to close the pool
export const closePool = async () => {
  if (useSQLiteFallback && sqliteConnection) {
    await sqliteConnection.closePool()
  } else {
    await pool.end()
  }
}

// Helper function to test database connection
export const testConnection = async () => {
  try {
    // Try PostgreSQL first
    if (!useSQLiteFallback) {
      try {
        const result = await pool.query('SELECT NOW() as current_time')
        console.log('PostgreSQL connection test successful:', result.rows[0].current_time)
        return true
      } catch (pgError) {
        console.log('PostgreSQL connection failed, trying SQLite fallback')
        useSQLiteFallback = true
      }
    }
    
    // Use SQLite fallback
    const sqlite = await getSQLiteConnection()
    const success = await sqlite.testConnection()
    if (success) {
      console.log('SQLite fallback connection successful')
    }
    return success
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}

export default pool