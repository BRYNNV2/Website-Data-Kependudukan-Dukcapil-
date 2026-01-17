-- Add latitude and longitude to kartu_keluarga table for GIS
ALTER TABLE kartu_keluarga
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION;
