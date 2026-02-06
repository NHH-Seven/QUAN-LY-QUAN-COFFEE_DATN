import { pool } from './index.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runTablesMigration() {
  const client = await pool.connect()
  
  try {
    console.log('🔄 Running tables management migration...')
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_tables_management.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
    
    // Execute migration
    await client.query(migrationSQL)
    
    console.log('✅ Tables management migration completed successfully!')
    
    // Verify tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('areas', 'tables', 'table_orders', 'table_order_items')
      ORDER BY table_name
    `)
    
    console.log('\n📊 Created tables:')
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`)
    })
    
    // Count records
    const areaCount = await client.query('SELECT COUNT(*) FROM areas')
    const tableCount = await client.query('SELECT COUNT(*) FROM tables')
    
    console.log('\n📈 Seeded data:')
    console.log(`  ✓ ${areaCount.rows[0].count} areas`)
    console.log(`  ✓ ${tableCount.rows[0].count} tables`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

runTablesMigration()
