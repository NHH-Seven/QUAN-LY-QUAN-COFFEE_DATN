-- Add loyalty/points columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(20) NOT NULL DEFAULT 'bronze';
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS order_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS note TEXT;

-- Create index for tier filtering
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points);

-- Tier levels: bronze (0-999 points), silver (1000-4999), gold (5000-19999), platinum (20000+)
-- Points: 1 point per 10,000 VND spent
