import { Router } from 'express'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import { config } from '../../config/index.js'

const router = Router()
const execAsync = promisify(exec)

const BACKUP_DIR = path.join(process.cwd(), 'backups')

// Ensure backup directory exists
async function ensureBackupDir() {
  try {
    await fs.access(BACKUP_DIR)
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true })
  }
}

// GET /api/admin/backup - List all backups
router.get('/', async (req, res) => {
  try {
    await ensureBackupDir()
    
    const files = await fs.readdir(BACKUP_DIR)
    const backups = await Promise.all(
      files
        .filter(f => f.endsWith('.sql') || f.endsWith('.sql.gz') || f.endsWith('.json'))
        .map(async (filename) => {
          const filepath = path.join(BACKUP_DIR, filename)
          const stats = await fs.stat(filepath)
          return {
            filename,
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
            createdAt: stats.mtime.toISOString()
          }
        })
    )

    // Sort by date descending
    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    res.json({ success: true, data: backups })
  } catch (error) {
    console.error('List backups error:', error)
    res.status(500).json({ success: false, error: 'Không thể lấy danh sách backup' })
  }
})

// POST /api/admin/backup - Create new backup
router.post('/', async (req, res) => {
  try {
    await ensureBackupDir()

    // Parse DATABASE_URL
    const dbUrl = config.databaseUrl
    if (!dbUrl) {
      return res.status(500).json({ success: false, error: 'DATABASE_URL không được cấu hình' })
    }

    const url = new URL(dbUrl)
    const host = url.hostname
    const port = url.port || '5432'
    const database = url.pathname.slice(1)
    const username = url.username
    const password = url.password

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `backup_${timestamp}.sql`
    const filepath = path.join(BACKUP_DIR, filename)

    // Build pg_dump command
    const env = { ...process.env, PGPASSWORD: password }
    const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F p -f "${filepath}"`

    try {
      await execAsync(command, { env })
    } catch (execError: unknown) {
      // pg_dump might not be available, create a simple JSON backup instead
      console.log('[Backup] pg_dump not available, falling back to JSON backup')
      
      // Fallback: export important tables as JSON
      const { query } = await import('../../db/index.js')
      
      const tables = ['users', 'products', 'categories', 'orders', 'order_items', 'reviews', 'promotions']
      const backup: Record<string, unknown[]> = {}
      
      for (const table of tables) {
        try {
          const data = await query(`SELECT * FROM ${table}`, [])
          backup[table] = data
        } catch {
          backup[table] = []
        }
      }

      const jsonFilename = `backup_${timestamp}.json`
      const jsonFilepath = path.join(BACKUP_DIR, jsonFilename)
      await fs.writeFile(jsonFilepath, JSON.stringify(backup, null, 2))

      const stats = await fs.stat(jsonFilepath)
      return res.json({
        success: true,
        data: {
          filename: jsonFilename,
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
          createdAt: new Date().toISOString(),
          type: 'json'
        },
        message: 'Backup JSON đã được tạo (pg_dump không khả dụng)'
      })
    }

    const stats = await fs.stat(filepath)

    res.json({
      success: true,
      data: {
        filename,
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
        createdAt: new Date().toISOString(),
        type: 'sql'
      },
      message: 'Backup đã được tạo thành công'
    })
  } catch (error) {
    console.error('Create backup error:', error)
    res.status(500).json({ success: false, error: 'Không thể tạo backup' })
  }
})

// GET /api/admin/backup/:filename - Download backup file
// Note: This route accepts token via query string for direct browser downloads
router.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params
    
    // Validate filename to prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ success: false, error: 'Tên file không hợp lệ' })
    }

    const filepath = path.join(BACKUP_DIR, filename)
    
    try {
      await fs.access(filepath)
    } catch {
      return res.status(404).json({ success: false, error: 'File không tồn tại' })
    }

    // Set appropriate content type
    const contentType = filename.endsWith('.json') ? 'application/json' : 'application/sql'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    
    const fileContent = await fs.readFile(filepath)
    res.send(fileContent)
  } catch (error) {
    console.error('Download backup error:', error)
    res.status(500).json({ success: false, error: 'Không thể tải backup' })
  }
})

// DELETE /api/admin/backup/:filename - Delete backup file
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params
    
    // Validate filename
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ success: false, error: 'Tên file không hợp lệ' })
    }

    const filepath = path.join(BACKUP_DIR, filename)
    
    try {
      await fs.access(filepath)
    } catch {
      return res.status(404).json({ success: false, error: 'File không tồn tại' })
    }

    await fs.unlink(filepath)

    res.json({ success: true, message: 'Đã xóa backup' })
  } catch (error) {
    console.error('Delete backup error:', error)
    res.status(500).json({ success: false, error: 'Không thể xóa backup' })
  }
})

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default router
