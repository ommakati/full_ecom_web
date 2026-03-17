import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment-specific configuration
const env = process.env.NODE_ENV || 'development'

// Load environment files in order of precedence
dotenv.config({ path: path.join(__dirname, '../../.env.local') }) // Local overrides (not in git)
dotenv.config({ path: path.join(__dirname, `../../.env.${env}`) }) // Environment-specific
dotenv.config({ path: path.join(__dirname, '../../.env') }) // Default fallback

const config = {
  // Environment
  NODE_ENV: env,
  PORT: parseInt(process.env.PORT) || 5000,
  
  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_SSL: process.env.DATABASE_SSL !== 'false',
  
  // Session
  SESSION_SECRET: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
  SESSION_MAX_AGE: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours
  
  // Admin
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@example.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || (env === 'production' ? 'info' : 'debug'),
  
  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 10,
  
  // Rate limiting
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100, // requests per window
}

// Validation
const requiredEnvVars = ['DATABASE_URL']
const missingVars = requiredEnvVars.filter(varName => !config[varName])

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '))
  console.error('Please check your .env configuration files')
  
  // Don't exit for setup utilities or test environment
  if (env !== 'test' && !process.argv[1]?.includes('setup-db') && !process.argv[1]?.includes('health-check')) {
    process.exit(1)
  }
}

// Warnings for production
if (env === 'production') {
  if (config.SESSION_SECRET === 'dev-session-secret-change-in-production') {
    console.warn('⚠️  WARNING: Using default session secret in production!')
  }
  
  if (config.ADMIN_PASSWORD === 'admin123') {
    console.warn('⚠️  WARNING: Using default admin password in production!')
  }
}

export default config