/*
  # Create function to get post reaction counts

  1. Functions
    - `get_post_reaction_counts` - Returns reaction counts for a specific post
  
  2. Security
    - Function is accessible to all users (public)
*/

CREATE OR REPLACE FUNCTION get_post_reaction_counts(post_uuid UUID)
RETURNS TABLE(reaction_type TEXT, count BIGINT)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    r.reaction_type,
    COUNT(*) as count
  FROM reactions r
  WHERE r.post_id = post_uuid
  GROUP BY r.reaction_type;
$$;