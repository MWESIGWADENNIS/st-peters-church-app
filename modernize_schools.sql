-- Migration: Modernize Schools Ministry
-- Run this in your Supabase SQL Editor to update the schools table

ALTER TABLE schools ADD COLUMN IF NOT EXISTS patron_name TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS motto TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS vision TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS mission TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS activities TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS student_count INTEGER;

-- Update RLS if needed (already covered by is_admin() policy in setup)
