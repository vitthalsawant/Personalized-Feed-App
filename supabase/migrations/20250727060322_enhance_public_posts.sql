/*
  # Enhance Public Posts Visibility

  1. Ensure all posts are publicly visible
  2. Add better indexing for performance
  3. Add function to get user's public posts
  4. Ensure proper RLS policies for public viewing
*/

-- Ensure posts are publicly viewable
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
CREATE POLICY "Posts are viewable by everyone"
  ON posts
  FOR SELECT
  TO public
  USING (true);

-- Add function to get user's public posts with profile info
CREATE OR REPLACE FUNCTION get_user_public_posts(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  author_id UUID,
  location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  image_urls TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  author_username TEXT,
  author_full_name TEXT,
  author_avatar_url TEXT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.title,
    p.description,
    p.author_id,
    p.location,
    p.latitude,
    p.longitude,
    p.image_urls,
    p.created_at,
    p.updated_at,
    pr.username as author_username,
    pr.full_name as author_full_name,
    pr.avatar_url as author_avatar_url
  FROM posts p
  JOIN profiles pr ON p.author_id = pr.id
  WHERE p.author_id = user_uuid
  ORDER BY p.created_at DESC
  LIMIT limit_count;
$$;

-- Add function to get recent public posts with author info
CREATE OR REPLACE FUNCTION get_recent_public_posts(limit_count INTEGER DEFAULT 20)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  author_id UUID,
  location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  image_urls TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  author_username TEXT,
  author_full_name TEXT,
  author_avatar_url TEXT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.title,
    p.description,
    p.author_id,
    p.location,
    p.latitude,
    p.longitude,
    p.image_urls,
    p.created_at,
    p.updated_at,
    pr.username as author_username,
    pr.full_name as author_full_name,
    pr.avatar_url as author_avatar_url
  FROM posts p
  JOIN profiles pr ON p.author_id = pr.id
  ORDER BY p.created_at DESC
  LIMIT limit_count;
$$;

-- Add better indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_public_feed ON posts(created_at DESC) WHERE true;

-- Ensure reactions are publicly viewable
DROP POLICY IF EXISTS "Users can view all reactions" ON reactions;
CREATE POLICY "Users can view all reactions"
  ON reactions
  FOR SELECT
  TO public
  USING (true);

-- Add function to get post with full author details
CREATE OR REPLACE FUNCTION get_post_with_author(post_uuid UUID)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  author_id UUID,
  location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  image_urls TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  author_username TEXT,
  author_full_name TEXT,
  author_avatar_url TEXT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.title,
    p.description,
    p.author_id,
    p.location,
    p.latitude,
    p.longitude,
    p.image_urls,
    p.created_at,
    p.updated_at,
    pr.username as author_username,
    pr.full_name as author_full_name,
    pr.avatar_url as author_avatar_url
  FROM posts p
  JOIN profiles pr ON p.author_id = pr.id
  WHERE p.id = post_uuid;
$$; 