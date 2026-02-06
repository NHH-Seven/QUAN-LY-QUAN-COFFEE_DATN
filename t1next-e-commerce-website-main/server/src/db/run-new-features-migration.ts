import { pool } from './index.js'
import fs from 'fs'
import path from 'path'

async function runMigration() {
  const client = await pool.connect()
  try {
    const sql = fs.readFileSync(
      path.join(process.cwd(), 'src/db/migrations/add-returns-addresses-suppliers.sql'),
      'utf-8'
    )
    await client.query(sql)
    console.log('✅ New features tables created successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration()
