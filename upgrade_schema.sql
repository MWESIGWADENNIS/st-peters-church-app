-- St. Peter's Church of Uganda - Upgrade Schema Script

-- 1. Alter Existing Tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reminder_time TIME;

ALTER TABLE leadership ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE hymns ADD COLUMN IF NOT EXISTS is_hymn_of_week BOOLEAN DEFAULT false;

ALTER TABLE daily_bread ADD COLUMN IF NOT EXISTS read_count INTEGER DEFAULT 0;

-- 2. Create New Tables

-- Sermon Series
CREATE TABLE IF NOT EXISTS sermon_series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add series_id to sermons
ALTER TABLE sermons ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES sermon_series(id) ON DELETE SET NULL;

-- Choir Schedule
CREATE TABLE IF NOT EXISTS choir_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  description TEXT,
  practice_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  venue TEXT,
  preparation TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testimonies
CREATE TABLE IF NOT EXISTS testimonies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testimony Likes
CREATE TABLE IF NOT EXISTS testimony_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  testimony_id UUID REFERENCES testimonies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(testimony_id, user_id)
);

-- Event RSVP
CREATE TABLE IF NOT EXISTS event_rsvp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Gallery Albums
CREATE TABLE IF NOT EXISTS gallery_albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  cover_photo_url TEXT,
  description TEXT,
  event_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gallery Photos
CREATE TABLE IF NOT EXISTS gallery_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID REFERENCES gallery_albums(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notices
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  colour TEXT DEFAULT 'yellow',
  expires_at TIMESTAMPTZ,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE sermon_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE choir_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonies ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimony_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Public Read Policies
CREATE POLICY "Public read access for sermon_series" ON sermon_series FOR SELECT USING (true);
CREATE POLICY "Public read access for choir_schedule" ON choir_schedule FOR SELECT USING (true);
CREATE POLICY "Public read access for testimonies" ON testimonies FOR SELECT USING (true);
CREATE POLICY "Public read access for testimony_likes" ON testimony_likes FOR SELECT USING (true);
CREATE POLICY "Public read access for event_rsvp" ON event_rsvp FOR SELECT USING (true);
CREATE POLICY "Public read access for gallery_albums" ON gallery_albums FOR SELECT USING (true);
CREATE POLICY "Public read access for gallery_photos" ON gallery_photos FOR SELECT USING (true);
CREATE POLICY "Public read access for notices" ON notices FOR SELECT USING (true);

-- Member Insert Policies
CREATE POLICY "Members can insert testimonies" ON testimonies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can manage their own testimony likes" ON testimony_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Members can manage their own RSVPs" ON event_rsvp FOR ALL USING (auth.uid() = user_id);

-- Admin Policies
CREATE POLICY "Admins can do everything on sermon_series" ON sermon_series FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on choir_schedule" ON choir_schedule FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on testimonies" ON testimonies FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on testimony_likes" ON testimony_likes FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on event_rsvp" ON event_rsvp FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on gallery_albums" ON gallery_albums FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on gallery_photos" ON gallery_photos FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on notices" ON notices FOR ALL TO authenticated USING (is_admin());

-- 5. Storage Bucket for Gallery
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access to Gallery"
ON storage.objects FOR SELECT
USING ( bucket_id = 'gallery' );

CREATE POLICY "Admins can upload to Gallery"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery' AND
  public.is_admin()
);

CREATE POLICY "Admins can manage Gallery"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'gallery' AND
  public.is_admin()
);

-- 6. Functions for Analytics
CREATE OR REPLACE FUNCTION increment_testimony_likes(testimony_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE testimonies
  SET likes = likes + 1
  WHERE id = testimony_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_testimony_likes(testimony_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE testimonies
  SET likes = GREATEST(0, likes - 1)
  WHERE id = testimony_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_member_growth()
RETURNS TABLE (month DATE, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('month', created_at)::DATE as month,
    count(*) as count
  FROM users
  WHERE created_at > now() - interval '6 months'
  GROUP BY 1
  ORDER BY 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
