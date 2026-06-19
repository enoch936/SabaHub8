"use client";

import { useEffect, useState } from "react";
import { PostCard, type SocialPost } from "./PostCard";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { getSocialFeed, getGlobalFeed, getUserPosts, getLikedPosts, getSavedPosts, bootstrapWorkspaceDemoData, sharePost } from "@/lib/api";
import { ShareModal } from "@/components/social/ShareModal";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

interface FeedProps {
  mode?: "personal" | "global" | "user";
  userId?: string;
  filter?: "all" | "liked" | "saved";
}

export function Feed({ mode = "personal", userId, filter = "all" }: FeedProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<SocialPost | null>(null);

  useEffect(() => {
    fetchPosts();

    const handleRefresh = () => {
      fetchPosts();
    };

    window.addEventListener("social-post-created", handleRefresh);
    return () => window.removeEventListener("social-post-created", handleRefresh);
  }, [mode, userId, filter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let data;
      if (mode === "global") {
        data = await getGlobalFeed();
      } else if (mode === "user" && userId) {
        if (filter === "liked") {
          data = await getLikedPosts(userId);
        } else if (filter === "saved") {
          data = await getSavedPosts(userId);
        } else {
          data = await getUserPosts(userId);
        }
      } else {
        data = await getSocialFeed();
      }
      setPosts(data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBootstrap = async () => {
    try {
      setLoading(true);
      await bootstrapWorkspaceDemoData();
      toast.success("Network content generated!");
      fetchPosts();
    } catch (err: any) {
      toast.error(err.message || "Failed to bootstrap network");
      setLoading(false);
    }
  };

  if (loading) return <LoadingState label={`Loading ${mode} feed`} />;
  if (error) return <ErrorState message={error} />;
  
  if (posts.length === 0) {
    let emptyHint = mode === "global" 
      ? "Be the first to share a professional moment with the world!" 
      : mode === "user" 
        ? (filter === "liked" ? "This user hasn't liked any posts yet." : filter === "saved" ? "This user hasn't saved any posts yet." : "This user hasn't posted anything yet.")
        : "Follow some users to see their posts here, or check out the global feed!";

    return (
      <EmptyState 
        icon={<Sparkles className="h-10 w-10" />}
        title={mode === "global" ? "The universe is quiet" : "Nothing to see here"} 
        hint={emptyHint} 
        action={mode !== "user" ? {
          label: "Generate Network Content",
          onClick: handleBootstrap
        } : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-2 pb-10">
      {posts.map((post, index) => (
        <div 
          key={post.id} 
          className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <PostCard post={post} onShare={(id) => setShareTarget(posts.find(p => p.id === id) || null)} />
        </div>
      ))}

      <ShareModal
        open={!!shareTarget}
        onClose={() => setShareTarget(null)}
        url={shareTarget ? `${window.location.origin}/social/feed` : ""}
        title={shareTarget?.content || "Check out this post!"}
        onShareInternal={() => {
          if (shareTarget) {
            sharePost(shareTarget.id).catch(() => {});
            toast.success("Shared!");
            setShareTarget(null);
          }
        }}
      />
    </div>
  );
}
