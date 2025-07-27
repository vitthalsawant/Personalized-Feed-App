import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { User, UserPlus, UserMinus } from 'lucide-react-native';
import { ProfileStats } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface UserCardProps {
  user: ProfileStats;
  isFollowing?: boolean;
  onFollowChange?: () => void;
}

export default function UserCard({ user, isFollowing = false, onFollowChange }: UserCardProps) {
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();

  const handleFollowToggle = async () => {
    if (!currentUser || currentUser.id === user.id) return;

    setLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', user.id);
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: user.id,
          });
      }

      onFollowChange?.();
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setLoading(false);
    }
  };

  const isCurrentUser = currentUser?.id === user.id;

  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <User size={24} color="#64748b" />
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>{user.full_name || 'Unknown User'}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          <View style={styles.stats}>
            <Text style={styles.statText}>{user.posts_count} posts</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.statText}>{user.followers_count} followers</Text>
          </View>
        </View>
      </View>

      {!isCurrentUser && (
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowing && styles.followingButton,
            loading && styles.followButtonDisabled,
          ]}
          onPress={handleFollowToggle}
          disabled={loading}
        >
          {isFollowing ? (
            <UserMinus size={16} color="#ef4444" />
          ) : (
            <UserPlus size={16} color="#3b82f6" />
          )}
          <Text
            style={[
              styles.followButtonText,
              isFollowing && styles.followingButtonText,
            ]}
          >
            {loading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 4,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  separator: {
    fontSize: 12,
    color: '#94a3b8',
    marginHorizontal: 6,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  followingButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  followButtonDisabled: {
    opacity: 0.6,
  },
  followButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#3b82f6',
  },
  followingButtonText: {
    color: '#ef4444',
  },
});