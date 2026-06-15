"use client";

import { Dialog, DialogContent, Typography } from "@mui/material";
import { CreatePost } from "./CreatePost";
import { X } from "lucide-react";
import { createSocialPost } from "@/lib/api";
import { toast } from "sonner";
import { useTheme } from "@mui/material/styles";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onPostSuccess?: () => void;
  initialType?: "FEED" | "STORY";
}

export function CreatePostModal({ open, onClose, onPostSuccess, initialType = "FEED" }: CreatePostModalProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const handlePost = async (content: string, mediaAssetIds?: string[], type?: "FEED" | "STORY") => {
    try {
      await createSocialPost({ content, mediaAssetIds, type });
      toast.success(type === "STORY" ? "Story shared!" : "Moment shared with professionals!");
      // Dispatch global event for refresh
      window.dispatchEvent(new CustomEvent("social-post-created"));
      onPostSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to post");
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: isDark ? "#000000" : "#FFFFFF",
          backgroundImage: "none",
          borderRadius: "24px",
          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.05)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }
      }}
    >
      <div className="p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <Typography variant="h6" fontWeight={900} className="mb-8 uppercase tracking-widest text-[14px] dark:text-white">
          {initialType === "STORY" ? "Create professional story" : "Create professional post"}
        </Typography>

        <div className="-mx-1">
          <CreatePost onPost={handlePost} initialType={initialType} />
        </div>
      </div>
    </Dialog>
  );
}
