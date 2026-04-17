-- St. Peter's Church of Uganda - Supabase Setup Script

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Tables

-- Zones
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Church Settings
CREATE TABLE church_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_name TEXT NOT NULL DEFAULT 'St. Peter''s Church of Uganda',
  parish TEXT DEFAULT 'Nkoma Parish',
  archdeaconry TEXT DEFAULT 'Mbale Urban Archdeaconry',
  diocese TEXT DEFAULT 'Mbale Diocese',
  address TEXT DEFAULT 'Nambozo Road, Nkoma, Mbale City, Uganda',
  phone TEXT DEFAULT '+256 700 000 000',
  email TEXT DEFAULT 'info@stpeters.app',
  history TEXT,
  youtube_channel_url TEXT,
  logo_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (Profiles)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  zone_id UUID REFERENCES zones(id),
  avatar_url TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ministries
CREATE TABLE ministries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  leader_name TEXT,
  photo_url TEXT,
  practice_day TEXT,
  practice_time TEXT,
  practice_venue TEXT,
  encourage_text TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Ministries (Many-to-Many)
CREATE TABLE user_ministries (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ministry_id UUID REFERENCES ministries(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, ministry_id)
);

-- Services
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  day_of_week TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  description TEXT,
  programme TEXT,
  psalms_reading TEXT,
  first_reading TEXT,
  second_reading TEXT,
  preacher TEXT,
  leader TEXT,
  theme TEXT,
  language TEXT DEFAULT 'English',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sermons
CREATE TABLE sermons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  preacher TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  media_url TEXT, -- YouTube or Audio URL
  thumbnail_url TEXT,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hymns
