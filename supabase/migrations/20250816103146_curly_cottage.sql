/*
  # Create user_carts table for persistent cart storage

  1. New Tables
    - `user_carts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `product_uuid` (uuid, foreign key to products)
      - `quantity` (integer, default 1)
      - `selected_options` (jsonb, for storing variant options like size/color)
      - `printify_variant_id` (integer, for specific Printify variants)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_carts` table
    - Add policies for users to manage their own cart items only

  3. Indexes
    - Add indexes for efficient querying by user_id and product_uuid
    - Add composite index for user_id + product_uuid + selected_options for duplicate checking
*/

-- Create user_carts table
CREATE TABLE IF NOT EXISTS user_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_uuid uuid NOT NULL REFERENCES products(uuid) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  selected_options jsonb DEFAULT '{}',
  printify_variant_id integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_carts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read their own cart items"
  ON user_carts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own cart items"
  ON user_carts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own cart items"
  ON user_carts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own cart items"
  ON user_carts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_carts_user_id ON user_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_carts_product_uuid ON user_carts(product_uuid);
CREATE INDEX IF NOT EXISTS idx_user_carts_created_at ON user_carts(created_at);

-- Create composite index for efficient duplicate checking
CREATE INDEX IF NOT EXISTS idx_user_carts_unique_item 
  ON user_carts(user_id, product_uuid, selected_options, printify_variant_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_user_carts_updated_at
  BEFORE UPDATE ON user_carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();