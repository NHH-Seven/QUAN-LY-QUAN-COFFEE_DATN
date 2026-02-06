import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { pool } from './index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function runChatbotMigration() {
  const client = await pool.connect()
  try {
    console.log('🤖 Running chatbot migration...')
    
    const sql = readFileSync(
      join(__dirname, 'migrations', 'add_chatbot.sql'),
      'utf-8'
    )
    
    await client.query(sql)
    console.log('✅ Chatbot migration completed successfully')
  } catch (error) {
    console.error('❌ Chatbot migration failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

runChatbotMigration()
