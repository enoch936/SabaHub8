"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, Button, Typography, cn } from "@/components/ui";
import { 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  MoreHorizontal, 
  Volume2, 
  VolumeX, 
  CheckCircle2,
  Music
} from "lucide-react";
import { useSession } from "@/lib/session";
import { toast } from "sonner";

interface Reel {
  id: string;
  authorId: string;
  authorName: string;
  authorProfilePicture?: string;
  title?: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  audioTitle: string;
  audioArtist: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  saveCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

interface ReelPlayerProps {
  reel: Reel;
  isActive: boolean;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
  onShare: (id: string) => void;
  onSave: (id: string) => void;
}

export function ReelPlayer({ reel, isActive, onLike, onComment, onShare, onSave }: ReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Handle autoplay block
        setPlaying(false);
      });
      setPlaying(true);
    } else if (videoRef.current) {
      videoRef.current.pause();
      setPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  return (
    <div className="relative h-full w-full bg-black group overflow-hidden md:rounded-2xl border border-white/5">
      {/* Video Element */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        poster={reel.thumbnailUrl}
        loop
        muted={muted}
        playsInline
        className="h-full w-full object-cover cursor-pointer"
        onClick={togglePlay}
      />

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

      {/* Mute Toggle */}
      <button 
        onClick={() => setMuted(!muted)}
        className="absolute top-6 left-6 z-20 h-10 w-10 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-full transition-all border border-white/10 backdrop-blur-md"
      >
        {muted ? <VolumeX size={20} className="text-white" /> : <Volume2 size={20} className="text-white" />}
      </button>

      {/* Interaction Bar (Right) */}
      <div className="absolute right-4 bottom-28 md:bottom-32 flex flex-col gap-6 md:gap-8 items-center z-30">
        <EngagementAction 
          icon={<ThumbsUp className={cn("h-6 w-6 md:h-7 md:w-7", reel.isLiked && "fill-primary text-primary")} />} 
          label={formatCount(reel.likeCount)}
          onClick={() => onLike(reel.id)}
        />
        <EngagementAction 
          icon={<MessageSquare className="h-6 w-6 md:h-7 md:w-7" />} 
          label={formatCount(reel.commentCount)}
          onClick={() => onComment(reel.id)}
        />
        <EngagementAction 
          icon={<Share2 className="h-6 w-6 md:h-7 md:w-7" />} 
          label={formatCount(reel.shareCount)}
          onClick={() => onShare(reel.id)}
        />
        <EngagementAction 
          icon={<Bookmark className={cn("h-6 w-6 md:h-7 md:w-7", reel.isSaved && "fill-yellow-500 text-yellow-500")} />} 
          label={formatCount(reel.saveCount)}
          onClick={() => onSave(reel.id)}
        />
        <button className="text-white/70 hover:text-white transition-colors">
          <MoreHorizontal size={24} />
        </button>
      </div>

      {/* Bottom Content Area */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <Avatar 
              src={reel.authorProfilePicture} 
              alt={reel.authorName}
              className="h-11 w-11 border-2 border-white shadow-xl"
            />
            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5 border border-black text-white">
              <CheckCircle2 size={10} fill="currentColor" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Typography variant="subtitle2" fontWeight={800} className="text-white shadow-sm tracking-wide">
                {reel.authorName}
              </Typography>
              <CheckCircle2 size={14} fill="currentColor" className="text-blue-400" />
              <span className="text-white/60 text-xs">•</span>
              <button className="text-white font-bold text-[14px] hover:text-primary transition-colors">Follow</button>
            </div>
          </div>
        </div>

        {reel.description && (
          <p className="text-[14px] leading-snug text-white/95 line-clamp-2 mb-4 font-medium max-w-[85%] drop-shadow-md">
            {reel.description}
          </p>
        )}

        {/* Audio Track */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md w-fit px-3 py-1.5 rounded-full border border-white/10 shadow-lg group/audio cursor-pointer hover:bg-white/20 transition-all">
          <div className="animate-spin-slow">
            <Music size={14} className="text-white" />
          </div>
          <div className="overflow-hidden w-40">
            <div className="whitespace-nowrap animate-marquee text-[12px] font-bold tracking-tight text-white/90">
              {reel.audioTitle} • {reel.audioArtist}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
        <div 
          className="h-full bg-primary transition-all duration-100 ease-linear rounded-r-full shadow-[0_0_10px_var(--primary)]" 
          style={{ width: isActive ? '100%' : '0%', transitionDuration: isActive ? '30s' : '0s' }} 
        />
      </div>
    </div>
  );
}

function EngagementAction({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <div className="flex flex-col items-center gap-1.5 group cursor-pointer" onClick={onClick}>
      <div className="h-12 w-12 md:h-14 md:w-14 flex items-center justify-center rounded-full bg-black/40 group-hover:bg-black/60 transition-all border border-white/10 shadow-lg backdrop-blur-md">
        {icon}
      </div>
      <span className="text-[11px] md:text-[13px] font-extrabold text-white shadow-sm tracking-tight">{label}</span>
    </div>
  );
}

function formatCount(count: number) {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
}
