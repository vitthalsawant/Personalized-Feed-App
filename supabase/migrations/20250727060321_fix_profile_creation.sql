/*
  # Fix Profile and Post Creation Issues

  1. Ensure profile creation works properly
  2. Add better error handling for post creation
  3. Fix any RLS policy issues
  4. Add debugging functions
*/

-- Drop and recreate the handle_new_user function with better error handling
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
    INSERT INTO public.profiles (id, username, full_name)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
      COALESCE(new.raw_user_meta_data->>'full_name', '')
    );
  END IF;
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create a function to ensure profile exists
CREATE OR REPLACE FUNCTION ensure_profile_exists(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_uuid) THEN
    -- Create profile if it doesn't exist
    INSERT INTO public.profiles (id, username, full_name)
    VALUES (
      user_uuid,
      'user_' || substr(user_uuid::text, 1, 8),
      ''
    );
    RETURN TRUE;
  END IF;
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to ensure profile exists for user %: %', user_uuid, SQLERRM;
    RETURN FALSE;
END;
$$;

-- Ensure all existing auth users have profiles
INSERT INTO public.profiles (id, username, full_name)
SELECT 
  id,
  'user_' || substr(id::text, 1, 8),
  ''
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Drop and recreate post policies with better error handling
DROP POLICY IF EXISTS "Authenticated users can insert posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

CREATE POLICY "Authenticated users can insert posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = author_id)
  );

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

-- Create a function to debug post creation issues
CREATE OR REPLACE FUNCTION debug_post_creation(user_uuid UUID)
RETURNS TABLE(
  user_exists BOOLEAN,
  profile_exists BOOLEAN,
  profile_id UUID,
  can_insert_posts BOOLEAN
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    EXISTS(SELECT 1 FROM auth.users WHERE id = user_uuid) as user_exists,
    EXISTS(SELECT 1 FROM profiles WHERE id = user_uuid) as profile_exists,
    p.id as profile_id,
    EXISTS(SELECT 1 FROM profiles WHERE id = user_uuid) as can_insert_posts
  FROM profiles p
  WHERE p.id = user_uuid;
$$; 