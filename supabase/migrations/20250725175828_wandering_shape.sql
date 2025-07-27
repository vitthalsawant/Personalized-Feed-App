/*
  # Enhanced Social Features

  1. New Tables
    - `reactions` - User reactions (like, dislike, love, etc.) on posts
    - `follows` - User following relationships
    - `user_posts` - Enhanced view of user posts with reaction counts

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access where appropriate

  3. Functions
    - Function to get post reaction counts
    - Function to check if user follows another user
*/

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'dislike', 'love', 'laugh', 'angry', 'sad')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- Enable RLS
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Reactions policies
CREATE POLICY "Users can view all reactions"
  ON reactions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their own reactions"
  ON reactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Users can view all follows"
  ON follows
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their own follows"
  ON follows
  FOR ALL
  TO authenticated
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);

-- Function to get reaction counts for posts
CREATE OR REPLACE FUNCTION get_post_reaction_counts(post_uuid uuid)
RETURNS TABLE (
  reaction_type text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.reaction_type,
    COUNT(*) as count
  FROM reactions r
  WHERE r.post_id = post_uuid
  GROUP BY r.reaction_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user follows another user
CREATE OR REPLACE FUNCTION is_following(follower_uuid uuid, following_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = follower_uuid 
    AND following_id = following_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add follower/following counts to profiles view
CREATE OR REPLACE VIEW profile_stats AS
SELECT 
  p.*,
  COALESCE(follower_counts.followers, 0) as followers_count,
  COALESCE(following_counts.following, 0) as following_count,
  COALESCE(post_counts.posts, 0) as posts_count
FROM profiles p
LEFT JOIN (
  SELECT following_id, COUNT(*) as followers
  FROM follows
  GROUP BY following_id
) follower_counts ON p.id = follower_counts.following_id
LEFT JOIN (
  SELECT follower_id, COUNT(*) as following
  FROM follows
  GROUP BY follower_id
) following_counts ON p.id = following_counts.follower_id
LEFT JOIN (
  SELECT author_id, COUNT(*) as posts
  FROM posts
  GROUP BY author_id
) post_counts ON p.id = post_counts.author_id;

-- Grant permissions
GRANT SELECT ON profile_stats TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_post_reaction_counts(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_following(uuid, uuid) TO authenticated, anon;