import { query, closePool } from './connection.js'
import config from '../config/environment.js'

const healthCheck = async () => {
  console.log('🏥 Database Health Check')
  console.log('========================\n')

  const checks = []

  try {
    // 1. Connection test
    console.log('1. Testing database connection...')
    const connectionResult = await query('SELECT NOW() as current_time, version() as version')
    checks.push({
      name: 'Database Connection',
      status: 'PASS',
      details: `Connected at ${connectionResult.rows[0].current_time}`
    })
    console.log('✅ Database connection successful')

    // 2. Check if migrations table exists
    console.log('\n2. Checking migrations table...')
    const migrationsCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `)
    const migrationsExist = migrationsCheck.rows[0].exists
    checks.push({
      name: 'Migrations Table',
      status: migrationsExist ? 'PASS' : 'FAIL',
      details: migrationsExist ? 'Migrations table exists' : 'Migrations table missing - run npm run migrate'
    })
    console.log(migrationsExist ? '✅ Migrations table exists' : '❌ Migrations table missing')

    // 3. Check core tables
    console.log('\n3. Checking core tables...')
    const tables = ['users', 'products', 'orders', 'order_items', 'cart_items']
    for (const table of tables) {
      const tableCheck = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table])
      const tableExists = tableCheck.rows[0].exists
      checks.push({
        name: `Table: ${table}`,
        status: tableExists ? 'PASS' : 'FAIL',
        details: tableExists ? 'Table exists' : 'Table missing'
      })
      console.log(tableExists ? `✅ Table '${table}' exists` : `❌ Table '${table}' missing`)
    }

    // 4. Check data counts
    console.log('\n4. Checking data counts...')
    for (const table of tables) {
      try {
        const countResult = await query(`SELECT COUNT(*) as count FROM ${table}`)
        const count = parseInt(countResult.rows[0].count)
        checks.push({
          name: `Data: ${table}`,
          status: 'INFO',
          details: `${count} records`
        })
        console.log(`📊 Table '${table}': ${count} records`)
      } catch (error) {
        checks.push({
          name: `Data: ${table}`,
          status: 'FAIL',
          details: `Error counting records: ${error.message}`
        })
        console.log(`❌ Error counting '${table}': ${error.message}`)
      }
    }

    // 5. Check admin user
    console.log('\n5. Checking admin user...')
    const adminCheck = await query('SELECT id, email FROM users WHERE is_admin = true LIMIT 1')
    const hasAdmin = adminCheck.rows.length > 0
    checks.push({
      name: 'Admin User',
      status: hasAdmin ? 'PASS' : 'WARN',
      details: hasAdmin ? `Admin user: ${adminCheck.rows[0].email}` : 'No admin user found - run npm run seed'
    })
    console.log(hasAdmin ? `✅ Admin user exists: ${adminCheck.rows[0].email}` : '⚠️  No admin user found')

    // 6. Check database constraints
    console.log('\n6. Checking database constraints...')
    const constraintsCheck = await query(`
      SELECT COUNT(*) as count 
      FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND constraint_type IN ('FOREIGN KEY', 'CHECK', 'UNIQUE')
    `)
    const constraintCount = parseInt(constraintsCheck.rows[0].count)
    checks.push({
      name: 'Database Constraints',
      status: constraintCount > 0 ? 'PASS' : 'WARN',
      details: `${constraintCount} constraints found`
    })
    console.log(`📋 Database constraints: ${constraintCount} found`)

  } catch (error) {
    checks.push({
      name: 'Health Check',
      status: 'FAIL',
      details: error.message
    })
    console.error('❌ Health check failed:', error.message)
  }

  // Summary
  console.log('\n📋 Health Check Summary')
  console.log('=======================')
  const passed = checks.filter(c => c.status === 'PASS').length
  const failed = checks.filter(c => c.status === 'FAIL').length
  const warnings = checks.filter(c => c.status === 'WARN').length
  const info = checks.filter(c => c.status === 'INFO').length

  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⚠️  Warnings: ${warnings}`)
  console.log(`📊 Info: ${info}`)

  if (failed > 0) {
    console.log('\n🔧 Recommended Actions:')
    checks.filter(c => c.status === 'FAIL').forEach(check => {
      console.log(`• ${check.name}: ${check.details}`)
    })
  }

  console.log(`\n🌐 Environment: ${config.NODE_ENV}`)
  console.log(`🔗 Database URL: ${config.DATABASE_URL?.replace(/:[^:@]*@/, ':***@') || 'Not configured'}`)

  return {
    overall: failed === 0 ? 'HEALTHY' : 'UNHEALTHY',
    checks,
    summary: { passed, failed, warnings, info }
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  healthCheck().finally(() => closePool())
}

export { healthCheck }