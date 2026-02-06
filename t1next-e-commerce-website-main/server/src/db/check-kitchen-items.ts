import { pool } from './index.js'

async function checkKitchenItems() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Checking kitchen items...\n')
    
    // Check all table order items
    const allItems = await client.query(`
      SELECT toi.*, tor.order_number, t.table_number, tor.status as order_status
      FROM table_order_items toi
      JOIN table_orders tor ON toi.table_order_id = tor.id
      JOIN tables t ON tor.table_id = t.id
      ORDER BY toi.created_at DESC
      LIMIT 10
    `)
    
    console.log('📊 Recent table order items:')
    if (allItems.rows.length === 0) {
      console.log('  ⚠️  No items found')
    } else {
      allItems.rows.forEach(item => {
        console.log(`  ${item.table_number} | ${item.product_name} x${item.quantity} | Status: ${item.status} | Order: ${item.order_status}`)
      })
    }
    
    // Check items that should appear in kitchen
    const kitchenItems = await client.query(`
      SELECT toi.*, tor.order_number, t.table_number
      FROM table_order_items toi
      JOIN table_orders tor ON toi.table_order_id = tor.id
      JOIN tables t ON tor.table_id = t.id
      WHERE tor.status = 'active'
        AND toi.status IN ('pending', 'preparing')
      ORDER BY toi.created_at ASC
    `)
    
    console.log('\n🍳 Items in kitchen queue:')
    if (kitchenItems.rows.length === 0) {
      console.log('  ⚠️  No items in kitchen queue')
      console.log('  💡 Items might have status "served" or "ready"')
    } else {
      kitchenItems.rows.forEach(item => {
        console.log(`  ${item.table_number} | ${item.product_name} x${item.quantity} | ${item.status}`)
      })
    }
    
    // Check status distribution
    const statusDist = await client.query(`
      SELECT toi.status, COUNT(*) as count
      FROM table_order_items toi
      JOIN table_orders tor ON toi.table_order_id = tor.id
      WHERE tor.status = 'active'
      GROUP BY toi.status
      ORDER BY count DESC
    `)
    
    console.log('\n📈 Item status distribution:')
    statusDist.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

checkKitchenItems()
