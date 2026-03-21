-- Add user_id column to cart_items table for token-based authentication
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- Make session_id nullable since we'll use either session_id OR user_id
ALTER TABLE cart_items ALTER COLUMN session_id DROP NOT NULL;
