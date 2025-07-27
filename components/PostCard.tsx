import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { MapPin, Clock, User, Heart, ThumbsUp, ThumbsDown, Laugh, Frown, MessageCircle } from 'lucide-react-native';
import { PostWithReactions } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface PostCardProps {
  post: PostWithReactions;
  onPress?: () => void;
  onReactionUpdate?: () => void;
  onAuthorPress?: (authorId: string) => void;
}

export default function PostCard({ post, onPress, onReactionUpdate, onAuthorPress }: PostCardProps) {
  const { user } = useAuth();

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleReaction = async (reactionType: string) => {
    if (!user) return;

    try {
      // Check if user already reacted
      const { data: existingReaction } = await supabase
        .from('reactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', post.id)
        .single();

      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) {
          // Remove reaction if same type
          await supabase
            .from('reactions')
            .delete()
            .eq('id', existingReaction.id);
        } else {
          // Update reaction type
          await supabase
            .from('reactions')
            .update({ reaction_type: reactionType })
            .eq('id', existingReaction.id);
        }
      } else {
        // Add new reaction
        await supabase
          .from('reactions')
          .insert({
            user_id: user.id,
            post_id: post.id,
            reaction_type: reactionType,
          });
      }

      onReactionUpdate?.();
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const getReactionIcon = (type: string, size: number = 16, color: string = '#64748b') => {
    switch (type) {
      case 'like':
        return <ThumbsUp size={size} color={color} />;
      case 'dislike':
        return <ThumbsDown size={size} color={color} />;
      case 'love':
        return <Heart size={size} color={color} />;
      case 'laugh':
        return <Laugh size={size} color={color} />;
      default:
        return <ThumbsUp size={size} color={color} />;
    }
  };

  const getUserReactionType = () => {
    return post.user_reaction?.reaction_type;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.95}>
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <TouchableOpacity 
            style={styles.avatar}
            onPress={() => onAuthorPress?.(post.author_id)}
          >
            {post.profiles?.avatar_url ? (
              <Image 
                source={{ uri: post.profiles.avatar_url }} 
                style={styles.avatarImage}
              />
            ) : (
            <User size={20} color="#64748b" />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.authorDetails}
            onPress={() => onAuthorPress?.(post.author_id)}
          >
            <Text style={styles.authorName}>
              {post.profiles?.username || 'unknown_user'}
            </Text>
            <View style={styles.metadata}>
              <Clock size={12} color="#64748b" />
              <Text style={styles.timestamp}>{formatTimeAgo(post.created_at)}</Text>
              {post.location && (
                <>
                  <Text style={styles.separator}>•</Text>
                  <MapPin size={12} color="#64748b" />
                  <Text style={styles.location}>{post.location}</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.title}>{post.title}</Text>
      {post.description && (
        <Text style={styles.description} numberOfLines={3}>
          {post.description}
        </Text>
      )}

      {post.post_tags && post.post_tags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagsContainer}
          contentContainerStyle={styles.tagsContent}
        >
          {post.post_tags.map((postTag) => (
            <View
              key={postTag.id}
              style={[
                styles.tag,
                { backgroundColor: postTag.tags?.color + '20' },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  { color: postTag.tags?.color || '#3b82f6' },
                ]}
              >
                {postTag.tags?.name}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {post.image_urls && post.image_urls.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imagesContainer}
        >
          {post.image_urls.map((imageUrl, index) => (
            <Image
              key={index}
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}

      <View style={styles.actionsContainer}>
        <View style={styles.reactions}>
          <TouchableOpacity
            style={[
              styles.reactionButton,
              getUserReactionType() === 'like' && styles.reactionButtonActive,
            ]}
            onPress={() => handleReaction('like')}
          >
            {getReactionIcon('like', 16, getUserReactionType() === 'like' ? '#3b82f6' : '#64748b')}
            <Text style={[
              styles.reactionCount,
              getUserReactionType() === 'like' && styles.reactionCountActive,
            ]}>
              {post.reaction_counts?.like || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.reactionButton,
              getUserReactionType() === 'love' && styles.reactionButtonActive,
            ]}
            onPress={() => handleReaction('love')}
          >
            {getReactionIcon('love', 16, getUserReactionType() === 'love' ? '#ef4444' : '#64748b')}
            <Text style={[
              styles.reactionCount,
              getUserReactionType() === 'love' && styles.reactionCountActive,
            ]}>
              {post.reaction_counts?.love || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.reactionButton,
              getUserReactionType() === 'laugh' && styles.reactionButtonActive,
            ]}
            onPress={() => handleReaction('laugh')}
          >
            {getReactionIcon('laugh', 16, getUserReactionType() === 'laugh' ? '#f59e0b' : '#64748b')}
            <Text style={[
              styles.reactionCount,
              getUserReactionType() === 'laugh' && styles.reactionCountActive,
            ]}>
              {post.reaction_counts?.laugh || 0}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.commentButton}>
          <MessageCircle size={16} color="#64748b" />
          <Text style={styles.commentText}>Comment</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 2,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  separator: {
    fontSize: 12,
    color: '#64748b',
    marginHorizontal: 4,
  },
  location: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#475569',
    lineHeight: 22,
    marginBottom: 12,
  },
  tagsContainer: {
    marginBottom: 12,
  },
  tagsContent: {
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  imagesContainer: {
    marginTop: 8,
  },
  image: {
    width: 200,
    height: 120,
    borderRadius: 12,
    marginRight: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  reactions: {
    flexDirection: 'row',
    gap: 16,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
  },
  reactionButtonActive: {
    backgroundColor: '#eff6ff',
  },
  reactionCount: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  reactionCountActive: {
    color: '#3b82f6',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  commentText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
});