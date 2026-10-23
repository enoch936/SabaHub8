"use client";

import { useState, useRef } from "react";
import { Avatar, Button, Typography, cn } from "@/components/ui";
import { 
  Image as ImageIcon, 
  Video, 
  Mic, 
  Smile, 
  Send,
  X,
  FileText,
  Play
} from "lucide-react";
import { useSession } from "@/lib/session";
import { useTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import { uploadJobSampleImages, uploadJobSampleVideos, uploadJobSampleAudio } from "@/lib/api";
import { toast } from "sonner";

interface CreatePostProps {
  onPost?: (content: string, mediaAssetIds?: string[], type?: "FEED" | "STORY") => Promise<void>;
  initialType?: "FEED" | "STORY";
}

export function CreatePost({ onPost, initialType = "FEED" }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"FEED" | "STORY">(initialType);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; type: "image" | "video" | "audio" }[]>([]);
  
  const user = useSession((s) => s.user);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video" | "audio") => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    files.forEach(file => {
      const url = URL.createObjectURL(file);
      setPreviews(prev => [...prev, { url, type }]);
    });
    
    setIsExpanded(true);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if ((!content.trim() && selectedFiles.length === 0) || loading) return;
    setLoading(true);
    
    try {
      let mediaAssetIds: string[] = [];
      
      // Upload media files if any
      if (selectedFiles.length > 0) {
        const images = selectedFiles.filter(f => f.type.startsWith("image/"));
        const videos = selectedFiles.filter(f => f.type.startsWith("video/"));
        const audios = selectedFiles.filter(f => f.type.startsWith("audio/"));
        
        const [imageUrlResults, videoUrlResults, audioUrlResults] = await Promise.all([
          images.length > 0 ? uploadJobSampleImages(images) : Promise.resolve([]),
          videos.length > 0 ? uploadJobSampleVideos(videos) : Promise.resolve([]),
          audios.length > 0 ? uploadJobSampleAudio(audios) : Promise.resolve([]),
        ]);
        
        mediaAssetIds = [...imageUrlResults, ...videoUrlResults, ...audioUrlResults];
      }

      await onPost?.(content, mediaAssetIds, postType);
      setContent("");
      setSelectedFiles([]);
      setPreviews([]);
      setIsExpanded(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload media");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      layout
      className={cn(
        "w-full max-w-2xl mx-auto mb-10 transition-all duration-300",
        "bg-transparent"
      )}
    >
      <div className={cn(
        "rounded-[24px] p-1 transition-all duration-500",
        isExpanded 
          ? (isDark ? "bg-transparent border border-white/10" : "bg-transparent border-slate-200") 
          : "bg-transparent border border-transparent"
      )}>
        <div className="flex gap-4 p-4">
          <Avatar 
            src={user?.profilePictureUrl || undefined} 
            alt={user?.fullName} 
            size="md" 
            className="ring-2 ring-primary/10 shrink-0"
          />
          
          <div className="flex-1 flex flex-col gap-3">
            {isExpanded && (
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={() => setPostType("FEED")}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-all",
                    postType === "FEED" 
                      ? "bg-primary text-white" 
                      : "bg-slate-100 dark:bg-white/5 text-slate-400"
                  )}
                >
                  Feed Post
                </button>
                <button 
                  onClick={() => setPostType("STORY")}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-all",
                    postType === "STORY" 
                      ? "bg-primary text-white" 
                      : "bg-slate-100 dark:bg-white/5 text-slate-400"
                  )}
                >
                  Story
                </button>
              </div>
            )}
            <textarea
              ref={textareaRef}
              placeholder={postType === "STORY" ? "Share a story moment..." : "Share a professional moment..."}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              className={cn(
                "w-full bg-transparent border-none outline-none resize-none font-bold text-[16px] py-2",
                isDark ? "text-white placeholder:text-slate-600" : "text-black placeholder:text-slate-400",
                isExpanded ? "min-h-[100px]" : "min-h-[44px]"
              )}
            />

            {/* Media Previews */}
            {previews.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar-none">
                {previews.map((preview, idx) => (
                  <div key={idx} className="relative h-24 w-24 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                    {preview.type === "image" ? (
                      <img src={preview.url} className="h-full w-full object-cover" />
                    ) : preview.type === "video" ? (
                      <div className="h-full w-full bg-slate-900 flex items-center justify-center">
                        <Play size={20} className="text-white" />
                      </div>
                    ) : (
                      <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                        <Mic size={20} className="text-primary" />
                      </div>
                    )}
                    <button 
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10"
                >
                  <div className="flex items-center gap-1">
                    <input type="file" hidden ref={imageInputRef} accept="image/*" multiple onChange={(e) => handleFileSelect(e, "image")} />
                    <input type="file" hidden ref={videoInputRef} accept="video/*" multiple onChange={(e) => handleFileSelect(e, "video")} />
                    <input type="file" hidden ref={audioInputRef} accept="audio/*" multiple onChange={(e) => handleFileSelect(e, "audio")} />

                    <button 
                      onClick={() => imageInputRef.current?.click()}
                      className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
                    >
                       <ImageIcon size={20} />
                    </button>
                    <button 
                      onClick={() => videoInputRef.current?.click()}
                      className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
                    >
                       <Video size={20} />
                    </button>
                    <button 
                      onClick={() => audioInputRef.current?.click()}
                      className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
                    >
                       <Mic size={20} />
                    </button>
                    <button className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all">
                       <Smile size={20} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                     <Button 
                       variant="text" 
                       size="sm" 
                       className="font-bold text-slate-400 hover:text-slate-600"
                       onClick={() => {
                         setIsExpanded(false);
                         setPreviews([]);
                         setSelectedFiles([]);
                       }}
                     >
                       Cancel
                     </Button>
                     <Button 
                       onClick={handlePost}
                       disabled={(!content.trim() && selectedFiles.length === 0) || loading}
                       className="rounded-xl h-10 px-6 font-black shadow-lg shadow-primary/20"
                     >
                       {loading ? "Sharing..." : "Share"}
                     </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {!isExpanded && (
        <div className="flex items-center gap-4 mt-2 px-16">
           <button 
             onClick={() => { setIsExpanded(true); setTimeout(() => imageInputRef.current?.click(), 100); }}
             className="flex items-center gap-2 text-slate-400 text-[12px] font-bold hover:text-primary transition-colors"
           >
              <ImageIcon size={14} /> <span>Media</span>
           </button>
           <button 
             onClick={() => { setIsExpanded(true); setTimeout(() => videoInputRef.current?.click(), 100); }}
             className="flex items-center gap-2 text-slate-400 text-[12px] font-bold hover:text-primary transition-colors"
           >
              <Video size={14} /> <span>Video</span>
           </button>
           <button 
             onClick={() => { setIsExpanded(true); setTimeout(() => audioInputRef.current?.click(), 100); }}
             className="flex items-center gap-2 text-slate-400 text-[12px] font-bold hover:text-primary transition-colors"
           >
              <Mic size={14} /> <span>Voice</span>
           </button>
        </div>
      )}
    </motion.div>
  );
}
