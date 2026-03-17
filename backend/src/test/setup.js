// Test setup for backend
process.env.NODE_ENV = 'test'
process.env.SESSION_SECRET = 'test-secret'
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/ecommerce_test'