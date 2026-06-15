"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getPublicProfile, followUser, unfollowUser } from "@/lib/api";
import { 
  Typography, 
  Avatar, 
  Button, 
  Tabs, 
  Card, 
  cn,
  Skeleton
} from "@/components/ui";
import { 
  Grid3X3, 
  Film, 
  Bookmark, 
  Heart, 
  MapPin, 
  Link as LinkIcon, 
  Calendar,
  CheckCircle2
} from "lucide-react";
import { Feed } from "@/components/social/Feed";
import { ReelsView } from "@/components/social/reels/ReelsView";
import { StoryViewer } from "@/components/social/standalone/StoryViewer";
import { toast } from "sonner";
import { useSession } from "@/lib/session";

export default function SocialProfilePage() {
  const { id } = useParams();
  const currentUser = useSession((s) => s.user);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [storyOpen, setStoryOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getPublicProfile(id as string);
      setProfile(data);
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile || followLoading) return;
    setFollowLoading(true);
    try {
      if (profile.isFollowing) {
        await unfollowUser(profile.userId || id as string);
        toast.success(`Unfollowed ${profile.fullName || profile.username}`);
        setProfile((prev: any) => ({
          ...prev,
          isFollowing: false,
          stats: {
            ...prev.stats,
            followerCount: Math.max(0, (prev.stats?.followerCount || 0) - 1)
          }
        }));
      } else {
        await followUser(profile.userId || id as string);
        toast.success(`Following ${profile.fullName || profile.username}`);
        setProfile((prev: any) => ({
          ...prev,
          isFollowing: true,
          stats: {
            ...prev.stats,
            followerCount: (prev.stats?.followerCount || 0) + 1
          }
        }));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8">
       <Skeleton className="h-48 w-full rounded-3xl" />
       <div className="flex gap-6 items-end -mt-12 px-10">
          <Skeleton className="h-32 w-32 rounded-full border-4 border-white" />
          <div className="flex-1 pb-2">
             <Skeleton className="h-8 w-48 mb-2" />
             <Skeleton className="h-4 w-32" />
          </div>
       </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Cover Image */}
      <div className="h-64 w-full bg-black/5 dark:bg-white/5 relative overflow-hidden md:rounded-b-[40px] border-b border-white/10">
         <img 
           src={`https://picsum.photos/seed/${profile?.userId}/1200/400`} 
           className="h-full w-full object-cover opacity-90"
         />
      </div>

      {/* Profile Header */}
      <div className="px-6 md:px-12 flex flex-col md:flex-row gap-8 items-start md:items-end -mt-16 relative z-10">
         <div className="relative">
            <div 
              onClick={() => profile?.hasActiveStories && setStoryOpen(true)}
              className={cn(
                "rounded-full p-1.5 transition-all duration-500",
                profile?.hasActiveStories ? "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 cursor-pointer hover:scale-105" : "bg-transparent"
              )}
            >
               <div className="bg-white dark:bg-black rounded-full p-1">
                  <Avatar 
                    src={profile?.profilePictureUrl} 
                    alt={profile?.username}
                    className="h-32 w-32 md:h-40 md:w-40 border-4 border-white dark:border-black shadow-2xl"
                  />
               </div>
            </div>
            <div className="absolute bottom-4 right-4 bg-primary rounded-full p-1 border-4 border-white dark:border-black shadow-lg">
               <CheckCircle2 size={24} fill="currentColor" className="text-white" />
            </div>
         </div>

         <div className="flex-1 flex flex-col gap-2 pb-2">
            <div className="flex items-center gap-4 flex-wrap">
               <Typography variant="h4" fontWeight={900} className="tracking-tighter leading-none uppercase dark:text-white">{profile?.fullName || profile?.username}</Typography>
               <div className="flex gap-2">
                  {currentUser?.id !== (profile?.userId || id) && (
                    <Button 
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      variant={profile?.isFollowing ? "outline" : "default"}
                      className={cn(
                        "rounded-xl shadow-lg px-8 font-black uppercase tracking-widest text-[11px]",
                        profile?.isFollowing ? "border-primary text-primary" : "shadow-primary/20"
                      )}
                    >
                      {followLoading ? "Updating..." : profile?.isFollowing ? "Unfollow" : "Follow"}
                    </Button>
                  )}
                  <Button variant="outline" className="rounded-xl px-8 border-slate-200 dark:border-white/10 font-black uppercase tracking-widest text-[11px] bg-transparent hover:bg-primary/5">Message</Button>
               </div>
            </div>
            
            <div className="flex items-center gap-6 mt-4">
               <Stat label="Followers" value={formatCount(profile?.stats?.followerCount ?? 0)} />
               <Stat label="Following" value={formatCount(profile?.stats?.followingCount ?? 0)} />
               <Stat label="Likes" value={formatCount(profile?.stats?.totalLikes ?? 0)} />
            </div>
         </div>
      </div>

      {/* Bio & Details */}
      <div className="px-6 md:px-12 mt-10 max-w-3xl">
         <Typography variant="body1" className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed text-[16px]">
            {profile?.bio || "No bio yet. Professional sharing their journey on SabaSocial."}
         </Typography>

         <div className="flex flex-wrap gap-x-8 gap-y-3 mt-8">
            {profile?.location && (
               <div className="flex items-center gap-2.5 text-slate-400">
                  <MapPin size={18} className="text-primary" />
                  <span className="text-[13px] font-black uppercase tracking-widest">{profile.location}</span>
               </div>
            )}
            <div className="flex items-center gap-2.5 text-slate-400">
               <Calendar size={18} className="text-primary" />
               <span className="text-[13px] font-black uppercase tracking-widest">Joined June 2026</span>
            </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="mt-16 border-t border-slate-100 dark:border-white/10 bg-inherit sticky top-0 z-20">
         <div className="flex justify-center gap-16 -mt-[1px] bg-inherit">
            <TabItem icon={<Grid3X3 size={20} />} label="POSTS" active={activeTab === "posts"} onClick={() => setActiveTab("posts")} />
            <TabItem icon={<Film size={20} />} label="REELS" active={activeTab === "reels"} onClick={() => setActiveTab("reels")} />
            <TabItem icon={<Bookmark size={20} />} label="SAVED" active={activeTab === "saved"} onClick={() => setActiveTab("saved")} />
            <TabItem icon={<Heart size={20} />} label="LIKED" active={activeTab === "liked"} onClick={() => setActiveTab("liked")} />
         </div>
      </div>

      {/* Content Area */}
      <div className="mt-8 px-4 max-w-3xl mx-auto">
         {activeTab === "posts" && <Feed mode="user" userId={id as string} />}
         {activeTab === "reels" && <ReelsView userId={id as string} />}
         {activeTab === "saved" && <Feed mode="user" userId={id as string} filter="saved" />}
         {activeTab === "liked" && <Feed mode="user" userId={id as string} filter="liked" />}
      </div>

      <StoryViewer 
        open={storyOpen}
        onClose={() => setStoryOpen(false)}
        userId={profile?.userId || id as string}
        userName={profile?.fullName || profile?.username}
        userAvatar={profile?.profilePictureUrl}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center gap-2">
       <span className="font-black text-lg tracking-tighter uppercase">{value}</span>
       <span className="text-slate-400 font-bold text-[11px] tracking-widest uppercase">{label}</span>
    </div>
  );
}

function TabItem({ icon, label, active, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 py-4 cursor-pointer border-t-2 transition-all group",
        active ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"
      )}
    >
       <div className={cn("transition-transform", active ? "scale-110" : "group-hover:scale-105")}>{icon}</div>
       <span className="text-[12px] font-black tracking-widest uppercase">{label}</span>
    </div>
  );
}

function formatCount(count: number) {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
}
