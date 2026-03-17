import { runMigrations } from '../database/migrate.js'
import { seedDatabase } from '../database/seed.js'

const setup = async () => {
  try {
    console.log('🚀 Starting database setup...')
    
    // Run migrations
    console.log('\n📋 Running database migrations...')
    await runMigrations()
    
    // Seed database
    console.log('\n🌱 Seeding database with initial data...')
    await seedDatabase()
    
    console.log('\n✅ Database setup completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('1. Copy .env.example to .env and configure your database URL')
    console.log('2. Run "npm run dev" to start the development server')
    console.log('3. Visit http://localhost:5000/api/health to verify the server is running')
    
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message)
    process.exit(1)
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setup()
}

export { setup }