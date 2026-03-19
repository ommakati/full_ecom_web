// Create or reset admin user
import bcrypt from 'bcrypt';
import { query, closePool } from './src/database/connection.js';
import config from './src/config/environment.js';

async function createAdmin() {
  console.log('👤 Creating/Resetting Admin User...\n');
  
  try {
    const adminEmail = config.ADMIN_EMAIL;
    const adminPassword = config.ADMIN_PASSWORD;
    
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}\n`);
    
    // Delete existing admin user if exists
    const deleteResult = await query('DELETE FROM users WHERE email = $1 RETURNING id', [adminEmail]);
    if (deleteResult.rows.length > 0) {
      console.log('🗑️  Deleted existing admin user');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    // Create new admin user
    const result = await query(
      'INSERT INTO users (email, password_hash, is_admin) VALUES ($1, $2, $3) RETURNING id, email, is_admin',
      [adminEmail, passwordHash, true]
    );
    
    const user = result.rows[0];
    
    console.log('\n✅ Admin user created successfully!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Is Admin: ${user.is_admin}`);
    
    console.log('\n🎉 You can now login with:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await closePool();
  }
}

createAdmin();
