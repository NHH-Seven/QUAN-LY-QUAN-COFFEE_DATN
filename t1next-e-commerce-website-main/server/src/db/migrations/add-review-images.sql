-- Add ReviewImage table for storing review images
CREATE TABLE IF NOT EXISTS review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  public_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups by review_id
CREATE INDEX IF NOT EXISTS idx_review_images_review ON review_images(review_id);
