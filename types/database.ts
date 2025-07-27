export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  author_id: string;
  location: string;
  latitude?: number;
  longitude?: number;
  image_urls: string[];
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  post_tags?: PostTag[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface PostTag {
  id: string;
  post_id: string;
  tag_id: string;
  tags?: Tag;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  preferred_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Reaction {
  id: string;
  user_id: string;
  post_id: string;
  reaction_type: 'like' | 'dislike' | 'love' | 'laugh' | 'angry' | 'sad';
  created_at: string;
  profiles?: Profile;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower?: Profile;
  following?: Profile;
}

export interface ProfileStats extends Profile {
  followers_count: number;
  following_count: number;
  posts_count: number;
}

export interface PostWithReactions extends Post {
  reactions?: Reaction[];
  user_reaction?: Reaction;
  reaction_counts?: { [key: string]: number };
}