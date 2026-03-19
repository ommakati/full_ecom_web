// Check if admin user exists and verify password
import bcrypt from 'bcrypt';
import { query, closePool } from './src/database/connection.js';
import config from './src/config/environment.js';

async function checkAdmin() {
  console.log('🔍 Checking admin user...\n');
  
  try {
    const adminEmail = config.ADMIN_EMAIL;
    const adminPassword = config.ADMIN_PASSWORD;
    
    console.log(`Looking for admin: ${adminEmail}`);
    console.log(`Expected password: ${adminPassword}\n`);
    
    // Check if admin exists
    const result = await query(
      'SELECT id, email, password_hash, is_admin FROM users WHERE email = $1',
      [adminEmail]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Admin user NOT found in database!');
      console.log('\n💡 Run this to create admin user:');
      console.log('   cd backend && npm run seed\n');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ Admin user found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Is Admin: ${user.is_admin}`);
    
    // Test password
    const passwordMatch = await bcrypt.compare(adminPassword, user.password_hash);
    
    if (passwordMatch) {
      console.log('\n✅ Password verification: SUCCESS');
      console.log('\n🎉 You can login with:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
    } else {
      console.log('\n❌ Password verification: FAILED');
      console.log('   The password in .env does not match the hashed password in database');
      console.log('\n💡 To fix this, delete the user and re-run seed:');
      console.log(`   DELETE FROM users WHERE email = '${adminEmail}';`);
      console.log('   Then run: npm run seed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await closePool();
  }
}

checkAdmin();
