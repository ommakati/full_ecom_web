// Quick test to verify session and database connection
import { query } from './src/database/connection.js';

async function testSession() {
  console.log('Testing database connection and cart...\n');
  
  try {
    // Test database connection
    const dbTest = await query('SELECT NOW() as time');
    console.log('✅ Database connected:', dbTest.rows[0].time);
    
    // Check if cart_items table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'cart_items'
      )
    `);
    console.log('✅ cart_items table exists:', tableCheck.rows[0].exists);
    
    // Check cart contents for any session
    const cartCheck = await query('SELECT COUNT(*) as count FROM cart_items');
    console.log('✅ Total cart items in database:', cartCheck.rows[0].count);
    
    // List all sessions with cart items
    const sessions = await query(`
      SELECT DISTINCT session_id, COUNT(*) as item_count 
      FROM cart_items 
      GROUP BY session_id
    `);
    console.log('\n📦 Active cart sessions:');
    sessions.rows.forEach(row => {
      console.log(`  - Session: ${row.session_id.substring(0, 20)}... (${row.item_count} items)`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

testSession();
