import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from "react-native";
import { Search, MessageSquare, Play, LayoutGrid } from "lucide-react-native";
import { useAppTheme } from "../../hooks/useAppTheme";
import { PostCard } from "../../components/social/PostCard";
import { ReelsView } from "../../components/social/reels/ReelsView";
import { socialApi, SocialPost } from "../../api/social";

export function SocialFeedScreen() {
  const [viewMode, setViewMode] = useState<"feed" | "reels">("reels");
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useAppTheme();

  useEffect(() => {
    if (viewMode === "feed") {
      fetchFeed();
    }
  }, [viewMode]);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const response = await socialApi.getGlobalFeed();
      setPosts(response.data.items || []);
    } catch (err) {
      console.error("Failed to fetch feed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: viewMode === 'reels' ? '#000' : theme.colors.background }]}>
      {/* Dynamic Header */}
      <View style={[styles.header, viewMode === 'reels' && styles.reelsHeader]}>
        <Text style={[styles.title, { color: viewMode === 'reels' ? '#fff' : theme.colors.text }]}>
          Social {viewMode === 'reels' ? 'Reels' : 'Feed'}
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Search color={viewMode === 'reels' ? '#fff' : theme.colors.text} size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <MessageSquare color={viewMode === 'reels' ? '#fff' : theme.colors.text} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* View Toggle */}
      <View style={styles.toggleContainer}>
        <View style={[styles.toggleBackground, { backgroundColor: viewMode === 'reels' ? 'rgba(255,255,255,0.1)' : theme.colors.border }]}>
          <TouchableOpacity 
            onPress={() => setViewMode("reels")}
            style={[styles.toggleButton, viewMode === "reels" && styles.toggleActive]}
          >
            <Play size={16} color={viewMode === "reels" ? "#fff" : theme.colors.subtext} fill={viewMode === "reels" ? "#fff" : "transparent"} />
            <Text style={[styles.toggleText, { color: viewMode === "reels" ? "#fff" : theme.colors.subtext }]}>Reels</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setViewMode("feed")}
            style={[styles.toggleButton, viewMode === "feed" && styles.toggleActive]}
          >
            <LayoutGrid size={16} color={viewMode === "feed" ? "#fff" : theme.colors.subtext} />
            <Text style={[styles.toggleText, { color: viewMode === "feed" ? "#fff" : theme.colors.subtext }]}>Feed</Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === "reels" ? (
        <ReelsView />
      ) : (
        <View style={styles.container}>
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={posts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <PostCard post={item} theme={theme} />}
              contentContainerStyle={styles.feedList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  reelsHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
  },
  toggleContainer: {
    alignItems: 'center',
    marginVertical: 10,
    zIndex: 11,
  },
  toggleBackground: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 2,
    width: 180,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 18,
    gap: 6,
  },
  toggleActive: {
    backgroundColor: '#3b82f6',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  feedList: {
    paddingTop: 8,
    paddingBottom: 20,
  }
});
