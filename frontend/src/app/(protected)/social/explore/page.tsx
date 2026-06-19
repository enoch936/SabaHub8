"use client";

import { useState, useEffect } from "react";
import { Typography, LoadingState, ErrorState, cn } from "@/components/ui";
import { getTrendingPosts, getReelsFeed, getDiscoveryFeed } from "@/lib/api";
import { PostCard, type SocialPost } from "@/components/social/PostCard";
import { Search, TrendingUp, Flame, Play, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SocialExplorePage() {
  const router = useRouter();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadExplore();
  }, []);

  const loadExplore = async () => {
    try {
      setLoading(true);
      const [postsData, reelsData] = await Promise.allSettled([
        getTrendingPosts(0, 10),
        getReelsFeed(0, 5),
      ]);

      if (postsData.status === "fulfilled") {
        setPosts(postsData.value.items || []);
      }

      if (reelsData.status === "fulfilled") {
        setReels(reelsData.value.items || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState label="Loading explore" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-12">
      {/* Search */}
      <div className="relative max-w-xl mx-auto">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search trends, topics, creators..."
          className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl py-4 pl-12 pr-6 text-[15px] font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
        />
      </div>

      {/* Trending Posts */}
      {posts.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-8">
            <Flame size={24} className="text-primary" />
            <Typography variant="h5" fontWeight={900} className="uppercase tracking-tight">Trending Now</Typography>
          </div>
          <div className="space-y-4">
            {posts.slice(0, 5).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Trending Reels */}
      {reels.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Play size={24} className="text-primary" />
              <Typography variant="h5" fontWeight={900} className="uppercase tracking-tight">Trending Reels</Typography>
            </div>
            <button
              onClick={() => router.push("/social/reels")}
              className="flex items-center gap-1 text-primary text-[13px] font-bold hover:underline"
            >
              View All <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {reels.slice(0, 5).map((reel: any) => (
              <div
                key={reel.id}
                onClick={() => router.push("/social/reels")}
                className="aspect-[9/16] bg-black/10 dark:bg-white/5 rounded-2xl overflow-hidden cursor-pointer relative group border border-slate-200 dark:border-white/10"
              >
                {reel.thumbnailUrl && (
                  <img src={reel.thumbnailUrl} className="h-full w-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                  <Typography variant="caption" fontWeight={700} className="text-white truncate">
                    {reel.title || reel.description}
                  </Typography>
                  <Typography variant="caption" className="text-white/60 text-[10px]">
                    {reel.authorName}
                  </Typography>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Latest Posts */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp size={24} className="text-primary" />
          <Typography variant="h5" fontWeight={900} className="uppercase tracking-tight">Latest Posts</Typography>
        </div>
        <div className="space-y-4">
          {posts.slice(0, 5).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
