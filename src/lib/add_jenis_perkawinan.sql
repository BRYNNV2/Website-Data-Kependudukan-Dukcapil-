-- Add jenis column to akta_perkawinan table
ALTER TABLE akta_perkawinan 
ADD COLUMN IF NOT EXISTS jenis TEXT DEFAULT 'Umum';
