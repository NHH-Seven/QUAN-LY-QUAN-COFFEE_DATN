import { pool } from './index.js'

async function createPromotionUsageTable() {
  const client = await pool.connect()
  try {
    // Check if table exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'promotion_usage'
      );
    `)
    
    if (checkResult.rows[0].exists) {
      console.log('✅ Table promotion_usage already exists')
      return
    }

    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS promotion_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        order_id UUID REFERENCES orders(id),
        discount_amount DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_promotion_usage_promotion ON promotion_usage(promotion_id);
    `)
    
    console.log('✅ Created promotion_usage table successfully')
  } catch (error) {
    console.error('❌ Error creating table:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

createPromotionUsageTable()
