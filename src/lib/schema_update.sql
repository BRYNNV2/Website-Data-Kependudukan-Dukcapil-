-- Add foto_dokumen column to all main tables
ALTER TABLE public.kartu_keluarga ADD COLUMN IF NOT EXISTS foto_dokumen TEXT;
ALTER TABLE public.penduduk ADD COLUMN IF NOT EXISTS foto_dokumen TEXT;
ALTER TABLE public.akta_kelahiran ADD COLUMN IF NOT EXISTS foto_dokumen TEXT;

-- NOTE: Ensure you have created a Supabase Storage bucket named 'population_docs'
-- and enabled public access or set appropriate RLS policies.
