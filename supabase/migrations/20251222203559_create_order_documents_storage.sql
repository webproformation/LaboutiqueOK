/*
  # Create Storage Bucket for Order Documents

  1. Storage Setup
    - Creates `order-documents` bucket for storing invoices and order-related PDFs
    - Configured with public access disabled (requires authentication)
    - Files are organized by order number

  2. Security Policies
    - Admins can upload, read, update, and delete all documents
    - Authenticated users can only read their own order documents
    - File paths follow pattern: {order_number}/{filename}.pdf

  3. Storage Configuration
    - Max file size: 10MB per file
    - Allowed MIME types: PDF files only
    - File naming: order_number_invoice.pdf or order_number_return_label.pdf
*/

-- Create the storage bucket for order documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-documents',
  'order-documents',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload documents
CREATE POLICY "Admins can upload order documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'order-documents' AND
  is_admin(auth.uid())
);

-- Allow admins to read all documents
CREATE POLICY "Admins can read all order documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'order-documents' AND
  is_admin(auth.uid())
);

-- Allow users to read their own order documents
CREATE POLICY "Users can read their own order documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'order-documents' AND
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.user_id = auth.uid()
    AND (storage.objects.name LIKE orders.order_number || '%')
  )
);

-- Allow admins to update documents
CREATE POLICY "Admins can update order documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'order-documents' AND
  is_admin(auth.uid())
)
WITH CHECK (
  bucket_id = 'order-documents' AND
  is_admin(auth.uid())
);

-- Allow admins to delete documents
CREATE POLICY "Admins can delete order documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'order-documents' AND
  is_admin(auth.uid())
);
