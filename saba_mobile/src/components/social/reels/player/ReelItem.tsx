import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, Animated } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Music, CheckCircle } from "lucide-react-native";
import { SocialPost } from "../../../api/social";

const { width, height } = Dimensions.get("window");

interface ReelItemProps {
  post: SocialPost;
  isActive: boolean;
  onLike: (id: string) => void;
}

export function ReelItem({ post, isActive, onLike }: ReelItemProps) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<any>({});
  const [liked, setLiked] = useState(post.isLiked);
  
  useEffect(() => {
    if (isActive) {
      videoRef.current?.playAsync();
    } else {
      videoRef.current?.pauseAsync();
    }
  }, [isActive]);

  const handleLike = () => {
    setLiked(!liked);
    onLike(post.id);
  };

  return (
    <View style={styles.container}>
      {/* Video Content */}
      <Video
        ref={videoRef}
        style={styles.video}
        source={{ uri: post.videoUrl || `https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-in-office-22709-large.mp4` }}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay={isActive}
        onPlaybackStatusUpdate={status => setStatus(() => status)}
      />

      {/* Overlays */}
      <View style={styles.overlay}>
        {/* Interaction Sidebar (Right) */}
        <View style={styles.sidebar}>
          <TouchableOpacity style={styles.sidebarItem} onPress={handleLike}>
            <View style={styles.iconCircle}>
               <Heart 
                 color={liked ? "#ff4b4b" : "white"} 
                 fill={liked ? "#ff4b4b" : "transparent"} 
                 size={32} 
               />
            </View>
            <Text style={styles.sidebarText}>{formatCount(post.likeCount)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarItem}>
            <View style={styles.iconCircle}>
               <MessageCircle color="white" size={32} />
            </View>
            <Text style={styles.sidebarText}>{formatCount(post.commentCount)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarItem}>
            <View style={styles.iconCircle}>
               <Share2 color="white" size={32} />
            </View>
            <Text style={styles.sidebarText}>{formatCount(post.shareCount)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarItem}>
            <View style={styles.iconCircle}>
               <Bookmark color="white" size={32} />
            </View>
            <Text style={styles.sidebarText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarItem}>
            <MoreHorizontal color="white" size={28} />
          </TouchableOpacity>
        </View>

        {/* Bottom Content Area */}
        <View style={styles.bottomContent}>
          <View style={styles.userInfo}>
            <Image 
              source={{ uri: post.authorProfilePicture || `https://ui-avatars.com/api/?name=${post.authorName}` }} 
              style={styles.avatar} 
            />
            <View style={styles.userText}>
              <View style={styles.nameRow}>
                <Text style={styles.username}>{post.authorName}</Text>
                <CheckCircle color="#3b82f6" size={14} fill="#3b82f6" />
                <Text style={styles.dot}>•</Text>
                <TouchableOpacity>
                  <Text style={styles.followText}>Follow</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {post.content}
          </Text>

          {/* Audio Track */}
          <View style={styles.audioContainer}>
            <Music color="white" size={14} />
            <Text style={styles.audioText} numberOfLines={1}>
              Original Audio • {post.authorName}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${(status.positionMillis / status.durationMillis) * 100}%` }]} />
      </View>
    </View>
  );
}

function formatCount(count: number) {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
}

const styles = StyleSheet.create({
  container: {
    width: width,
    height: height,
    backgroundColor: 'black',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 60,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  sidebar: {
    position: 'absolute',
    right: 12,
    bottom: 140,
    alignItems: 'center',
    gap: 20,
  },
  sidebarItem: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  sidebarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bottomContent: {
    maxWidth: width * 0.8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'white',
    marginRight: 12,
  },
  userText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  dot: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  followText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  description: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 8,
  },
  audioText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 150,
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
  }
});
