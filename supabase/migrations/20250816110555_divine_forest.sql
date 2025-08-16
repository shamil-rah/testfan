/*
  # Update products table and create user_purchases table for digital/physical product management

  1. Products Table Updates
    - Add `digital_content_id` column to link digital products to content files
    - Add constraints to ensure proper data integrity for digital vs physical products
    - Update existing constraints to accommodate new structure

  2. New Tables
    - `user_purchases`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `product_uuid` (uuid, foreign key to products)
      - `quantity` (integer, number of units purchased)
      - `selected_options` (jsonb, variant options like size/color)
      - `printify_variant_id` (integer, specific Printify variant)
      - `download_link` (text, URL for digital products)
      - `purchase_date` (timestamp)
      - `stripe_checkout_session_id` (text, links items from same checkout)
      - `fulfillment_status` (text, tracks order status)

  3. Security
    - Enable RLS on `user_purchases` table
    - Add policies for users to manage their own purchases
    - Update products table policies if needed

  4. Performance
    - Add indexes for efficient querying
    - Add triggers for automatic timestamp updates
</*/

-- First, add the digital_content_id column to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'digital_content_id'
  ) THEN
    ALTER TABLE products ADD COLUMN digital_content_id uuid;
  END IF;
END $$;

-- Add foreign key constraint for digital_content_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'products_digital_content_id_fkey'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_digital_content_id_fkey 
    FOREIGN KEY (digital_content_id) REFERENCES content(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Drop existing type check constraint if it exists and add new comprehensive constraint
DO $$
BEGIN
  -- Drop old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'products_type_check' AND table_name = 'products'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_type_check;
  END IF;
  
  -- Add new comprehensive type constraint
  ALTER TABLE products ADD CONSTRAINT products_type_digital_physical_check 
  CHECK (
    (type = 'digital' AND digital_content_id IS NOT NULL AND id IS NOT NULL) OR
    (type = 'physical' AND digital_content_id IS NULL AND id IS NOT NULL)
  );
END $$;

-- Create user_purchases table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_uuid uuid,
  quantity integer NOT NULL DEFAULT 1,
  selected_options jsonb DEFAULT '{}',
  printify_variant_id integer,
  download_link text,
  purchase_date timestamptz DEFAULT now(),
  stripe_checkout_session_id text,
  fulfillment_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraints for user_purchases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_purchases_user_id_fkey'
  ) THEN
    ALTER TABLE user_purchases 
    ADD CONSTRAINT user_purchases_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_purchases_product_uuid_fkey'
  ) THEN
    ALTER TABLE user_purchases 
    ADD CONSTRAINT user_purchases_product_uuid_fkey 
    FOREIGN KEY (product_uuid) REFERENCES products(uuid) ON DELETE SET NULL;
  END IF;
END $$;

-- Add check constraints for user_purchases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_purchases_quantity_check'
  ) THEN
    ALTER TABLE user_purchases ADD CONSTRAINT user_purchases_quantity_check 
    CHECK (quantity > 0);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_purchases_fulfillment_status_check'
  ) THEN
    ALTER TABLE user_purchases ADD CONSTRAINT user_purchases_fulfillment_status_check 
    CHECK (fulfillment_status IN ('pending', 'processing', 'fulfilled', 'shipped', 'delivered', 'downloaded', 'cancelled'));
  END IF;
END $$;

-- Create indexes for user_purchases for better performance
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_product_uuid ON user_purchases(product_uuid);
CREATE INDEX IF NOT EXISTS idx_user_purchases_purchase_date ON user_purchases(purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_purchases_stripe_session ON user_purchases(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_fulfillment_status ON user_purchases(fulfillment_status);

-- Create index for products digital_content_id
CREATE INDEX IF NOT EXISTS idx_products_digital_content_id ON products(digital_content_id);

-- Enable RLS on user_purchases table
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_purchases
CREATE POLICY "Users can read their own purchases"
  ON user_purchases
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own purchases"
  ON user_purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own purchases"
  ON user_purchases
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own purchases"
  ON user_purchases
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add trigger for automatic updated_at timestamp on user_purchases
CREATE TRIGGER update_user_purchases_updated_at
  BEFORE UPDATE ON user_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();