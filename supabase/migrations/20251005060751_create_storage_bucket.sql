/*
  # Create Storage Bucket for Memes

  1. Storage
    - Create `memes` bucket for storing meme images
    - Set bucket to public for easy access
    - Add storage policies for authenticated users

  2. Security
    - Authenticated users can upload to their own folder
    - Everyone can view meme images
*/

-- Create storage bucket for memes
INSERT INTO storage.buckets (id, name, public)
VALUES ('memes', 'memes', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload memes
CREATE POLICY "Authenticated users can upload memes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'memes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow public access to view memes
CREATE POLICY "Public access to view memes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'memes');

-- Policy: Users can update their own memes
CREATE POLICY "Users can update own memes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'memes' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'memes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own memes
CREATE POLICY "Users can delete own memes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'memes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);