/*
  # Fix Post Creation Issues

  1. Database Functions
    - Add function to get post reaction counts
    - Ensure proper RLS policies for post creation
    
  2. Sample Data
    - Add sample tags for testing
    - Ensure all required tables have data
    
  3. Security
    - Fix RLS policies for authenticated users
    - Allow public read access to posts
*/

-- Create function to get post reaction counts
CREATE OR REPLACE FUNCTION get_post_reaction_counts(post_uuid UUID)
RETURNS TABLE(reaction_type TEXT, count BIGINT)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    r.reaction_type,
    COUNT(*) as count
  FROM reactions r
  WHERE r.post_id = post_uuid
  GROUP BY r.reaction_type;
$$;

-- Ensure proper RLS policies for posts
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

CREATE POLICY "Posts are viewable by everyone"
  ON posts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts"
  ON posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Ensure proper RLS policies for post_tags
DROP POLICY IF EXISTS "Post tags are viewable by everyone" ON post_tags;
DROP POLICY IF EXISTS "Post authors can manage post tags" ON post_tags;

CREATE POLICY "Post tags are viewable by everyone"
  ON post_tags
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage post tags"
  ON post_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_tags.post_id 
      AND posts.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_tags.post_id 
      AND posts.author_id = auth.uid()
    )
  );

-- Add sample tags if they don't exist
INSERT INTO tags (name, color) VALUES
  ('Technology', '#3B82F6'),
  ('Travel', '#10B981'),
  ('Food', '#F59E0B'),
  ('Sports', '#EF4444'),
  ('Music', '#8B5CF6'),
  ('Art', '#F97316'),
  ('Science', '#06B6D4'),
  ('Gaming', '#84CC16')
ON CONFLICT (name) DO NOTHING;

-- Ensure profiles table has proper policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO public
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);