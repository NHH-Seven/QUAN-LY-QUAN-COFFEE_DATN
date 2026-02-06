-- Add wishlist table
CREATE TABLE IF NOT EXISTS "wishlist" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_wishlist_user" ON "wishlist"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "wishlist_user_product_key" ON "wishlist"("user_id", "product_id");

-- Add foreign keys
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
