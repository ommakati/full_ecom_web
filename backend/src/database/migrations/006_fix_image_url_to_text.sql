-- Fix image_url column to TEXT for unlimited length
-- This replaces migration 005 which may not have run correctly
ALTER TABLE products 
ALTER COLUMN image_url TYPE TEXT;
