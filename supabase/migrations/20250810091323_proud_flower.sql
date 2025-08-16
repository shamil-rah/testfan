/*
  # Add Content Likes System

  1. New Tables
    - `content_likes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `content_id` (uuid, foreign key to content)
      - `created_at` (timestamp)

  2. Schema Changes
    - Add `likes` column to `content` table

  3. Security
    - Enable RLS on `content_likes` table
    - Add policies for authenticated users to manage their likes

  4. Database Functions
    - Function to update content likes count
    - Triggers to automatically maintain likes count
*/

-- Add likes column to content table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content' AND column_name = 'likes'
  ) THEN
    ALTER TABLE content ADD COLUMN likes integer DEFAULT 0;
  END IF;
END $$;

-- Create content_likes table
CREATE TABLE IF NOT EXISTS content_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_id)
);

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'content_likes_user_id_fkey'
  ) THEN
    ALTER TABLE content_likes 
    ADD CONSTRAINT content_likes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'content_likes_content_id_fkey'
  ) THEN
    ALTER TABLE content_likes 
    ADD CONSTRAINT content_likes_content_id_fkey 
    FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on content_likes table
ALTER TABLE content_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_likes
CREATE POLICY "Users can read all content likes"
  ON content_likes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own likes"
  ON content_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON content_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update content likes count
CREATE OR REPLACE FUNCTION update_content_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment likes count
    UPDATE content 
    SET likes = likes + 1 
    WHERE id = NEW.content_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement likes count
    UPDATE content 
    SET likes = likes - 1 
    WHERE id = OLD.content_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS content_likes_insert_trigger ON content_likes;
CREATE TRIGGER content_likes_insert_trigger
  AFTER INSERT ON content_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_content_likes_count();

DROP TRIGGER IF EXISTS content_likes_delete_trigger ON content_likes;
CREATE TRIGGER content_likes_delete_trigger
  AFTER DELETE ON content_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_content_likes_count();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_likes_user_id ON content_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_content_likes_content_id ON content_likes(content_id);
CREATE INDEX IF NOT EXISTS idx_content_likes_created_at ON content_likes(created_at);