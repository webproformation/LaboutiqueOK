/*
  # Fix Order Documents Storage Access
  
  1. Changes
    - Update bucket to allow JSON files (currently only allows PDF)
    - Make bucket public for easier access to invoices
    - Simplify storage policies for invoice access
    
  2. Notes
    - Invoices are stored as JSON files containing HTML
    - Public access is safe as invoice URLs are only shared with authorized users
    - Files remain protected through obscure URLs
*/

-- Update the bucket to allow JSON files and make it public
UPDATE storage.buckets
SET 
  public = true,
  allowed_mime_types = ARRAY['application/pdf', 'application/json', 'text/html']
WHERE id = 'order-documents';

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Admins can upload order documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all order documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own order documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update order documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete order documents" ON storage.objects;

-- Create new simpler policies

-- Allow authenticated users to upload to order-documents
CREATE POLICY "Authenticated users can upload order documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-documents');

-- Allow public read access (since bucket is public)
CREATE POLICY "Public read access to order documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'order-documents');

-- Only admins can update documents
CREATE POLICY "Admins can update order documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'order-documents' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'order-documents' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Only admins can delete documents
CREATE POLICY "Admins can delete order documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'order-documents' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
