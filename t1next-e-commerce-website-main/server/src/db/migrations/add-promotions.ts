/**
 * Migration: Add promotions/coupons table
 */
import { pool } from '../index.js'

async function migrate() {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // Create promotions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS promotions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
        value DECIMAL(12, 2) NOT NULL,
        min_order_value DECIMAL(12, 2) DEFAULT 0,
        max_discount DECIMAL(12, 2),
        usage_limit INTEGER,
        used_count INTEGER DEFAULT 0,
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    // Create promotion_usage table to track who used what
    await client.query(`
      CREATE TABLE IF NOT EXISTS promotion_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
        discount_amount DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    // Add discount columns to orders table
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES promotions(id),
      ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12, 2)
    `)

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active, start_date, end_date)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_promotion_usage_promotion ON promotion_usage(promotion_id)`)

    await client.query('COMMIT')
    console.log('✅ Promotions migration completed successfully')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
