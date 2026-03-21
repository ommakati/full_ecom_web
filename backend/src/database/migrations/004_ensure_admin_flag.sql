-- Ensure admin user has is_admin flag set to true
UPDATE users 
SET is_admin = true 
WHERE email = 'admin@example.com' AND (is_admin IS NULL OR is_admin = false);
