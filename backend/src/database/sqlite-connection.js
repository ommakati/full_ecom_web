import sqlite3 from 'sqlite3'
import { promisify } from 'util'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create SQLite database file in the backend directory
const dbPath = path.join(__dirname, '../../ecommerce.db')

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err)
  } else {
    console.log('Connected to SQLite database')
  }
})

// Promisify database methods
const dbRun = promisify(db.run.bind(db))
const dbGet = promisify(db.get.bind(db))
const dbAll = promisify(db.all.bind(db))

// Helper function to execute queries (compatible with PostgreSQL interface)
export const query = async (text, params = []) => {
  try {
    // Convert PostgreSQL syntax to SQLite syntax
    let sqliteQuery = text
      .replace(/\$(\d+)/g, '?') // Replace $1, $2, etc. with ?
      .replace(/RETURNING \*/g, '') // Remove RETURNING clauses
      .replace(/RETURNING [^;]+/g, '') // Remove specific RETURNING clauses
      .replace(/gen_random_uuid\(\)/g, "lower(hex(randomblob(16)))") // UUID generation
      .replace(/CURRENT_TIMESTAMP/g, "datetime('now')") // Timestamp
      .replace(/BOOLEAN/g, 'INTEGER') // Boolean to integer
      .replace(/UUID/g, 'TEXT') // UUID to text
      .replace(/DECIMAL\(\d+,\d+\)/g, 'REAL') // Decimal to real
      .replace(/VARCHAR\(\d+\)/g, 'TEXT') // VARCHAR to text
      .replace(/TEXT\s+NOT\s+NULL/g, 'TEXT NOT NULL') // Clean up spacing
    
    // Handle INSERT queries that need to return the inserted row
    if (text.includes('RETURNING')) {
      const insertMatch = text.match(/INSERT INTO (\w+) \([^)]+\) VALUES \([^)]+\)/i)
      if (insertMatch) {
        const tableName = insertMatch[1]
        await dbRun(sqliteQuery, params)
        // Get the last inserted row
        const result = await dbGet(`SELECT * FROM ${tableName} WHERE rowid = last_insert_rowid()`)
        return { rows: result ? [result] : [], rowCount: result ? 1 : 0 }
      }
    }
    
    // Handle SELECT queries
    if (text.trim().toUpperCase().startsWith('SELECT')) {
      const rows = await dbAll(sqliteQuery, params)
      return { rows: rows || [], rowCount: rows ? rows.length : 0 }
    }
    
    // Handle UPDATE/DELETE queries
    const result = await dbRun(sqliteQuery, params)
    return { rows: [], rowCount: result.changes || 0 }
    
  } catch (error) {
    console.error('SQLite query error:', error)
    console.error('Original query:', text)
    console.error('Converted query:', sqliteQuery)
    throw error
  }
}

// Helper function to test database connection
export const testConnection = async () => {
  try {
    await query("SELECT datetime('now') as current_time")
    console.log('SQLite database connection test successful')
    return true
  } catch (error) {
    console.error('SQLite database connection test failed:', error)
    return false
  }
}

// Helper function to close the database
export const closePool = async () => {
  return new Promise((resolve) => {
    db.close((err) => {
      if (err) {
        console.error('Error closing SQLite database:', err)
      } else {
        console.log('SQLite database connection closed')
      }
      resolve()
    })
  })
}

// Initialize database tables
export const initializeTables = async () => {
  try {
    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `)
    
    // Products table
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL CHECK (price >= 0),
        image_url TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `)
    
    // Orders table
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL,
        total_amount REAL NOT NULL CHECK (total_amount >= 0),
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `)
    
    // Order items table
    await query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        price REAL NOT NULL CHECK (price >= 0),
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `)
    
    // Cart items table
    await query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        session_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(session_id, product_id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `)
    
    console.log('✓ SQLite database tables initialized')
    
    // Auto-seed the database
    const { seedSQLiteDatabase } = await import('./sqlite-seed.js')
    await seedSQLiteDatabase()
    
    return true
  } catch (error) {
    console.error('Failed to initialize SQLite tables:', error)
    return false
  }
}

export default db