/*
  # Create Supabase Storage Buckets for Images

  This migration creates storage buckets for product and category images.

  ## New Storage Buckets
  - `product-images` - Store product images
  - `category-images` - Store category images

  ## Policies
  - Allow public read access to all images
  - Allow service role to upload, update, and delete images
  - Allow authenticated users to upload images

  ## Important Notes
  - Images will be accessible via public URLs
  - Old WordPress URLs (https://wp.laboutiquedemorgane...) will continue to work
  - New uploads will use Supabase Storage URLs
*/

-- Create product-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- Create category-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'category-images',
  'category-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- Policies for product-images bucket

-- Allow public to read product images
CREATE POLICY "product_images_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- Allow authenticated users to upload product images
CREATE POLICY "product_images_authenticated_upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- Allow service role to do everything
CREATE POLICY "product_images_service_all"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "product_images_authenticated_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "product_images_authenticated_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- Policies for category-images bucket

-- Allow public to read category images
CREATE POLICY "category_images_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'category-images');

-- Allow authenticated users to upload category images
CREATE POLICY "category_images_authenticated_upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'category-images');

-- Allow service role to do everything
CREATE POLICY "category_images_service_all"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'category-images')
  WITH CHECK (bucket_id = 'category-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "category_images_authenticated_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'category-images')
  WITH CHECK (bucket_id = 'category-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "category_images_authenticated_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'category-images');

-- Force PostgREST cache reload
NOTIFY pgrst, 'reload schema';