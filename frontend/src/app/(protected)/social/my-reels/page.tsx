"use client";

import { useState, useEffect } from "react";
import { Typography, Button, LoadingState, ErrorState, EmptyState, cn } from "@/components/ui";
import { getUserReels, likeReel, unlikeReel, saveReel, addReelComment, shareReel } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useRouter } from "next/navigation";
import { Film, Play, Trash2, Heart, MessageCircle, Bookmark, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { ShareModal } from "@/components/social/ShareModal";

export default function SocialMyReelsPage() {
  const router = useRouter();
  const user = useSession((s) => s.user);
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeReel, setActiveReel] = useState(0);
  const [shareTarget, setShareTarget] = useState<any | null>(null);

  useEffect(() => {
    if (user?.id) fetchMyReels();
  }, [user?.id]);

  const fetchMyReels = async () => {
    try {
      setLoading(true);
      const data = await getUserReels(user!.id!);
      setReels(data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (reelId: string) => {
    try {
      const reel = reels.find((r) => r.id === reelId);
      if (reel?.isLiked) {
        await unlikeReel(reelId);
      } else {
        await likeReel(reelId);
      }
      fetchMyReels();
    } catch { toast.error("Failed to update like"); }
  };

  if (loading) return <LoadingState label="Loading your reels" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Film size={24} className="text-primary" />
          <Typography variant="h4" fontWeight={900} className="uppercase tracking-tight">
            My Reels
          </Typography>
        </div>
        <Button
          className="rounded-xl"
          onClick={() => router.push("/social/reels")}
        >
          Browse Reels
        </Button>
      </div>

      {reels.length === 0 ? (
        <EmptyState
          icon={<Film className="h-10 w-10" />}
          title="No reels yet"
          hint="Create your first reel to showcase your work!"
          action={{ label: "Create Reel", onClick: () => router.push("/social/reels") }}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {reels.map((reel: any) => (
            <div
              key={reel.id}
              className="aspect-[9/16] bg-black rounded-2xl overflow-hidden relative group cursor-pointer border border-slate-200 dark:border-white/10"
            >
              {reel.videoUrl && (
                <video
                  src={reel.videoUrl}
                  className="h-full w-full object-cover"
                  muted
                  loop
                  onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                  onMouseLeave={(e) => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }}
                />
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-4 left-4 right-4 space-y-3">
                  <Typography variant="caption" fontWeight={700} className="text-white line-clamp-2">
                    {reel.description || reel.title}
                  </Typography>
                  <div className="flex items-center gap-4 text-white/80 text-[12px] font-bold">
                    <span className="flex items-center gap-1"><Heart size={14} /> {reel.likeCount || 0}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={14} /> {reel.commentCount || 0}</span>
                    <span className="flex items-center gap-1"><Bookmark size={14} /> {reel.saveCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ShareModal
        open={!!shareTarget}
        onClose={() => setShareTarget(null)}
        url={shareTarget ? `${window.location.origin}/social/reels` : ""}
        title={shareTarget?.description || "Check out my reel!"}
        onShareInternal={() => { toast.success("Shared!"); setShareTarget(null); }}
      />
    </div>
  );
}
