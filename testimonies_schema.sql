-- SQL for Testimonies and Likes

-- 1. Create testimonies table
CREATE TABLE IF NOT EXISTS testimonies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  likes INTEGER DEFAULT 0,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create testimony_likes table to track who liked what
CREATE TABLE IF NOT EXISTS testimony_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  testimony_id UUID REFERENCES testimonies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(testimony_id, user_id)
);

-- 3. Create functions to increment/decrement likes atomically
-- These use SECURITY DEFINER to bypass RLS for the update operation
CREATE OR REPLACE FUNCTION increment_testimony_likes(testimony_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE testimonies
  SET likes = COALESCE(likes, 0) + 1
  WHERE id = testimony_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_testimony_likes(testimony_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE testimonies
  SET likes = GREATEST(0, COALESCE(likes, 0) - 1)
  WHERE id = testimony_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE testimonies ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimony_likes ENABLE ROW LEVEL SECURITY;

-- 5. Policies for testimonies
-- Anyone can read approved testimonies
DROP POLICY IF EXISTS "Anyone can read approved testimonies" ON testimonies;
CREATE POLICY "Anyone can read approved testimonies" ON testimonies
  FOR SELECT USING (status = 'approved');

-- Users can see their own testimonies regardless of status
DROP POLICY IF EXISTS "Users can see their own testimonies" ON testimonies;
CREATE POLICY "Users can see their own testimonies" ON testimonies
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own testimonies
DROP POLICY IF EXISTS "Users can insert their own testimonies" ON testimonies;
CREATE POLICY "Users can insert their own testimonies" ON testimonies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own testimonies (e.g. if they want to edit)
DROP POLICY IF EXISTS "Users can update their own testimonies" ON testimonies;
CREATE POLICY "Users can update their own testimonies" ON testimonies
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can manage all testimonies
DROP POLICY IF EXISTS "Admins can manage all testimonies" ON testimonies;
CREATE POLICY "Admins can manage all testimonies" ON testimonies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 6. Policies for testimony_likes
-- Users can see all likes
DROP POLICY IF EXISTS "Anyone can see likes" ON testimony_likes;
CREATE POLICY "Anyone can see likes" ON testimony_likes
  FOR SELECT USING (true);

-- Authenticated users can like/unlike
DROP POLICY IF EXISTS "Users can manage their own likes" ON testimony_likes;
CREATE POLICY "Users can manage their own likes" ON testimony_likes
  FOR ALL USING (auth.uid() = user_id);
