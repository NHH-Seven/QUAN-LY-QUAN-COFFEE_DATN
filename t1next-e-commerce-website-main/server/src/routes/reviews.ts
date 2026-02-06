import { Router, Request, Response } from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { query, queryOne } from '../db/index.js'
import { authMiddleware } from '../middleware/auth.js'
import type { Review } from '../types/index.js'

const router = Router()

// Constants for image validation
const MAX_IMAGES_PER_REVIEW = 5
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

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
}

// Configure multer for memory storage
const storage = multer.memoryStorage()

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE }
})

// Helper: Upload buffer to Cloudinary
async function uploadToCloudinary(buffer: Buffer): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: 'reviews',
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }]
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

// Helper: Delete image from Cloudinary
async function deleteFromCloudinary(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

// Interface for review with images
interface ReviewImage {
  id: string
  url: string
  public_id: string | null
}

interface ReviewWithImages extends Review {
  user_name: string
  user_avatar: string | null
  images: ReviewImage[]
}

// Get reviews for a product (with images)
router.get('/product/:productId', async (req, res) => {
  try {
    // Get reviews
    const reviews = await query<Review & { user_name: string; user_avatar: string }>(
      `SELECT r.*, u.name as user_name, u.avatar as user_avatar
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.productId]
    )

    // Get images for all reviews
    const reviewIds = reviews.map(r => r.id)
    let images: ReviewImage[] = []
    
    if (reviewIds.length > 0) {
      images = await query<ReviewImage & { review_id: string }>(
        `SELECT id, review_id, url, public_id FROM review_images WHERE review_id = ANY($1)`,
        [reviewIds]
      )
    }

    // Map images to reviews
    const reviewsWithImages: ReviewWithImages[] = reviews.map(review => ({
      ...review,
      images: images.filter(img => (img as ReviewImage & { review_id: string }).review_id === review.id)
    }))

    res.json({ success: true, data: reviewsWithImages })
  } catch (error) {
    console.error('Get reviews error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Create review with images (multipart/form-data)
router.post('/', authMiddleware, upload.array('images', MAX_IMAGES_PER_REVIEW), async (req: Request, res: Response) => {
  try {
    const { productId, rating, comment } = req.body
    const files = req.files as Express.Multer.File[] | undefined

    // Validate required fields
    if (!productId || !rating) {
      return res.status(400).json({ success: false, error: 'Product ID and rating are required' })
    }

    const ratingNum = parseInt(rating, 10)
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' })
    }

    // Validate image count
    if (files && files.length > MAX_IMAGES_PER_REVIEW) {
      return res.status(400).json({ 
        success: false, 
        error: `Maximum ${MAX_IMAGES_PER_REVIEW} images allowed per review` 
      })
    }

    // Check if user already reviewed this product
    const existing = await queryOne<Review>(
      'SELECT id FROM reviews WHERE user_id = $1 AND product_id = $2',
      [req.user!.userId, productId]
    )

    if (existing) {
      return res.status(400).json({ success: false, error: 'You already reviewed this product' })
    }

    // Create review
    const review = await queryOne<Review>(
      `INSERT INTO reviews (id, user_id, product_id, rating, comment)
       VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING *`,
      [req.user!.userId, productId, ratingNum, comment || null]
    )

    if (!review) {
      return res.status(500).json({ success: false, error: 'Failed to create review' })
    }

    // Upload images and save to database
    const uploadedImages: ReviewImage[] = []
    
    if (files && files.length > 0 && useCloudinary) {
      for (const file of files) {
        try {
          const { url, publicId } = await uploadToCloudinary(file.buffer)
          
          const image = await queryOne<ReviewImage>(
            `INSERT INTO review_images (id, review_id, url, public_id)
             VALUES (gen_random_uuid(), $1, $2, $3) RETURNING id, url, public_id`,
            [review.id, url, publicId]
          )
          
          if (image) {
            uploadedImages.push(image)
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError)
          // Continue with other images even if one fails
        }
      }
    }

    // Update product rating
    await query(
      `UPDATE products SET
         rating = (SELECT AVG(rating) FROM reviews WHERE product_id = $1),
         review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1)
       WHERE id = $1`,
      [productId]
    )

    res.status(201).json({ 
      success: true, 
      data: { ...review, images: uploadedImages } 
    })
  } catch (error) {
    console.error('Create review error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Update review
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' })
    }

    const review = await queryOne<Review>(
      `UPDATE reviews SET rating = COALESCE($1, rating), comment = COALESCE($2, comment)
       WHERE id = $3 AND user_id = $4 RETURNING *`,
      [rating, comment, req.params.id, req.user!.userId]
    )

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' })
    }

    // Update product rating
    await query(
      `UPDATE products SET rating = (SELECT AVG(rating) FROM reviews WHERE product_id = $1)
       WHERE id = $1`,
      [review.product_id]
    )

    // Get images for this review
    const images = await query<ReviewImage>(
      'SELECT id, url, public_id FROM review_images WHERE review_id = $1',
      [review.id]
    )

    res.json({ success: true, data: { ...review, images } })
  } catch (error) {
    console.error('Update review error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Delete review (cascade deletes images from DB, also delete from Cloudinary)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // First get the review and its images
    const review = await queryOne<Review>(
      'SELECT * FROM reviews WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.userId]
    )

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' })
    }

    // Get images to delete from Cloudinary
    const images = await query<{ public_id: string | null }>(
      'SELECT public_id FROM review_images WHERE review_id = $1',
      [req.params.id]
    )

    // Delete images from Cloudinary
    if (useCloudinary) {
      for (const img of images) {
        if (img.public_id) {
          try {
            await deleteFromCloudinary(img.public_id)
          } catch (deleteError) {
            console.error('Failed to delete image from Cloudinary:', deleteError)
            // Continue even if Cloudinary delete fails
          }
        }
      }
    }

    // Delete review (cascade will delete review_images from DB)
    await query('DELETE FROM reviews WHERE id = $1', [req.params.id])

    // Update product rating
    await query(
      `UPDATE products SET
         rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = $1), 0),
         review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1)
       WHERE id = $1`,
      [review.product_id]
    )

    res.json({ success: true, message: 'Review deleted' })
  } catch (error) {
    console.error('Delete review error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
