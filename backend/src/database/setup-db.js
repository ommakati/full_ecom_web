import dotenv from 'dotenv'
import pg from 'pg'

// Load environment files
dotenv.config({ path: '.env.development' })
dotenv.config({ path: '.env' })

const { Pool } = pg

const setupDatabase = async () => {
  console.log('🔧 Database Setup Utility')
  console.log('========================\n')

  // Test current connection
  console.log('1. Testing database connection...')
  
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL not configured')
  } else {
    console.log(`🔗 Attempting connection to: ${databaseUrl.replace(/:[^:@]*@/, ':***@')}`)
    
    try {
      const pool = new Pool({ connectionString: databaseUrl })
      const result = await pool.query('SELECT NOW() as current_time')
      console.log('✅ Database connection successful!')
      console.log(`📅 Server time: ${result.rows[0].current_time}`)
      await pool.end()
      
      console.log('\n🎉 Database is ready! You can now run:')
      console.log('• npm run migrate (to create tables)')
      console.log('• npm run seed (to add sample data)')
      console.log('• npm run setup (to do both)')
      console.log('• npm run health (to check database health)')
      return true
    } catch (error) {
      console.log('❌ Database connection failed:', error.message)
    }
  }

  // Provide setup instructions
  console.log('\n📋 Database Setup Instructions:')
  console.log('================================\n')
  
  console.log('Option 1: Local PostgreSQL Setup')
  console.log('---------------------------------')
  console.log('1. Install PostgreSQL:')
  console.log('   • Windows: Download from https://www.postgresql.org/download/windows/')
  console.log('   • macOS: brew install postgresql && brew services start postgresql')
  console.log('   • Ubuntu: sudo apt install postgresql postgresql-contrib')
  console.log('')
  console.log('2. Create databases:')
  console.log('   createdb ecommerce_dev')
  console.log('   createdb ecommerce_test')
  console.log('')
  console.log('3. Update .env.development with your credentials:')
  console.log('   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/ecommerce_dev')
  console.log('')
  
  console.log('Option 2: Cloud Database (Recommended for Production)')
  console.log('----------------------------------------------------')
  console.log('• Supabase: https://supabase.com (Free tier available)')
  console.log('• Railway: https://railway.app (Free tier available)')
  console.log('• Render: https://render.com (Free tier available)')
  console.log('')
  console.log('After setting up cloud database, update DATABASE_URL in your .env file')
  console.log('')
  
  console.log('Option 3: Docker PostgreSQL (Quick Setup)')
  console.log('-----------------------------------------')
  console.log('Run: docker run --name postgres-ecommerce -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15')
  console.log('Then: docker exec -it postgres-ecommerce createdb -U postgres ecommerce_dev')
  console.log('And:  docker exec -it postgres-ecommerce createdb -U postgres ecommerce_test')
  console.log('')
  
  console.log('After setting up your database, run:')
  console.log('• npm run migrate (to create tables)')
  console.log('• npm run seed (to add sample data)')
  console.log('• npm run setup (to do both)')
  console.log('• npm run health (to check database health)')

  return false
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  setupDatabase()
}

export { setupDatabase }