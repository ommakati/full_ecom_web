import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { query, closePool } from './connection.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create migrations table to track applied migrations
const createMigrationsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `
  await query(createTableQuery)
}

// Get list of applied migrations
const getAppliedMigrations = async () => {
  const result = await query('SELECT filename FROM migrations ORDER BY id')
  return result.rows.map(row => row.filename)
}

// Apply a single migration
const applyMigration = async (filename, sql) => {
  console.log(`Applying migration: ${filename}`)
  
  try {
    // Execute the migration SQL
    await query(sql)
    
    // Record the migration as applied
    await query('INSERT INTO migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING', [filename])
    
    console.log(`✓ Migration ${filename} applied successfully`)
  } catch (error) {
    // If error is about objects already existing, mark as applied anyway
    if (error.message.includes('already exists')) {
      console.log(`⚠️  Migration ${filename} objects already exist, marking as applied`)
      await query('INSERT INTO migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING', [filename])
    } else {
      console.error(`✗ Failed to apply migration ${filename}:`, error.message)
      throw error
    }
  }
}

// Main migration function
const runMigrations = async () => {
  try {
    console.log('📦 Starting database migrations...')
    
    // Create migrations table if it doesn't exist
    await createMigrationsTable()
    
    // Get list of applied migrations
    const appliedMigrations = await getAppliedMigrations()
    console.log(`Found ${appliedMigrations.length} previously applied migrations`)
    
    // Read migration files from the migrations directory
    const migrationsDir = path.join(__dirname, 'migrations')
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()
    
    console.log(`Found ${migrationFiles.length} migration files`)
    
    // Apply pending migrations
    let appliedCount = 0
    for (const filename of migrationFiles) {
      if (!appliedMigrations.includes(filename)) {
        const filePath = path.join(migrationsDir, filename)
        const sql = fs.readFileSync(filePath, 'utf8')
        await applyMigration(filename, sql)
        appliedCount++
      } else {
        console.log(`⏭ Skipping already applied migration: ${filename}`)
      }
    }
    
    if (appliedCount === 0) {
      console.log('✅ All migrations are up to date')
    } else {
      console.log(`✅ Applied ${appliedCount} new migrations`)
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    // Don't close pool when called from server startup
    if (import.meta.url === `file://${process.argv[1]}`) {
      await closePool()
    }
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
}

export { runMigrations }