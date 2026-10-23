"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ReelPlayer } from "./ReelPlayer";
import { Typography, Button, cn, EmptyState } from "@/components/ui";
import { getReelsFeed, getUserReels, likeReel, unlikeReel, saveReel, shareReel, followUser, unfollowUser } from "@/lib/api";
import { CreateReelModal } from "../CreateReelModal";
import { ShareModal } from "@/components/social/ShareModal";
import { Plus, ChevronUp, ChevronDown, Play, LayoutGrid, Film } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/session";

interface ReelsContainerProps {
  userId?: string;
}

export function ReelsContainer({ userId }: ReelsContainerProps) {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<any | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentUser = useSession((s) => s.user);

  // Intersection Observer for autoplay/pause
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    fetchReels();
  }, [userId]);

  const fetchReels = async () => {
    try {
      setLoading(true);
      const data = userId ? await getUserReels(userId) : await getReelsFeed();
      const items = Array.isArray(data) ? data : data?.items || [];
      setReels(items);
    } catch (err) {
      console.error("Failed to fetch reels:", err);
      setReels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (reelId: string) => {
     try {
       const reel = reels.find(r => r.id === reelId);
       if (!reel) return;
       
       const wasLiked = reel.isLiked;
       
       // Optimistic update
       setReels(prev => prev.map(r => 
         r.id === reelId 
           ? { ...r, isLiked: !wasLiked, likeCount: wasLiked ? r.likeCount - 1 : r.likeCount + 1 } 
           : r
       ));

       if (wasLiked) {
         await unlikeReel(reelId);
       } else {
         await likeReel(reelId);
       }
     } catch (err) {
       toast.error("Failed to update like");
     }
  };

  const handleSave = async (reelId: string) => {
    try {
      await saveReel(reelId);
      setReels(prev => prev.map(r => r.id === reelId ? { ...r, isSaved: true, saveCount: (r.saveCount || 0) + 1 } : r));
      toast.success("Reel saved!");
    } catch (err) {
      toast.error("Failed to save reel");
    }
  };

  const handleFollow = async (authorId: string) => {
    try {
      await followUser(authorId);
      toast.success("Followed!");
    } catch { toast.error("Failed to follow"); }
  };

  const handleShare = (reelId: string) => {
    const reel = reels.find(r => r.id === reelId);
    if (reel) {
      setShareTarget(reel);
    }
  };

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const index = Math.round(scrollTop / clientHeight);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  }, [activeIndex]);

  const scrollToNext = () => {
    if (containerRef.current && activeIndex < reels.length - 1) {
      containerRef.current.scrollTo({
        top: (activeIndex + 1) * containerRef.current.clientHeight,
        behavior: "smooth"
      });
    }
  };

  const scrollToPrev = () => {
    if (containerRef.current && activeIndex > 0) {
      containerRef.current.scrollTo({
        top: (activeIndex - 1) * containerRef.current.clientHeight,
        behavior: "smooth"
      });
    }
  };

  if (loading) return <div className="h-full w-full flex items-center justify-center bg-black text-white">Loading immersive experience...</div>;

  if (!loading && reels.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-inherit">
        <div className="text-center space-y-6">
          <EmptyState
            icon={<Film className="h-12 w-12 text-white/60" />}
            title="No reels yet"
            hint="Be the first to share a reel with the community!"
            action={{ label: "Create Reel", onClick: () => setIsCreateModalOpen(true) }}
          />
        </div>
        <CreateReelModal open={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); fetchReels(); }} />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-inherit text-white overflow-hidden justify-center relative">
      {/* Main Reels Area */}
      <div className="flex-1 flex items-center justify-center relative bg-inherit">
        {/* Create Reel FAB */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="absolute top-4 right-4 z-50 h-12 w-12 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 flex items-center justify-center shadow-lg shadow-purple-900/50 transition-all"
        >
          <Plus size={24} />
        </button>

        {/* Navigation Buttons (Desktop) */}
        <div className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-40 hidden lg:flex">
          <button 
            onClick={scrollToPrev}
            disabled={activeIndex === 0}
            className="h-12 w-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all disabled:opacity-20"
          >
            <ChevronUp size={24} />
          </button>
          <button 
            onClick={scrollToNext}
            disabled={activeIndex === reels.length - 1}
            className="h-12 w-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all disabled:opacity-20"
          >
            <ChevronDown size={24} />
          </button>
        </div>

        {/* Scrollable Feed */}
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full w-full max-w-[500px] aspect-[9/16] overflow-y-scroll snap-y snap-mandatory custom-scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {reels.map((reel, index) => (
            <div key={reel.id} className="h-full w-full snap-start snap-always py-4">
              <ReelPlayer 
                reel={reel} 
                isActive={index === activeIndex}
                onLike={handleLike}
                onComment={(id) => console.log("Comment", id)}
                onShare={handleShare}
                onSave={handleSave}
                onFollow={handleFollow}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Create Reel Modal */}
      <CreateReelModal open={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); fetchReels(); }} />

      <ShareModal
        open={!!shareTarget}
        onClose={() => setShareTarget(null)}
        url={shareTarget ? `${window.location.origin}/social/reels` : ""}
        title={shareTarget?.description || "Check out this reel!"}
        onShareInternal={() => {
          if (shareTarget) {
            shareReel(shareTarget.id).catch(() => {});
            toast.success("Shared!");
            setShareTarget(null);
          }
        }}
      />
    </div>
  );
}
