-- Increase image_url column length to handle longer URLs
ALTER TABLE products 
ALTER COLUMN image_url TYPE VARCHAR(21000);
