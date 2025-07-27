import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Settings } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { PostWithReactions, Tag } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import PostCard from '@/components/PostCard';
import { router } from 'expo-router';

export default function PersonalizedFeedScreen() {
  const [posts, setPosts] = useState<PostWithReactions[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [preferredTags, setPreferredTags] = useState<string[]>([]);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const { user } = useAuth();

  const fetchUserPreferences = async () => {
    if (!user) return;

    try {
      // Fetch preferred tags
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferred_tags')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setPreferredTags(data.preferred_tags || []);
      }

      // Fetch followed users
      const { data: followsData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followsData) {
        setFollowedUsers(followsData.map(f => f.following_id));
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const fetchPersonalizedPosts = async () => {
    try {
      const { data: allPosts, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (
            id,
            username,
            full_name,
            avatar_url
          ),
          post_tags (
            id,
            tag_id,
            tags (
              id,
              name,
              color
            )
          )
        `)
        .order('created_at', { ascending: false });


      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      let filteredPosts = allPosts || [];

      // Enhanced personalization logic
      if (preferredTags.length > 0 || followedUsers.length > 0) {
        filteredPosts = filteredPosts.filter((post) =>
          // Posts from followed users get priority
          followedUsers.includes(post.author_id) ||
          // Posts with preferred tags
          post.post_tags?.some((postTag) =>
            preferredTags.includes(postTag.tag_id)
          ) ||
          // Recent posts from users with similar interests
          (new Date(post.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000)
        );
      }

      // If no preferred tags or no matching posts, show recent posts
      if (filteredPosts.length === 0) {
        filteredPosts = allPosts?.slice(0, 10) || [];
      }

      // Add reaction data to posts
      const postsWithReactions = await Promise.all(
        filteredPosts.map(async (post) => {
          // Get reaction counts
          const { data: reactionCounts } = await supabase
            .rpc('get_post_reaction_counts', { post_uuid: post.id });

          // Get user's reaction if logged in
          let userReaction = null;
          if (user) {
            const { data } = await supabase
              .from('reactions')
              .select('*')
              .eq('user_id', user.id)
              .eq('post_id', post.id)
              .single();
            userReaction = data;
          }

          // Convert reaction counts to object
          const reactionCountsObj = (reactionCounts || []).reduce((acc: any, curr: any) => {
            acc[curr.reaction_type] = curr.count;
            return acc;
          }, {});

          return {
            ...post,
            user_reaction: userReaction,
            reaction_counts: reactionCountsObj,
          };
        })
      );

      setPosts(postsWithReactions);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserPreferences();
    await fetchPersonalizedPosts();
    setRefreshing(false);
  };

  const handleReactionUpdate = () => {
    fetchPersonalizedPosts();
  };
  useEffect(() => {
    fetchUserPreferences();
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPersonalizedPosts();
    }
  }, [preferredTags, followedUsers, user]);

  const handleAuthorPress = (authorId: string) => {
    // Navigate to user posts for now
    router.push('/(tabs)/user-posts');
  };

  const renderPost = ({ item }: { item: PostWithReactions }) => (
    <PostCard 
      post={item} 
      onReactionUpdate={handleReactionUpdate}
      onAuthorPress={handleAuthorPress}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No personalized posts yet</Text>
      <Text style={styles.emptyDescription}>
        Set your preferences to see posts tailored for you
      </Text>
      <TouchableOpacity style={styles.preferencesButton}>
        <Settings size={16} color="#3b82f6" />
        <Text style={styles.preferencesButtonText}>Set Preferences</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>For You</Text>
        <Text style={styles.subtitle}>Posts tailored to your interests</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={[
          styles.listContent,
          posts.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  preferencesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  preferencesButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#3b82f6',
  },
});