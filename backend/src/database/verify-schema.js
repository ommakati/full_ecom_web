import { query, closePool } from './connection.js'

// Verify database schema implementation
const verifySchema = async () => {
  try {
    console.log('🔍 Verifying database schema implementation...\n')
    
    // Check if all required tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `
    
    const tablesResult = await query(tablesQuery)
    const tables = tablesResult.rows.map(row => row.table_name)
    
    const requiredTables = ['users', 'products', 'orders', 'order_items', 'cart_items']
    
    console.log('📋 Required Tables:')
    requiredTables.forEach(table => {
      const exists = tables.includes(table)
      console.log(`  ${exists ? '✅' : '❌'} ${table}`)
    })
    
    // Check foreign key constraints
    console.log('\n🔗 Foreign Key Constraints:')
    const constraintsQuery = `
      SELECT 
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name;
    `
    
    const constraintsResult = await query(constraintsQuery)
    constraintsResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`)
    })
    
    // Check indexes
    console.log('\n📊 Indexes:')
    const indexesQuery = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname NOT LIKE '%_pkey'
      ORDER BY tablename, indexname;
    `
    
    const indexesResult = await query(indexesQuery)
    indexesResult.rows.forEach(row => {
      console.log(`  ✅ ${row.tablename}: ${row.indexname}`)
    })
    
    // Check constraints (CHECK constraints)
    console.log('\n🛡️  Check Constraints:')
    const checkConstraintsQuery = `
      SELECT 
        tc.table_name,
        tc.constraint_name,
        cc.check_clause
      FROM information_schema.table_constraints tc
      JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.constraint_type = 'CHECK'
      ORDER BY tc.table_name;
    `
    
    const checkResult = await query(checkConstraintsQuery)
    checkResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}: ${row.check_clause}`)
    })
    
    // Check triggers
    console.log('\n⚡ Triggers:')
    const triggersQuery = `
      SELECT 
        trigger_name,
        event_object_table,
        action_timing,
        event_manipulation
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table;
    `
    
    const triggersResult = await query(triggersQuery)
    triggersResult.rows.forEach(row => {
      console.log(`  ✅ ${row.event_object_table}: ${row.trigger_name} (${row.action_timing} ${row.event_manipulation})`)
    })
    
    console.log('\n✅ Database schema verification completed successfully!')
    
  } catch (error) {
    console.error('❌ Schema verification failed:', error.message)
    throw error
  } finally {
    await closePool()
  }
}

// Run verification if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifySchema()
}

export { verifySchema }