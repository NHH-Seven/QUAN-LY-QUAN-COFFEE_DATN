import { pool } from './index.js'

async function runMigration() {
  try {
    console.log('Running wishlist migration...')
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )
    `)
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id)`)
    
    console.log('✅ Wishlist table created')
  } catch (error) {
    console.error('Migration error:', error)
  } finally {
    await pool.end()
  }
}

runMigration()
