-- Change image_url column to TEXT for unlimited length
ALTER TABLE products 
ALTER COLUMN image_url TYPE TEXT;
