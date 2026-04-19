-- Add preacher and leader image URLs to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS preacher_image_url TEXT,
ADD COLUMN IF NOT EXISTS leader_image_url TEXT;
