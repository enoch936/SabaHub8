"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ReelPlayer } from "./ReelPlayer";
import { Typography, Button, cn } from "@/components/ui";
import { getReelsFeed, getUserReels, likeReel, unlikeReel, saveReel } from "@/lib/api";
import { CreateReelModal } from "../CreateReelModal";
import { Plus, ChevronUp, ChevronDown, Play, LayoutGrid } from "lucide-react";
import { toast } from "sonner";

interface ReelsContainerProps {
  userId?: string;
}

export function ReelsContainer({ userId }: ReelsContainerProps) {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for autoplay/pause
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    fetchReels();
  }, [userId]);

  const fetchReels = async () => {
    try {
      setLoading(true);
      const data = userId ? await getUserReels(userId) : await getReelsFeed();
      const items = data.content || data.items || [];
      
      if (items.length === 0 && !userId) {
        setReels(MOCK_REELS);
      } else {
        setReels(items);
      }
    } catch (err) {
      console.error("Failed to fetch reels:", err);
      if (!userId) {
        setReels(MOCK_REELS);
      } else {
        setReels([]);
      }
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

  return (
    <div className="flex h-full bg-inherit text-white overflow-hidden justify-center relative">
      {/* Main Reels Area */}
      <div className="flex-1 flex items-center justify-center relative bg-inherit">
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
                onShare={(id) => console.log("Share", id)}
                onSave={handleSave}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all font-bold",
      active ? "bg-primary/10 text-primary border border-primary/20" : "text-white/60 hover:bg-white/5"
    )}>
      {icon}
      <Typography variant="body1" fontWeight={700}>{label}</Typography>
    </div>
  );
}

const MOCK_REELS = [
  {
    id: "1",
    authorId: "user1",
    authorName: "Alex Rivera",
    authorProfilePicture: "https://i.pravatar.cc/150?u=1",
    description: "Building the future of decentralized professional networking with #SabaHub 🚀 #Web3 #Development",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-in-office-22709-large.mp4",
    audioTitle: "Innovation Vibes",
    audioArtist: "Deep House Collective",
    likeCount: 12500,
    commentCount: 450,
    shareCount: 890,
    saveCount: 3400,
    isLiked: true
  },
  {
    id: "2",
    authorId: "user2",
    authorName: "Sarah Chen",
    authorProfilePicture: "https://i.pravatar.cc/150?u=2",
    description: "Morning routine for high-performance designers. Stay inspired! ✨ #DesignLife #Creativity",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-woman-working-at-laptop-in-creative-office-40011-large.mp4",
    audioTitle: "Morning Sunshine",
    audioArtist: "Lofi Beats",
    likeCount: 8900,
    commentCount: 230,
    shareCount: 450,
    saveCount: 1200
  }
];
