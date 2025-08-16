/*
  # Add content linking and image storage for community posts

  1. Database Changes
    - Add content_id column to posts table for linking existing content
    - Add foreign key constraint to content table

  2. Storage Setup
    - Create post_images bucket for user uploaded images
    - Set up RLS policies for image access

  3. Security
    - Allow authenticated users to upload images
    - Allow public read access to post images
*/

-- Add content_id column to posts table
ALTER TABLE posts ADD COLUMN content_id uuid REFERENCES content(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_posts_content_id ON posts(content_id);

-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public) VALUES ('post_images', 'post_images', true);

-- Storage policies for post_images bucket
CREATE POLICY "Allow authenticated users to upload post images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'post_images');

CREATE POLICY "Allow public read access to post images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'post_images');

CREATE POLICY "Allow users to delete their own post images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'post_images' AND auth.uid()::text = (storage.foldername(name))[1]);