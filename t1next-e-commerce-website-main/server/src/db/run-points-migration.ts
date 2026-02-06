import { pool } from './index.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, 'migrations/add-points-history.sql'), 'utf-8')
  await pool.query(sql)
  console.log('✅ Points history migration done')
  process.exit(0)
}

run().catch(e => { console.error(e); process.exit(1) })
