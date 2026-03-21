import { query, closePool } from '../database/connection.js'
import bcrypt from 'bcrypt'

const fixAdminUser = async () => {
  try {
    console.log('🔧 Fixing admin user...')
    
    const adminEmail = 'admin@example.com'
    const adminPassword = 'admin123'
    
    // Check if admin exists
    const result = await query('SELECT id, email, is_admin FROM users WHERE email = $1', [adminEmail])
    
    if (result.rows.length === 0) {
      console.log('❌ Admin user not found, creating...')
      const passwordHash = await bcrypt.hash(adminPassword, 12)
      await query(
        'INSERT INTO users (email, password_hash, is_admin) VALUES ($1, $2, $3)',
        [adminEmail, passwordHash, true]
      )
      console.log('✅ Admin user created')
    } else {
      const user = result.rows[0]
      console.log('✅ Admin user found:', user)
      
      if (!user.is_admin) {
        console.log('🔧 Setting is_admin to true...')
        await query('UPDATE users SET is_admin = true WHERE email = $1', [adminEmail])
        console.log('✅ Admin flag updated')
      }
      
      // Update password to ensure it's correct
      console.log('🔧 Updating admin password...')
      const passwordHash = await bcrypt.hash(adminPassword, 12)
      await query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, adminEmail])
      console.log('✅ Admin password updated')
    }
    
    // Verify
    const verify = await query('SELECT id, email, is_admin FROM users WHERE email = $1', [adminEmail])
    console.log('✅ Final verification:', verify.rows[0])
    
    // Clear any existing sessions for admin
    await query('DELETE FROM user_sessions WHERE user_id = $1', [verify.rows[0].id])
    console.log('✅ Cleared old sessions')
    
    console.log('\n✅ Admin user is ready!')
    console.log('Email:', adminEmail)
    console.log('Password:', adminPassword)
    console.log('\nPlease log out and log back in with these credentials.')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await closePool()
  }
}

fixAdminUser()
