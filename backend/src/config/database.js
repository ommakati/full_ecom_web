import config from './environment.js'

const databaseConfig = {
  development: {
    connectionString: config.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ecommerce_dev',
    ssl: false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  test: {
    connectionString: config.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ecommerce_test',
    ssl: false,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 1000,
  },
  production: {
    connectionString: config.DATABASE_URL,
    ssl: config.DATABASE_SSL ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
}

export const getDatabaseConfig = () => {
  const env = config.NODE_ENV
  const dbConfig = databaseConfig[env]
  
  if (!dbConfig) {
    throw new Error(`Database configuration not found for environment: ${env}`)
  }
  
  if (!dbConfig.connectionString) {
    throw new Error(`DATABASE_URL not configured for environment: ${env}`)
  }
  
  return dbConfig
}

export default getDatabaseConfig