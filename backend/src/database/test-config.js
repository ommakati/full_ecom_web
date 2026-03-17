import { getDatabaseConfig } from '../config/database.js'

// Test database configuration for different environments
const testConfigurations = () => {
  console.log('🧪 Testing database configurations...\n')
  
  const environments = ['development', 'test', 'production']
  
  environments.forEach(env => {
    try {
      // Temporarily set NODE_ENV
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = env
      
      const config = getDatabaseConfig()
      
      console.log(`✅ ${env.toUpperCase()} configuration:`)
      console.log(`   Connection String: ${config.connectionString ? '✓ Set' : '✗ Missing'}`)
      console.log(`   SSL: ${config.ssl ? 'Enabled' : 'Disabled'}`)
      console.log(`   Max Connections: ${config.max}`)
      console.log(`   Connection Timeout: ${config.connectionTimeoutMillis}ms`)
      console.log('')
      
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv
      
    } catch (error) {
      console.log(`❌ ${env.toUpperCase()} configuration failed:`)
      console.log(`   Error: ${error.message}`)
      console.log('')
    }
  })
  
  console.log('✅ Database configuration test completed')
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testConfigurations()
}

export { testConfigurations }