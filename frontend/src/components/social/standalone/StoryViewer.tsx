"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@mui/material";
import { Avatar, Typography, Button, cn } from "@/components/ui";
import { X, ChevronLeft, ChevronRight, User as UserIcon } from "lucide-react";
import { getUserStories } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface StoryViewerProps {
  userId: string;
  userName: string;
  userAvatar?: string;
  open: boolean;
  onClose: () => void;
}

export function StoryViewer({ userId, userName, userAvatar, open, onClose }: StoryViewerProps) {
  const router = useRouter();
  const [stories, setStories] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && userId) {
      const fetchStories = async () => {
        try {
          setLoading(true);
          const data = await getUserStories(userId);
          setStories(data);
          setCurrentIndex(0);
        } catch (err) {
          console.error("Failed to fetch stories:", err);
          onClose();
        } finally {
          setLoading(false);
        }
      };
      fetchStories();
    }
  }, [open, userId]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const currentStory = stories[currentIndex];

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: "black",
          color: "white",
        }
      }}
    >
      <div className="relative h-full w-full flex items-center justify-center bg-black overflow-hidden">
        {/* Progress Bars */}
        <div className="absolute top-4 left-4 right-4 z-50 flex gap-1">
          {stories.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: idx < currentIndex ? "100%" : idx === currentIndex ? "100%" : "0%" }}
                transition={{ duration: idx === currentIndex ? 5 : 0.1, ease: "linear" }}
                onAnimationComplete={() => {
                   if (idx === currentIndex) handleNext();
                }}
                className="h-full bg-white"
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 z-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar src={userAvatar} alt={userName} size="md" className="ring-2 ring-white/20" />
            <div className="flex flex-col">
              <Typography variant="subtitle2" fontWeight={900}>{userName}</Typography>
              <Typography variant="caption" className="text-white/60">
                {currentStory && new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                onClose();
                router.push(`/social/profile/${userId}`);
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
            >
              <UserIcon size={20} />
            </button>
            <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-full w-full max-w-lg relative flex flex-col items-center justify-center p-4">
           <AnimatePresence mode="wait">
             <motion.div 
               key={currentIndex}
               initial={{ opacity: 0, x: 50 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -50 }}
               className="w-full h-full flex flex-col items-center justify-center"
             >
                {currentStory?.mediaAssetIds?.[0] && (
                  <img 
                    src={currentStory.mediaAssetIds[0]} 
                    className="max-h-[70vh] w-full object-contain rounded-2xl shadow-2xl" 
                    alt="Story content"
                  />
                )}
                <div className="mt-8 text-center px-6">
                  <Typography variant="h6" className="font-bold leading-tight">
                    {currentStory?.content}
                  </Typography>
                </div>
             </motion.div>
           </AnimatePresence>
        </div>

        {/* Navigation Overlays */}
        <div className="absolute inset-y-0 left-0 w-1/4 z-40" onClick={handlePrev} />
        <div className="absolute inset-y-0 right-0 w-1/4 z-40" onClick={handleNext} />
        
        {/* Navigation Buttons (Desktop) */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-8 z-50 pointer-events-none hidden md:flex">
           <button 
             onClick={handlePrev} 
             disabled={currentIndex === 0}
             className="h-12 w-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all pointer-events-auto disabled:opacity-0"
           >
              <ChevronLeft size={24} />
           </button>
           <button 
             onClick={handleNext} 
             className="h-12 w-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all pointer-events-auto"
           >
              <ChevronRight size={24} />
           </button>
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-10 left-0 right-0 z-50 flex justify-center px-4">
           <Button 
             variant="outline" 
             className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-white font-black px-8 h-12"
             onClick={() => router.push(`/social/profile/${userId}`)}
           >
             View Profile
           </Button>
        </div>
      </div>
    </Dialog>
  );
}