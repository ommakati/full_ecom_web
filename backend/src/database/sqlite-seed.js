import bcrypt from 'bcrypt'
import { query } from './sqlite-connection.js'

// Sample products data
const sampleProducts = [
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
    price: 199.99,
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'
  },
  {
    name: 'Smartphone Case',
    description: 'Durable protective case for smartphones with shock absorption and wireless charging compatibility.',
    price: 29.99,
    image_url: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=500'
  },
  {
    name: 'Laptop Stand',
    description: 'Ergonomic aluminum laptop stand with adjustable height and cooling ventilation.',
    price: 79.99,
    image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500'
  },
  {
    name: 'USB-C Hub',
    description: 'Multi-port USB-C hub with HDMI, USB 3.0, and SD card reader for enhanced connectivity.',
    price: 49.99,
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'
  },
  {
    name: 'Wireless Mouse',
    description: 'Precision wireless mouse with ergonomic design and long-lasting battery.',
    price: 39.99,
    image_url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500'
  }
]

// Create admin user
const createAdminUser = async () => {
  const adminEmail = 'admin@example.com'
  const adminPassword = 'admin123'
  
  try {
    // Check if admin user already exists
    const existingAdmin = await query('SELECT id FROM users WHERE email = ?', [adminEmail])
    
    if (existingAdmin.rows.length > 0) {
      console.log('⏭ Admin user already exists')
      return
    }
    
    // Hash the admin password
    const passwordHash = await bcrypt.hash(adminPassword, 10)
    
    // Create admin user
    await query(
      'INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, ?)',
      [adminEmail, passwordHash, 1]
    )
    
    console.log(`✓ Created admin user: ${adminEmail}`)
  } catch (error) {
    console.error('Failed to create admin user:', error)
    throw error
  }
}

// Create sample products
const createSampleProducts = async () => {
  try {
    // Check if products already exist
    const existingProducts = await query('SELECT COUNT(*) as count FROM products')
    const productCount = existingProducts.rows[0].count
    
    if (productCount > 0) {
      console.log(`⏭ Found ${productCount} existing products, skipping sample data`)
      return
    }
    
    // Insert sample products
    for (const product of sampleProducts) {
      await query(
        'INSERT INTO products (name, description, price, image_url) VALUES (?, ?, ?, ?)',
        [product.name, product.description, product.price, product.image_url]
      )
    }
    
    console.log(`✓ Created ${sampleProducts.length} sample products`)
  } catch (error) {
    console.error('Failed to create sample products:', error)
    throw error
  }
}

// Main seed function
export const seedSQLiteDatabase = async () => {
  try {
    console.log('Starting SQLite database seeding...')
    
    await createAdminUser()
    await createSampleProducts()
    
    console.log('✓ SQLite database seeding completed successfully')
  } catch (error) {
    console.error('SQLite database seeding failed:', error)
    throw error
  }
}