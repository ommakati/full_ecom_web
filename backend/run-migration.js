import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { query, closePool } from './src/database/connection.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runMigration() {
  try {
    console.log('📦 Running database migration...\n')
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'src/database/migrations/001_create_tables.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('Executing SQL migration...')
    
    // Execute the entire SQL file at once
    console.log('Executing migration SQL...\n')
    
    try {
      await query(sql)
      console.log('✓ All statements executed successfully')
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Some objects already exist (this is OK)')
      } else {
        console.error('✗ Error:', error.message)
        throw error
      }
    }
    
    console.log('\n✅ Migration completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await closePool()
  }
}

runMigration()
