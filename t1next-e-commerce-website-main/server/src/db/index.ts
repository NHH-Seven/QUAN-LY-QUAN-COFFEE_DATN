import { Pool } from 'pg'
import { config } from '../config/index.js'

export const pool = new Pool({
  connectionString: config.database.url,
  // Force UTF8 encoding for Vietnamese characters
  client_encoding: 'UTF8',
})

// Log connection status once on startup
let isConnected = false
pool.on('connect', () => {
  if (!isConnected) {
    console.log('✅ Connected to PostgreSQL')
    isConnected = true
  }
})

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err)
  isConnected = false
})

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(text, params)
  return result.rows as T[]
}

export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
  const result = await pool.query(text, params)
  return (result.rows[0] as T) || null
}
