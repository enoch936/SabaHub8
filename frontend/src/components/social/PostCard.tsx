"use client";

import { Avatar, Button, Typography, cn } from "@/components/ui";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  CheckCircle2, 
  Bookmark,
  Play,
  Volume2,
  Repeat2,
  Send
} from "lucide-react";
import { useState, useEffect } from "react";
import { likePost, unlikePost, savePost, unsavePost, addComment, getComments } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";

export type SocialPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorProfilePicture?: string;
  content: string;
  mediaAssetIds?: string[];
  mediaType?: "image" | "video" | "audio";
  type: "FEED" | "STORY";
  likeCount: number;
  commentCount: number;
  saveCount: number;
  shareCount: number;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
};

export type PostComment = {
  id: string;
  authorId: string;
  authorName: string;
  authorProfilePicture?: string;
  content: string;
  createdAt: string;
};

interface PostCardProps {
  post: SocialPost;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export function PostCard({ post, onLike, onComment, onShare }: PostCardProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.isLiked);
  const [saved, setSaved] = useState(post.isSaved);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [loading, setLoading] = useState(false);
  
  // Comment states
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikeCount((prev) => newLikedState ? prev + 1 : prev - 1);
    
    try {
      if (!newLikedState) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
      onLike?.(post.id);
    } catch (err: any) {
      setLiked(!newLikedState);
      setLikeCount((prev) => !newLikedState ? prev + 1 : prev - 1);
      toast.error(err.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (loading) return;
    const newSavedState = !saved;
    setSaved(newSavedState);
    
    try {
      if (newSavedState) {
        await savePost(post.id);
        toast.success("Saved to your collection");
      } else {
        await unsavePost(post.id);
        toast.success("Removed from collection");
      }
    } catch (err: any) {
      setSaved(!newSavedState);
      toast.error(err.message || "Failed to update save status");
    }
  };

  const fetchComments = async () => {
    if (comments.length > 0) return;
    try {
      setLoadingComments(true);
      const data = await getComments(post.id);
      setComments(data.content || data.items || []);
    } catch (err) {
      console.error("Failed to fetch comments", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      const comment = await addComment(post.id, newComment);
      setComments((prev) => [...prev, comment]);
      setNewComment("");
      setCommentCount((prev) => prev + 1);
      toast.success("Comment added");
    } catch (err: any) {
      toast.error(err.message || "Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mb-12 transition-all duration-300 w-full max-w-2xl mx-auto",
        "bg-transparent"
      )}
    >
      {/* Author Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => router.push(`/social/profile/${post.authorId}`)}
            className="relative group cursor-pointer"
          >
            <Avatar 
              src={post.authorProfilePicture} 
              alt={post.authorName} 
              size="md"
              className="ring-2 ring-primary/10 group-hover:ring-primary transition-all duration-300"
            />
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-black rounded-full p-0.5">
              <CheckCircle2 size={12} className="text-primary fill-primary/10" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Typography 
                variant="subtitle2" 
                fontWeight={900} 
                className="leading-tight dark:text-white hover:underline cursor-pointer"
                onClick={() => router.push(`/social/profile/${post.authorId}`)}
              >
                {post.authorName}
              </Typography>
              <Typography variant="caption" className="text-slate-400 font-bold">•</Typography>
              <Typography variant="caption" className="text-slate-400 font-bold">
                {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </Typography>
            </div>
            <Typography variant="caption" className="text-primary font-bold tracking-wider uppercase text-[9px]">Verified Professional</Typography>
          </div>
        </div>
        <Button variant="text" size="sm" className="h-9 w-9 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400">
          <MoreHorizontal size={20} />
        </Button>
      </div>

      {/* Media Content */}
      <div className={cn(
        "rounded-[24px] overflow-hidden relative group border",
        isDark ? "bg-transparent border-white/10" : "bg-transparent border-slate-100"
      )}>
        {post.mediaType === "video" ? (
          <div className="aspect-[4/5] relative bg-black">
             <img 
               src={post.mediaAssetIds?.[0] || `https://picsum.photos/seed/${post.id}/600/750`} 
               className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
             />
             <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-all">
                <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center scale-90 group-hover:scale-100 transition-all">
                   <Play size={24} fill="white" className="text-white ml-1" />
                </div>
             </div>
          </div>
        ) : post.mediaType === "audio" ? (
          <div className="p-8 flex items-center gap-6 bg-transparent">
             <div className="h-24 w-24 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                <Volume2 size={40} className="text-primary" />
             </div>
             <div className="flex-1 space-y-3">
                <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full w-1/3 bg-primary shadow-[0_0_10px_var(--primary)]" />
                </div>
                <Typography variant="caption" className="text-slate-500 font-bold block uppercase tracking-widest text-[10px]">Audio Insight • 1:24</Typography>
             </div>
          </div>
        ) : (
          <div className="aspect-[4/5] overflow-hidden bg-black/5 dark:bg-white/5">
             <img 
               src={post.mediaAssetIds?.[0] || `https://picsum.photos/seed/${post.id}/800/1000`} 
               alt="Post content" 
               className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
             />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-4">
           <button 
             onClick={handleLike}
             className={cn(
               "flex items-center gap-2 transition-all active:scale-90",
               liked ? "text-red-500" : "text-slate-500 hover:text-black dark:hover:text-white"
             )}
           >
             <Heart size={24} fill={liked ? "currentColor" : "none"} strokeWidth={liked ? 0 : 2} className={cn("transition-transform", liked && "animate-heart-pop")} />
             <span className="font-black text-[14px]">{formatCount(likeCount)}</span>
           </button>
           
           <button 
             onClick={toggleComments}
             className={cn(
               "flex items-center gap-2 transition-all active:scale-90",
               showComments ? "text-black dark:text-white" : "text-slate-500 hover:text-black dark:hover:text-white"
             )}
           >
             <MessageCircle size={24} strokeWidth={2} fill={showComments ? "currentColor" : "none"} className={showComments ? "opacity-10" : ""} />
             <span className="font-black text-[14px]">{formatCount(commentCount)}</span>
           </button>

           <button 
             onClick={() => onShare?.(post.id)}
             className="flex items-center gap-2 text-slate-500 hover:text-black dark:hover:text-white transition-all active:scale-90"
           >
             <Repeat2 size={24} strokeWidth={2} />
             <span className="font-black text-[14px]">{formatCount(post.shareCount)}</span>
           </button>
        </div>

        <button 
           onClick={handleSave}
           className={cn(
             "transition-all active:scale-90",
             saved ? "text-primary" : "text-slate-500 hover:text-black dark:hover:text-white"
           )}
        >
           <Bookmark size={24} fill={saved ? "currentColor" : "none"} strokeWidth={2} />
        </button>
      </div>

      {/* Content Section */}
      <div className="mt-3 px-1">
        <Typography variant="body2" className="text-[15px] leading-relaxed dark:text-slate-200">
          <span className="font-black mr-2 dark:text-white">{post.authorName}</span>
          {post.content}
        </Typography>
        
        {!showComments && commentCount > 0 && (
          <button 
            onClick={toggleComments}
            className="mt-2 text-slate-500 text-[13px] font-bold hover:underline"
          >
             View all {commentCount} comments
          </button>
        )}
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 px-1 space-y-4 overflow-hidden"
          >
            <div className="h-px bg-slate-100 dark:bg-white/5 w-full" />
            
            <div className="max-h-[300px] overflow-y-auto space-y-4 custom-scrollbar">
              {loadingComments ? (
                <div className="flex justify-center py-4">
                  <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <Typography variant="caption" className="text-slate-500 italic block py-2">
                  No comments yet. Be the first to share your thoughts!
                </Typography>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 items-start group">
                    <Avatar 
                      src={comment.authorProfilePicture} 
                      alt={comment.authorName} 
                      size="sm"
                      className="mt-0.5 shrink-0"
                    />
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-2">
                        <Typography variant="body2" fontWeight={900} className="text-[13px] dark:text-white">
                          {comment.authorName}
                        </Typography>
                        <Typography variant="caption" className="text-[11px] text-slate-400">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </Typography>
                      </div>
                      <Typography variant="body2" className="text-[13px] text-slate-600 dark:text-slate-300">
                        {comment.content}
                      </Typography>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="flex items-center gap-3 pt-2">
              <Avatar size="sm" className="shrink-0" />
              <div className="flex-1 relative">
                <input 
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className={cn(
                    "w-full bg-slate-50 dark:bg-white/5 border-none rounded-full py-2.5 pl-4 pr-12 text-[13px]",
                    "focus:ring-2 focus:ring-primary/20 transition-all outline-none dark:text-white"
                  )}
                />
                <button 
                  type="submit"
                  disabled={!newComment.trim() || submittingComment}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all",
                    newComment.trim() ? "text-primary hover:bg-primary/10" : "text-slate-300"
                  )}
                >
                  <Send size={16} fill={newComment.trim() ? "currentColor" : "none"} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes heart-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.4); }
          100% { transform: scale(1); }
        }
        .animate-heart-pop {
          animation: heart-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
        }
      `}</style>
    </motion.div>
  );
}
