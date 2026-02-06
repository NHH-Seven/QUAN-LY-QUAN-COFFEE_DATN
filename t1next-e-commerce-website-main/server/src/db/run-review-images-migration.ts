import { pool } from './index.js'

async function runMigration() {
  try {
    console.log('Running review images migration...')
    
    // Create review_images table (using TEXT for review_id to match reviews.id type)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS review_images (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        review_id TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        public_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    
    // Create index for faster lookups
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_review_images_review ON review_images(review_id)`)
    
    console.log('✅ review_images table created successfully')
  } catch (error) {
    console.error('Migration error:', error)
  } finally {
    await pool.end()
  }
}

runMigration()
