-- Add keterangan and deret columns to akta_perkawinan table
ALTER TABLE akta_perkawinan 
ADD COLUMN IF NOT EXISTS keterangan TEXT,
ADD COLUMN IF NOT EXISTS deret TEXT;

-- Create policy/index if needed (optional for now)
