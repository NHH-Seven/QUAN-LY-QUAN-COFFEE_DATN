import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../middleware/auth'
import fs from 'fs/promises'
import path from 'path'

const router = Router()

// Settings file path
const SETTINGS_FILE = path.join(__dirname, '../../data/settings.json')

// Default settings
const DEFAULT_SETTINGS = {
  flashSaleEnabled: true,
  flashSaleTitle: 'Flash Sale',
  flashSaleDiscount: 50,
  flashSaleStartHour: 0,
  flashSaleEndHour: 24,
  maintenanceMode: false,
  siteName: 'NHH-Coffee',
}

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(SETTINGS_FILE)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Read settings from file
async function readSettings() {
  try {
    await ensureDataDir()
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8')
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

// Write settings to file
async function writeSettings(settings: Record<string, unknown>) {
  await ensureDataDir()
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2))
}

/**
 * GET /api/settings
 * Get all settings (public - some fields only)
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const settings = await readSettings()
    // Return only public settings
    res.json({
      success: true,
      data: {
        flashSaleEnabled: settings.flashSaleEnabled,
        flashSaleTitle: settings.flashSaleTitle,
        flashSaleStartHour: settings.flashSaleStartHour,
        flashSaleEndHour: settings.flashSaleEndHour,
        maintenanceMode: settings.maintenanceMode,
        siteName: settings.siteName,
      }
    })
  } catch (error) {
    console.error('Error reading settings:', error)
    res.status(500).json({ success: false, error: 'Failed to read settings' })
  }
})

/**
 * GET /api/settings/admin
 * Get all settings (admin only)
 */
router.get('/admin', adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const settings = await readSettings()
    res.json({ success: true, data: settings })
  } catch (error) {
    console.error('Error reading settings:', error)
    res.status(500).json({ success: false, error: 'Failed to read settings' })
  }
})

/**
 * PUT /api/settings
 * Update settings (admin only)
 */
router.put('/', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const currentSettings = await readSettings()
    const newSettings = { ...currentSettings, ...req.body }
    await writeSettings(newSettings)
    res.json({ success: true, data: newSettings })
  } catch (error) {
    console.error('Error updating settings:', error)
    res.status(500).json({ success: false, error: 'Failed to update settings' })
  }
})

/**
 * PATCH /api/settings/flash-sale
 * Toggle flash sale (admin only)
 */
router.patch('/flash-sale', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { enabled } = req.body
    const currentSettings = await readSettings()
    currentSettings.flashSaleEnabled = Boolean(enabled)
    await writeSettings(currentSettings)
    res.json({ 
      success: true, 
      data: { flashSaleEnabled: currentSettings.flashSaleEnabled }
    })
  } catch (error) {
    console.error('Error toggling flash sale:', error)
    res.status(500).json({ success: false, error: 'Failed to toggle flash sale' })
  }
})

export default router