CREATE TABLE hymns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  lyrics TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Bread
CREATE TABLE daily_bread (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  bible_verse TEXT NOT NULL,
  verse_text TEXT,
  devotion_body TEXT NOT NULL,
  prayer TEXT,
  devotion_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  is_pinned BOOLEAN DEFAULT false,
  target TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  location TEXT NOT NULL,
  image_url TEXT,
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prayer Requests
CREATE TABLE prayer_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_answered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Livestream
CREATE TABLE livestream (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youtube_url TEXT,
  is_live BOOLEAN DEFAULT false,
  title TEXT DEFAULT 'Sunday Service',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leadership
CREATE TABLE leadership (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schools
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT,
  description TEXT,
  photo_url TEXT,
  chapel_day TEXT,
  chapel_time TEXT,
  patron_name TEXT,
  minister_name TEXT,
  motto TEXT,
  vision TEXT,
  mission TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  activities TEXT,
  website_url TEXT,
  student_count INTEGER,
  is_church_school BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Choir Videos
CREATE TABLE choir_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  recorded_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Church Videos (General clips, testimonies, messages)
CREATE TABLE church_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT, -- Optional if direct upload
  video_url TEXT,   -- For direct uploads
  thumbnail_url TEXT,
  category TEXT DEFAULT 'General', -- 'Choir', 'Testimony', 'Message', 'General'
  views INTEGER DEFAULT 0,
  recorded_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Comments
CREATE TABLE video_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES church_videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_photo TEXT,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Video Comments
ALTER TABLE video_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone" 
ON video_comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post comments" 
ON video_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own comments" 
ON video_comments FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- Function to increment views
CREATE OR REPLACE FUNCTION increment_video_views(video_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE church_videos
  SET views = views + 1
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Seed Data

-- Initial Zones
INSERT INTO zones (name) VALUES 
('Bujoloto'), ('Namakwekwe'), ('Kasanja'), ('Central'), ('Kiteso'), ('Mpumudde'), ('Buyonjo');

-- Initial Ministries
INSERT INTO ministries (name, description, leader_name, practice_day, practice_time) VALUES 
('Youth Choir', 'Leading the youth in worship and spiritual growth through music.', 'Youth Choir Leader', 'Saturday', '4:00 PM'),
('Main Choir', 'Leading the congregation in worship through hymns and spiritual songs.', 'Choir Master', 'Saturday', '2:00 PM'),
('Ushering', 'Welcoming and assisting congregants during services.', 'Head Usher', 'Sunday', '7:00 AM'),
('Children', 'Teaching and nurturing children in the ways of the Lord.', 'Sunday School Coordinator', 'Sunday', '8:00 AM'),
('Intercession', 'A dedicated team praying for the church and community.', 'Prayer Coordinator', 'Friday', '6:00 PM');

-- Initial Livestream Status
INSERT INTO livestream (is_live, title) VALUES (false, 'Sunday Main Service');

-- Initial Church Settings
INSERT INTO church_settings (church_name, parish, archdeaconry, diocese, address, phone, email, history, logo_url) 
VALUES (
  'St. Peter''s Church of Uganda', 
  'Nkoma Parish', 
  'Mbale Urban Archdeaconry', 
  'Mbale Diocese', 
  'Nambozo Road, Nkoma, Mbale City, Uganda', 
  '+256 700 000 000', 
  'info@stpeters.app',
  'St. Peter''s Church of Uganda, Nkoma Parish, has a rich history of serving the community in Mbale City. Founded on the principles of faith, hope, and love, the church continues to be a beacon of light for many.',
  'https://drive.google.com/uc?export=download&id=1z4iYWgYpUbCn7eQPWCDp9CjcInlR3W8R'
);

-- 4. RLS Policies

-- Enable RLS on all tables
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE hymns ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_bread ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestream ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE leadership ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE choir_videos ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Public read access for zones" ON zones FOR SELECT USING (true);
CREATE POLICY "Public read access for church_settings" ON church_settings FOR SELECT USING (true);
CREATE POLICY "Public read access for ministries" ON ministries FOR SELECT USING (true);
CREATE POLICY "Public read access for services" ON services FOR SELECT USING (true);
CREATE POLICY "Public read access for sermons" ON sermons FOR SELECT USING (true);
CREATE POLICY "Public read access for hymns" ON hymns FOR SELECT USING (true);
CREATE POLICY "Public read access for daily_bread" ON daily_bread FOR SELECT USING (true);
CREATE POLICY "Public read access for announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Public read access for events" ON events FOR SELECT USING (true);
CREATE POLICY "Public read access for livestream" ON livestream FOR SELECT USING (true);
CREATE POLICY "Public read access for leadership" ON leadership FOR SELECT USING (true);
CREATE POLICY "Public read access for schools" ON schools FOR SELECT USING (true);
CREATE POLICY "Public read access for choir_videos" ON choir_videos FOR SELECT USING (true);
CREATE POLICY "Public read access for church_videos" ON church_videos FOR SELECT USING (true);

-- User Profile Policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Public can view basic user info" ON users FOR SELECT USING (true);

-- Prayer Request Policies
CREATE POLICY "Users can view their own prayer requests" ON prayer_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own prayer requests" ON prayer_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notification Policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- User Ministries Policies
CREATE POLICY "Users can view their own ministry memberships" ON user_ministries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own ministry memberships" ON user_ministries FOR ALL USING (auth.uid() = user_id);

-- Admin Policies (Full Access)
-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  ) OR (
    auth.jwt() ->> 'email' = 'dmwesigwa200@gmail.com' 
    AND (auth.jwt() ->> 'email_verified')::boolean = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to notify all users
CREATE OR REPLACE FUNCTION notify_all_users(notif_title TEXT, notif_body TEXT, notif_type TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (user_id, title, body, type)
  SELECT id, notif_title, notif_body, notif_type
  FROM users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to notify a specific user
CREATE OR REPLACE FUNCTION notify_user(target_user_id UUID, notif_title TEXT, notif_body TEXT, notif_type TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (user_id, title, body, type)
  VALUES (target_user_id, notif_title, notif_body, notif_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Realtime for notifications
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Add notifications to the realtime publication
-- We use a DO block to handle cases where the publication might not exist or the table is already added
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- Apply Admin Policies to all tables
CREATE POLICY "Admins can do everything on zones" ON zones FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on church_settings" ON church_settings FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on users" ON users FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on ministries" ON ministries FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on user_ministries" ON user_ministries FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on services" ON services FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on sermons" ON sermons FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on hymns" ON hymns FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on daily_bread" ON daily_bread FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on announcements" ON announcements FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on events" ON events FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on prayer_requests" ON prayer_requests FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on livestream" ON livestream FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on notifications" ON notifications FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on leadership" ON leadership FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on schools" ON schools FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins can do everything on choir_videos" ON choir_videos FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins can do everything on church_videos" ON church_videos FOR ALL TO authenticated USING (is_admin());

-- 5. Storage Setup (Buckets and Policies)
-- Note: These must be run in the SQL editor. If they fail, ensure the 'storage' schema exists.

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('church-assets', 'church-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for church-assets
-- 1. Allow public to view assets (required for avatars and thumbnails)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'church-assets' );

-- 2. Allow users to upload their own avatar
-- Path format: avatars/USER_ID/filename.ext
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'church-assets' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- 3. Allow users to update/delete their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'church-assets' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'church-assets' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- 4. Allow admins to upload anything to the bucket
CREATE POLICY "Admins can upload anything"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'church-assets' AND
  public.is_admin()
);

CREATE POLICY "Admins can manage anything"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'church-assets' AND
  public.is_admin()
);
