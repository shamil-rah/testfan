/*
  # Add title column to posts table

  1. Changes
    - Add `title` column to `posts` table
    - Set as NOT NULL with default empty string for existing posts
    - Update existing posts to use first 50 characters of content as title

  2. Security
    - No changes to RLS policies needed
*/

-- Add title column to posts table
ALTER TABLE posts ADD COLUMN title text;

-- Update existing posts to have a title (first 50 chars of content)
UPDATE posts 
SET title = CASE 
  WHEN LENGTH(content) > 50 THEN LEFT(content, 50) || '...'
  ELSE content
END
WHERE title IS NULL;

-- Make title NOT NULL after updating existing records
ALTER TABLE posts ALTER COLUMN title SET NOT NULL;