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
import { ProfileStats } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import UserCard from '@/components/UserCard';

export default function FollowingScreen() {
  const [followingUsers, setFollowingUsers] = useState<ProfileStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchFollowingUsers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          profiles!follows_following_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            created_at
          )
        `)
        .eq('follower_id', user.id);

      if (error) {
        console.error('Error fetching following users:', error);
        return;
      }

      // Get stats for each user
      const usersWithStats = await Promise.all(
        (data || []).map(async (follow) => {
          const { data: stats } = await supabase
            .from('profile_stats')
            .select('*')
            .eq('id', follow.following_id)
            .single();

          return stats;
        })
      );

      setFollowingUsers(usersWithStats.filter(Boolean));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFollowingUsers();
    setRefreshing(false);
  };

  const handleFollowChange = () => {
    fetchFollowingUsers();
  };

  useEffect(() => {
    fetchFollowingUsers();
  }, [user]);

  const renderUser = ({ item }: { item: ProfileStats }) => (
    <UserCard 
      user={item} 
      isFollowing={true}
      onFollowChange={handleFollowChange}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>Not following anyone yet</Text>
      <Text style={styles.emptyDescription}>
        Discover and follow users to see their posts in your personalized feed
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Following</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={followingUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={[
          styles.listContent,
          followingUsers.length === 0 && styles.emptyListContent,
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
  },
});