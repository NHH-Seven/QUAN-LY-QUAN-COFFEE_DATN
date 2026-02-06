import { pool } from './index.js'

async function runMigration() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS product_answers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID NOT NULL REFERENCES product_questions(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        answer TEXT NOT NULL,
        is_staff BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_questions_product ON product_questions(product_id);
      CREATE INDEX IF NOT EXISTS idx_answers_question ON product_answers(question_id);
    `)
    console.log('✅ Q&A tables created successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration()
