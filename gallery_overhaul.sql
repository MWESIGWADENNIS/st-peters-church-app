-- Gallery Overhaul Schema

-- 1. Update gallery_albums to include a type if needed, but albums can be mixed.
-- However, the user said "when an album is created, videos can be posted as url from YouTube and then if photos, they can be uploaded".
-- This implies an album might be specific to a type or mixed. Let's allow mixed.

-- 2. Rename gallery_photos to gallery_items to be more generic
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gallery_photos') THEN
    ALTER TABLE gallery_photos RENAME TO gallery_items;
  END IF;
END $$;

-- 3. Ensure gallery_items and gallery_albums have the correct columns
DO $$
BEGIN
  -- Rename gallery_albums.cover_photo_url to cover_image_url if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gallery_albums' AND column_name = 'cover_photo_url') THEN
    ALTER TABLE gallery_albums RENAME COLUMN cover_photo_url TO cover_image_url;
  END IF;

  -- Rename gallery_items.photo_url to url if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gallery_items' AND column_name = 'photo_url') THEN
    ALTER TABLE gallery_items RENAME COLUMN photo_url TO url;
  END IF;

  -- Rename gallery_items.caption to title if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gallery_items' AND column_name = 'caption') THEN
    ALTER TABLE gallery_items RENAME COLUMN caption TO title;
  END IF;

  -- Add type column (image or video)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gallery_items' AND column_name = 'type') THEN
    ALTER TABLE gallery_items ADD COLUMN type TEXT DEFAULT 'image';
  END IF;

  -- Add thumbnail_url for videos
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gallery_items' AND column_name = 'thumbnail_url') THEN
    ALTER TABLE gallery_items ADD COLUMN thumbnail_url TEXT;
  END IF;

  -- Add likes_count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gallery_items' AND column_name = 'likes_count') THEN
    ALTER TABLE gallery_items ADD COLUMN likes_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- 4. Create gallery_likes table
CREATE TABLE IF NOT EXISTS gallery_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES gallery_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(item_id, user_id)
);

-- 5. Enable RLS
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_likes ENABLE ROW LEVEL SECURITY;

-- 6. Policies for gallery_items
DROP POLICY IF EXISTS "Anyone can view gallery items" ON gallery_items;
CREATE POLICY "Anyone can view gallery items" ON gallery_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage gallery items" ON gallery_items;
CREATE POLICY "Admins can manage gallery items" ON gallery_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 7. Policies for gallery_likes
DROP POLICY IF EXISTS "Anyone can view gallery likes" ON gallery_likes;
CREATE POLICY "Anyone can view gallery likes" ON gallery_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can like gallery items" ON gallery_likes;
CREATE POLICY "Authenticated users can like gallery items" ON gallery_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike their own likes" ON gallery_likes;
CREATE POLICY "Users can unlike their own likes" ON gallery_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Function to handle gallery likes
CREATE OR REPLACE FUNCTION handle_gallery_like()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE gallery_items SET likes_count = likes_count + 1 WHERE id = NEW.item_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE gallery_items SET likes_count = likes_count - 1 WHERE id = OLD.item_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger for gallery likes
DROP TRIGGER IF EXISTS on_gallery_like ON gallery_likes;
CREATE TRIGGER on_gallery_like
  AFTER INSERT OR DELETE ON gallery_likes
  FOR EACH ROW EXECUTE FUNCTION handle_gallery_like();
