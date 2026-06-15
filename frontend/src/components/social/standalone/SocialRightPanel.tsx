"use client";

import { Typography, Avatar, Button, cn } from "@/components/ui";
import { TrendingUp, UserPlus, Play, Hash, Zap, ArrowUpRight } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { listMarketplaceFreelancers, getDiscoveryFeed, type MarketplaceFreelancer, type DiscoveryFeedItem, followUser, getReelsFeed } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";

export function SocialRightPanel() {
  const theme = useTheme();
  const router = useRouter();
  const user = useSession((s) => s.user);
  const isDark = theme.palette.mode === "dark";
  const [suggestedExperts, setSuggestedExperts] = useState<MarketplaceFreelancer[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<DiscoveryFeedItem[]>([]);
  const [trendingReels, setTrendingReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [expertsData, discoveryData, reelsData] = await Promise.all([
          listMarketplaceFreelancers({ page: 0, size: 10 }), // Fetch more to allow filtering
          getDiscoveryFeed("All", 6),
          getReelsFeed(0, 4)
        ]);
        
        // Filter out current user
        const experts = (expertsData.items || []).filter(e => e.userId !== user?.id);
        setSuggestedExperts(experts.slice(0, 5));
        
        setTrendingTopics(discoveryData.filter(item => item.type === "Post" || item.type === "Opportunity"));
        setTrendingReels(reelsData.content || reelsData.items || []);
      } catch (err) {
        console.error("Failed to fetch right panel data:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const handleFollow = async (userId: string) => {
    try {
      await followUser(userId);
      toast.success("Following expert!");
      setSuggestedExperts(prev => prev.filter(e => e.userId !== userId));
    } catch (err) {
      toast.error("Failed to follow user");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={cn(
        "w-[380px] h-screen p-6 hidden xl:flex flex-col gap-8 sticky top-0 transition-colors duration-300 overflow-y-auto custom-scrollbar-none",
        isDark ? "bg-black border-l border-white/5" : "bg-white border-l border-slate-100"
      )}
    >
      {/* Trending Reels */}
      {(!loading && trendingReels.length > 0) && (
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-5">
             <div className="flex items-center gap-2">
               <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Zap size={18} className="text-orange-500" />
               </div>
               <Typography variant="subtitle1" fontWeight={900} className="tracking-tight dark:text-white">Trending Reels</Typography>
             </div>
             <Button variant="text" size="sm" className="text-primary font-bold hover:bg-primary/5" onClick={() => router.push('/social/reels')}>Explore</Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
             {trendingReels.map((reel) => (
               <motion.div 
                 whileHover={{ scale: 1.02 }}
                 key={reel.id} 
                 onClick={() => router.push('/social/reels')}
                 className={cn(
                   "aspect-[9/16] rounded-2xl overflow-hidden relative group cursor-pointer border transition-all",
                   isDark ? "bg-transparent border-white/10" : "bg-transparent border-slate-100"
                 )}
               >
                  <img src={reel.thumbnailUrl || `https://picsum.photos/seed/${reel.id}/200/350`} className="h-full w-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                     <div className="h-5 w-5 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <Play size={10} fill="white" className="text-white" />
                     </div>
                     <span className="text-[10px] font-black text-white tracking-widest uppercase">{formatCount(reel.likeCount || 0)}</span>
                  </div>
               </motion.div>
             ))}
          </div>
        </motion.section>
      )}

      {/* Suggested Experts */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-5">
           <div className="flex items-center gap-2">
             <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserPlus size={18} className="text-primary" />
             </div>
             <Typography variant="subtitle1" fontWeight={900} className="tracking-tight dark:text-white">Suggested Experts</Typography>
           </div>
           <Button variant="text" size="sm" className="text-primary font-bold hover:bg-primary/5">View all</Button>
        </div>
        <div className="space-y-4">
           {loading ? [1, 2, 3].map(i => (
             <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-white/10" />
                <div className="flex-1 space-y-2">
                   <div className="h-3 w-24 bg-slate-200 dark:bg-white/10 rounded" />
                   <div className="h-2 w-16 bg-slate-200 dark:bg-white/10 rounded" />
                </div>
             </div>
           )) : suggestedExperts.map((expert) => (
             <div key={expert.id} className="flex items-center justify-between group">
                <div 
                  onClick={() => router.push(`/social/profile/${expert.userId || expert.id}`)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                   <div className="relative">
                      <Avatar src={expert.profileImageUrl || `https://i.pravatar.cc/150?u=${expert.id}`} size="md" className="ring-2 ring-primary/5 group-hover:ring-primary/20 transition-all" />
                      {expert.verified && (
                        <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-blue-500 rounded-full border-2 border-white dark:border-black flex items-center justify-center">
                           <Zap size={6} className="text-white" fill="white" />
                        </div>
                      )}
                   </div>
                   <div className="max-w-[140px]">
                      <Typography variant="subtitle2" fontWeight={900} className="leading-tight dark:text-white truncate">{expert.name}</Typography>
                      <Typography variant="caption" className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider truncate">{expert.title || "Professional"}</Typography>
                   </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    expert.userId && handleFollow(expert.userId);
                  }}
                  className="rounded-xl h-8 px-4 font-black text-[11px] shadow-lg shadow-primary/10 uppercase tracking-tight"
                >
                  Follow
                </Button>
             </div>
           ))}
        </div>
      </motion.section>

      {/* Trending Topics */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center gap-2 mb-5">
           <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Hash size={18} className="text-green-500" />
           </div>
           <Typography variant="subtitle1" fontWeight={900} className="tracking-tight dark:text-white">Trending Topics</Typography>
        </div>
        <div className="flex flex-wrap gap-2">
           {loading ? [1, 2, 3, 4].map(i => (
             <div key={i} className="h-8 w-20 bg-slate-200 dark:bg-white/10 rounded-xl animate-pulse" />
           )) : (trendingTopics.length > 0 ? trendingTopics : [
             { id: '1', title: 'WebDesign' },
             { id: '2', title: 'AIRevolution' },
             { id: '3', title: 'RemoteWork' },
             { id: '4', title: 'CreativeTech' }
           ]).map((item: any) => (
             <div 
               key={item.id} 
               className={cn(
                 "px-4 py-2 rounded-xl border group cursor-pointer transition-all flex items-center gap-2",
                 isDark 
                   ? "bg-transparent border-white/10 hover:border-primary/50" 
                   : "bg-transparent border-slate-100 hover:border-primary/30"
               )}
             >
                <span className={cn(
                  "text-[12px] font-bold transition-colors",
                  isDark ? "text-slate-400 group-hover:text-white" : "text-slate-600 group-hover:text-black"
                )}>#{item.title || item.name || 'Trend'}</span>
                <ArrowUpRight size={12} className="text-primary opacity-0 group-hover:opacity-100 transition-all" />
             </div>
           ))}
        </div>
      </motion.section>

      {/* Minimal Footer */}
      <footer className="mt-auto pt-6 border-t border-slate-100 dark:border-white/5 opacity-40">
         <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
            {["About", "Privacy", "Terms", "Expert Program"].map((f) => (
              <span key={f} className="text-[10px] font-black text-slate-500 hover:text-primary cursor-pointer transition-colors uppercase tracking-widest">{f}</span>
            ))}
         </div>
         <Typography variant="caption" className="text-slate-500 font-black tracking-[0.2em] uppercase text-[9px]">SabaHub Social © 2026</Typography>
      </footer>
    </motion.div>
  );
}

function formatCount(count: number) {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
}
