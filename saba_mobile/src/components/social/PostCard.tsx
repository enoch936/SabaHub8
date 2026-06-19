import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, CheckCircle } from "lucide-react-native";
import { SocialPost, socialApi } from "../../api/social";

interface PostCardProps {
  post: SocialPost;
  theme: any;
}

export function PostCard({ post, theme }: PostCardProps) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);
    const newState = !liked;
    setLiked(newState);
    setLikeCount(prev => newState ? prev + 1 : prev - 1);

    try {
      if (newState) await socialApi.likePost(post.id);
      else await socialApi.unlikePost(post.id);
    } catch (err) {
      setLiked(!newState);
      setLikeCount(prev => !newState ? prev + 1 : prev - 1);
    } finally {
      setLoading(false);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <View>
            <Image 
              source={{ uri: post.authorProfilePicture || `https://ui-avatars.com/api/?name=${post.authorName}` }} 
              style={styles.avatar} 
            />
            <View style={styles.badgeContainer}>
              <CheckCircle size={12} color="#3b82f6" fill="#3b82f6" />
            </View>
          </View>
          <View>
            <Text style={[styles.authorName, { color: theme.colors.text }]}>{post.authorName}</Text>
            <Text style={[styles.timestamp, { color: theme.colors.subtext }]}>
              {new Date(post.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <TouchableOpacity>
          <MoreHorizontal size={20} color={theme.colors.subtext} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.contentText, { color: theme.colors.text }]}>{post.content}</Text>
      </View>

      {/* Media */}
      {post.mediaAssetIds && post.mediaAssetIds.length > 0 && (
        <Image 
          source={{ uri: `https://picsum.photos/seed/${post.id}/600/400` }} 
          style={styles.mediaImage}
        />
      )}

      {/* Metrics */}
      <View style={styles.metrics}>
        <View style={styles.likeMetrics}>
          <View style={styles.reactionIcons}>
            <View style={styles.iconCircle}>
              <ThumbsUp size={10} color="white" fill="white" />
            </View>
          </View>
          <Text style={[styles.metricText, { color: theme.colors.subtext }]}>{formatCount(likeCount)}</Text>
        </View>
        <View style={styles.otherMetrics}>
          <Text style={[styles.metricText, { color: theme.colors.subtext }]}>{formatCount(post.commentCount)} comments</Text>
          <Text style={[styles.metricText, { color: theme.colors.subtext }]}>•</Text>
          <Text style={[styles.metricText, { color: theme.colors.subtext }]}>{formatCount(post.shareCount)} shares</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={[styles.actions, { borderTopColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <ThumbsUp size={20} color={liked ? theme.colors.primary : theme.colors.subtext} fill={liked ? theme.colors.primary : "none"} />
          <Text style={[styles.actionText, { color: liked ? theme.colors.primary : theme.colors.subtext, fontWeight: liked ? 'bold' : '500' }]}>Like</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <MessageCircle size={20} color={theme.colors.subtext} />
          <Text style={[styles.actionText, { color: theme.colors.subtext }]}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Share2 size={20} color={theme.colors.subtext} />
          <Text style={[styles.actionText, { color: theme.colors.subtext }]}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  badgeContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 22,
  },
  mediaImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#eee',
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    alignItems: 'center',
  },
  likeMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reactionIcons: {
    flexDirection: 'row',
  },
  iconCircle: {
    backgroundColor: '#3b82f6',
    padding: 4,
    borderRadius: 10,
  },
  metricText: {
    fontSize: 13,
  },
  otherMetrics: {
    flexDirection: 'row',
    gap: 6,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  }
});
