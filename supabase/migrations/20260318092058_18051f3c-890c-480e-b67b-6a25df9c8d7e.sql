
-- Create device-proofs storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('device-proofs', 'device-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to device-proofs
CREATE POLICY "Users can upload device proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'device-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to device-proofs
CREATE POLICY "Public can read device proofs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'device-proofs');

-- Allow users to delete their own proofs
CREATE POLICY "Users can delete own device proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'device-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
