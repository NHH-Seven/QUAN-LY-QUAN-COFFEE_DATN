import { pool } from './index.js'

async function seedTableOrders() {
  const client = await pool.connect()
  
  try {
    console.log('🌱 Seeding table orders...\n')
    
    await client.query('BEGIN')
    
    // Get admin user
    const adminUser = await client.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`)
    const staffId = adminUser.rows[0]?.id
    
    if (!staffId) {
      console.log('⚠️  No admin user found, creating one...')
      const newAdmin = await client.query(`
        INSERT INTO users (email, password, name, role, is_active)
        VALUES ('admin@test.com', '$2a$10$rOvHPZYRKJQH5mXqF5vQxO', 'Admin', 'admin', true)
        RETURNING id
      `)
      const staffId = newAdmin.rows[0].id
    }
    
    // Get some products
    const products = await client.query(`SELECT id, name, price, images FROM products LIMIT 10`)
    
    if (products.rows.length === 0) {
      console.log('⚠️  No products found. Please seed products first.')
      await client.query('ROLLBACK')
      return
    }
    
    // Get occupied tables
    const occupiedTables = await client.query(`
      SELECT id, table_number FROM tables WHERE status = 'occupied'
    `)
    
    console.log(`📊 Found ${occupiedTables.rows.length} occupied tables`)
    console.log(`📦 Found ${products.rows.length} products\n`)
    
    let orderCount = 0
    
    for (const table of occupiedTables.rows) {
      // Create order - shorter order number
      const orderNumber = `T${table.table_number.replace('-', '')}${Date.now().toString().slice(-6)}`
      
      const order = await client.query(`
        INSERT INTO table_orders (
          order_number, table_id, staff_id, guests_count, 
          subtotal, discount_amount, total, status, payment_status
        )
        VALUES ($1, $2, $3, $4, 0, 0, 0, 'active', 'pending')
        RETURNING id
      `, [orderNumber, table.id, staffId, Math.floor(Math.random() * 4) + 1])
      
      const orderId = order.rows[0].id
      
      // Add 2-4 random items
      const itemCount = Math.floor(Math.random() * 3) + 2
      let subtotal = 0
      
      for (let i = 0; i < itemCount; i++) {
        const product = products.rows[Math.floor(Math.random() * products.rows.length)]
        const quantity = Math.floor(Math.random() * 2) + 1
        const price = Number(product.price)
        const itemTotal = price * quantity
        subtotal += itemTotal
        
        const statuses = ['pending', 'preparing', 'ready', 'served']
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        
        await client.query(`
          INSERT INTO table_order_items (
            table_order_id, product_id, product_name, product_image,
            quantity, price, status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          orderId,
          product.id,
          product.name,
          product.images?.[0] || null,
          quantity,
          price,
          status
        ])
      }
      
      // Update order totals
      await client.query(`
        UPDATE table_orders
        SET subtotal = $1, total = $1
        WHERE id = $2
      `, [subtotal, orderId])
      
      // Update table with current_order_id
      await client.query(`
        UPDATE tables
        SET current_order_id = $1, current_guests = $2, occupied_at = NOW()
        WHERE id = $3
      `, [orderId, Math.floor(Math.random() * 4) + 1, table.id])
      
      console.log(`✅ Created order ${orderNumber} for table ${table.table_number}`)
      orderCount++
    }
    
    await client.query('COMMIT')
    
    console.log(`\n🎉 Successfully created ${orderCount} orders!`)
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Error:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

seedTableOrders()
