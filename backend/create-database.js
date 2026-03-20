import pg from 'pg'
const { Client } = pg

// Connect to PostgreSQL without specifying a database
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres', // Change this if your password is different
})

async function createDatabase() {
  try {
    await client.connect()
    console.log('✅ Connected to PostgreSQL server')
    
    // Check if database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'ecommerce_db'"
    )
    
    if (result.rows.length > 0) {
      console.log('ℹ️  Database ecommerce_db already exists')
    } else {
      // Create the database
      await client.query('CREATE DATABASE ecommerce_db')
      console.log('✅ Database ecommerce_db created successfully')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

createDatabase()
