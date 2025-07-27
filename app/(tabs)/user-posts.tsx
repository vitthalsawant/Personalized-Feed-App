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
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { PostWithReactions } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import PostCard from '@/components/PostCard';

export default function UserPostsScreen() {
  const [posts, setPosts] = useState<PostWithReactions[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchUserPosts = async () => {
    if (!user) return;

    try {
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
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user posts:', error);
        return;
      }

      // Add reaction data to posts
      const postsWithReactions = await Promise.all(
        (postsData || []).map(async (post) => {
          // Get reaction counts
          const { data: reactionCounts } = await supabase
            .rpc('get_post_reaction_counts', { post_uuid: post.id });

          // Get user's reaction
          const { data: userReaction } = await supabase
            .from('reactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('post_id', post.id)
            .single();

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
    await fetchUserPosts();
    setRefreshing(false);
  };

  const handleReactionUpdate = () => {
    fetchUserPosts();
  };

  useEffect(() => {
    fetchUserPosts();
  }, [user]);

  const handleAuthorPress = (authorId: string) => {
    // Already on user posts, no need to navigate
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
      <Text style={styles.emptyTitle}>No posts yet</Text>
      <Text style={styles.emptyDescription}>
        Start sharing your thoughts with the community
      </Text>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => router.push('/(tabs)/create')}
      >
        <Text style={styles.createButtonText}>Create Your First Post</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>My Posts</Text>
        <View style={{ width: 24 }} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
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
  createButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});