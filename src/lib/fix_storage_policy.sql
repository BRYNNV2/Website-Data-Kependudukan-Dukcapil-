-- POLICY: Allow Public Access to 'population_docs' bucket
-- Run this in the Supabase SQL Editor to fix the "violates row-level security policy" error.

-- 1. Allow Uploads (INSERT)
CREATE POLICY "Allow Public Uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'population_docs');

-- 2. Allow Viewing (SELECT)
CREATE POLICY "Allow Public Viewing"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'population_docs');

-- 3. Allow Updates (UPDATE)
CREATE POLICY "Allow Public Updates"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'population_docs');

-- 4. Allow Deletes (DELETE)
CREATE POLICY "Allow Public Deletes"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'population_docs');
