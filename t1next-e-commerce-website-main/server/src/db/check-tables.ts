import { pool } from './index.js'

async function checkTables() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Checking tables data...\n')
    
    // Check occupied tables
    const occupiedTables = await client.query(`
      SELECT t.table_number, t.status, t.current_order_id, t.current_guests, t.occupied_at,
             o.order_number, o.total, o.status as order_status
      FROM tables t
      LEFT JOIN table_orders o ON t.current_order_id = o.id
      WHERE t.status = 'occupied'
      ORDER BY t.table_number
    `)
    
    console.log('📊 Occupied tables:')
    if (occupiedTables.rows.length === 0) {
      console.log('  ⚠️  No occupied tables found')
      console.log('  💡 Tables are marked as occupied but have no orders')
    } else {
      occupiedTables.rows.forEach(row => {
        console.log(`  ✓ ${row.table_number}: ${row.order_number || 'NO ORDER'} - ${row.order_status || 'N/A'}`)
      })
    }
    
    // Check all tables
    const allTables = await client.query(`
      SELECT status, COUNT(*) as count
      FROM tables
      GROUP BY status
      ORDER BY status
    `)
    
    console.log('\n📈 Tables by status:')
    allTables.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`)
    })
    
    // Check orders
    const orders = await client.query('SELECT COUNT(*) FROM table_orders')
    console.log(`\n📝 Total orders: ${orders.rows[0].count}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

checkTables()
