import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { PostWithReactions } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import PostCard from '@/components/PostCard';
import { router } from 'expo-router';

export default function GlobalFeedScreen() {
  const [posts, setPosts] = useState<PostWithReactions[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchPosts = async () => {
    try {
      console.log('Fetching posts...');
      // Fetch posts with reactions
      const { data: postsData, error } = await supabase
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

      console.log('Posts fetched:', postsData?.length || 0);

      // Fetch reactions for each post
      const postsWithReactions = await Promise.all(
        (postsData || []).map(async (post) => {
          // Get reaction counts
          const { data: reactionCounts, error: reactionError } = await supabase
            .rpc('get_post_reaction_counts', { post_uuid: post.id });

          if (reactionError) {
            console.error('Error fetching reaction counts:', reactionError);
          }

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
    await fetchPosts();
    setRefreshing(false);
  };

  const handleReactionUpdate = () => {
    fetchPosts();
  };
  useEffect(() => {
    fetchPosts();
  }, [user]);

  const handleAuthorPress = (authorId: string) => {
    // For now, just navigate to user posts
    // In the future, this could navigate to a specific user's profile
    router.push('/(tabs)/user-posts');
  };

  const renderPost = ({ item }: { item: PostWithReactions }) => (
    <PostCard 
      post={item} 
      onReactionUpdate={handleReactionUpdate}
      onAuthorPress={handleAuthorPress}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Explore posts from the community</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
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
});