"use client";

import { Avatar, Typography, cn } from "@/components/ui";
import { Plus } from "lucide-react";
import { useSession } from "@/lib/session";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getActiveStories } from "@/lib/api";
import { CreatePostModal } from "../CreatePostModal";
import { StoryViewer } from "./StoryViewer";
import { useRouter } from "next/navigation";

export function Stories() {
  const user = useSession((s) => s.user);
  const router = useRouter();
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; avatar?: string } | null>(null);

  const [hasOwnStory, setHasOwnStory] = useState(false);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        const data = await getActiveStories();
        // Check if current user has an active story
        const ownStoryExists = data.some((u: any) => u.id === user?.id);
        setHasOwnStory(ownStoryExists);
        
        // Filter out current user from the main list of other stories
        setStories(data.filter((u: any) => u.id !== user?.id));
      } catch (err) {
        console.error("Failed to fetch stories:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();

    const handleRefresh = () => fetchStories();
    window.addEventListener("social-post-created", handleRefresh);
    return () => window.removeEventListener("social-post-created", handleRefresh);
  }, [user?.id]);

  return (
    <div className="w-full overflow-hidden mb-2">
      <div className="flex gap-6 overflow-x-auto py-4 custom-scrollbar-none px-2 items-center">
        {/* Your Story */}
        <div 
          className="flex flex-col items-center gap-2 group cursor-pointer shrink-0"
        >
          <div className="relative">
            <div 
              onClick={() => {
                if (hasOwnStory) {
                  setSelectedUser({ id: user?.id || "", name: "Your Story", avatar: user?.profilePictureUrl });
                } else {
                  setIsCreateModalOpen(true);
                }
              }}
              className={cn(
                "p-[3px] rounded-full transition-all duration-300",
                hasOwnStory && "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 animate-spin-slow"
              )}
            >
              <div className="bg-white dark:bg-black p-[2px] rounded-full">
                <Avatar 
                  src={user?.profilePictureUrl || undefined} 
                  alt="Your Story" 
                  size="lg" 
                  className={cn(
                    "h-[64px] w-[64px] transition-all duration-300",
                    !hasOwnStory && "border-2 border-primary/20 group-hover:border-primary"
                  )} 
                />
              </div>
            </div>
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setIsCreateModalOpen(true);
              }}
              className="absolute bottom-0 right-0 h-6 w-6 bg-primary rounded-full border-4 border-white dark:border-black flex items-center justify-center hover:scale-110 transition-transform"
            >
               <Plus size={14} className="text-white" strokeWidth={3} />
            </div>
          </div>
          <Typography variant="caption" className="font-bold text-slate-500 dark:text-slate-400 text-[11px]">Your Story</Typography>
        </div>

        {/* Other Stories */}
        {!loading && stories.map((story, idx) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            key={story.id} 
            onClick={() => setSelectedUser({ id: story.id, name: story.fullName || story.username, avatar: story.profile?.profilePictureUrl || story.avatar })}
            className="flex flex-col items-center gap-2 group cursor-pointer shrink-0"
          >
            <div className={cn(
              "p-[3px] rounded-full transition-all duration-300",
              "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 animate-spin-slow"
            )}>
              <div className="bg-white dark:bg-black p-[2px] rounded-full">
                <Avatar 
                  src={story.profile?.profilePictureUrl || story.avatar || `https://i.pravatar.cc/150?u=${story.id}`} 
                  alt={story.fullName || story.username} 
                  size="lg" 
                  className="h-[64px] w-[64px] group-hover:scale-105 transition-transform duration-300" 
                />
              </div>
            </div>
            <Typography variant="caption" className="font-bold dark:text-slate-300 text-[11px] truncate w-16 text-center">
              {story.fullName?.split(' ')[0] || story.username}
            </Typography>
          </motion.div>
        ))}

        {loading && [1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2 shrink-0 animate-pulse">
            <div className="h-[72px] w-[72px] rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="h-2 w-12 bg-slate-200 dark:bg-white/10 rounded" />
          </div>
        ))}
      </div>

      <CreatePostModal 
        open={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        initialType="STORY"
      />

      {selectedUser && (
        <StoryViewer 
          open={!!selectedUser}
          userId={selectedUser.id}
          userName={selectedUser.name}
          userAvatar={selectedUser.avatar}
          onClose={() => setSelectedUser(null)}
        />
      )}

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
