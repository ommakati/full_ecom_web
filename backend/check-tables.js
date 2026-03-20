import { query, closePool } from './src/database/connection.js'

async function checkTables() {
  try {
    console.log('Checking database tables...\n')
    
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    if (result.rows.length === 0) {
      console.log('❌ No tables found in database!')
      console.log('\nRun: npm run migrate')
    } else {
      console.log('✅ Found tables:')
      result.rows.forEach(row => {
        console.log(`  - ${row.table_name}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await closePool()
  }
}

checkTables()
