import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { v2 as cloudinary } from 'cloudinary'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// Check if Cloudinary is configured
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
)

// Configure Cloudinary if credentials exist
if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  console.log('☁️ Cloudinary configured')
} else {
  console.log('📁 Using local file storage (Cloudinary not configured)')
}

// Ensure upload directory exists (for local storage fallback)
const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Configure multer - use memory storage for Cloudinary, disk for local
const storage = useCloudinary
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadDir),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase()
        cb(null, `${uuidv4()}${ext}`)
      }
    })

// File filter - only allow images
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Chỉ hỗ trợ file ảnh (jpg, png, webp, gif)'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
})

// Helper: Upload buffer to Cloudinary
async function uploadToCloudinary(buffer: Buffer, folder: string = 'uploads'): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' } // Auto optimize
        ]
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload failed'))
        } else {
          resolve({ url: result.secure_url, publicId: result.public_id })
        }
      }
    ).end(buffer)
  })
}

/**
 * POST /api/upload
 * Upload single image
 */
router.post('/', authMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Không có file được upload' })
    }

    let fileUrl: string
    let publicId: string | undefined

    if (useCloudinary && req.file.buffer) {
      // Upload to Cloudinary
      const result = await uploadToCloudinary(req.file.buffer)
      fileUrl = result.url
      publicId = result.publicId
    } else {
      // Local storage
      fileUrl = `/uploads/${req.file.filename}`
    }

    res.json({
      success: true,
      data: {
        url: fileUrl,
        publicId,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ success: false, error: 'Upload thất bại' })
  }
})

/**
 * POST /api/upload/multiple
 * Upload multiple images (max 10)
 */
router.post('/multiple', authMiddleware, upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[]
    
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'Không có file được upload' })
    }

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        if (useCloudinary && file.buffer) {
          const result = await uploadToCloudinary(file.buffer)
          return {
            url: result.url,
            publicId: result.publicId,
            filename: file.originalname,
            size: file.size,
            mimetype: file.mimetype
          }
        } else {
          return {
            url: `/uploads/${file.filename}`,
            filename: file.originalname,
            size: file.size,
            mimetype: file.mimetype
          }
        }
      })
    )

    res.json({ success: true, data: uploadedFiles })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ success: false, error: 'Upload thất bại' })
  }
})

/**
 * DELETE /api/upload/:identifier
 * Delete uploaded file (supports both local filename and Cloudinary public_id)
 */
router.delete('/:identifier', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params

    // Security check
    if (identifier.includes('..')) {
      return res.status(400).json({ success: false, error: 'Identifier không hợp lệ' })
    }

    if (useCloudinary && identifier.includes('/')) {
      // Cloudinary public_id (contains folder path like "uploads/abc123")
      await cloudinary.uploader.destroy(identifier)
      res.json({ success: true, message: 'Đã xóa file' })
    } else {
      // Local file
      const filePath = path.join(uploadDir, identifier)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        res.json({ success: true, message: 'Đã xóa file' })
      } else {
        res.status(404).json({ success: false, error: 'File không tồn tại' })
      }
    }
  } catch (error) {
    console.error('Delete file error:', error)
    res.status(500).json({ success: false, error: 'Không thể xóa file' })
  }
})

export default router
