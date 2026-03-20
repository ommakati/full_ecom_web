import bcrypt from 'bcrypt'
import { query, closePool } from './src/database/connection.js'

async function seed() {
  try {
    console.log('🌱 Seeding database...\n')
    
    // Create admin user
    console.log('Creating admin user...')
    const adminEmail = 'admin@example.com'
    const adminPassword = 'admin123'
    const passwordHash = await bcrypt.hash(adminPassword, 10)
    
    const existingAdmin = await query('SELECT id FROM users WHERE email = $1', [adminEmail])
    
    if (existingAdmin.rows.length > 0) {
      console.log('  ⏭ Admin already exists')
    } else {
      await query(
        'INSERT INTO users (email, password_hash, is_admin) VALUES ($1, $2, $3)',
        [adminEmail, passwordHash, true]
      )
      console.log(`  ✓ Created admin: ${adminEmail} / ${adminPassword}`)
    }
    
    // Create sample products
    console.log('\nCreating sample products...')
    const products = [
      {
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 199.99,
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'
      },
      {
        name: 'Smartphone Case',
        description: 'Durable protective case with wireless charging support',
        price: 29.99,
        image_url: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=500'
      },
      {
        name: 'Laptop Stand',
        description: 'Ergonomic aluminum laptop stand',
        price: 79.99,
        image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500'
      }
    ]
    
    const existingProducts = await query('SELECT COUNT(*) FROM products')
    const productCount = parseInt(existingProducts.rows[0].count)
    
    if (productCount > 0) {
      console.log(`  ⏭ Found ${productCount} existing products`)
    } else {
      for (const product of products) {
        await query(
          'INSERT INTO products (name, description, price, image_url) VALUES ($1, $2, $3, $4)',
          [product.name, product.description, product.price, product.image_url]
        )
        console.log(`  ✓ Created: ${product.name}`)
      }
    }
    
    console.log('\n✅ Seeding completed!')
    console.log('\nLogin credentials:')
    console.log(`  Email: ${adminEmail}`)
    console.log(`  Password: ${adminPassword}`)
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message)
    process.exit(1)
  } finally {
    await closePool()
  }
}

seed()
