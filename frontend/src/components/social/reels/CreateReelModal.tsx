"use client";

import { useState, useRef } from "react";
import { 
  Modal, 
  Button, 
  Typography, 
  Input, 
  Textarea, 
  Avatar, 
  cn,
  Progress 
} from "@/components/ui";
import { 
  Video, 
  Music, 
  MapPin, 
  Hash, 
  AtSign, 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  X,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { createReel } from "@/lib/api";

export function CreateReelModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast.error("File is too large. Max size is 100MB.");
        return;
      }
      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
      setStep(2);
    }
  };

  const handlePublish = async () => {
    if (!video) {
      toast.error("Please select a video first");
      return;
    }
    setIsUploading(true);
    setUploadProgress(30);
    try {
      // Upload video to asset service (simplified — use the video preview URL as placeholder)
      const videoUrl = videoPreview || "";

      setUploadProgress(60);
      await createReel({
        title,
        description: description || title,
        videoUrl,
        thumbnailUrl: "",
        audioId: null,
        tags: hashtags.length > 0 ? hashtags : [],
      });

      setUploadProgress(100);
      toast.success("Reel published successfully!");
      setVideo(null);
      setVideoPreview(null);
      setTitle("");
      setDescription("");
      setLocation("");
      setHashtags([]);
      setStep(1);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish reel");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      title="Create New Reel"
    >
      <div className="min-h-[500px] flex flex-col">
        {step === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 bg-slate-50 dark:bg-slate-900/50">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Upload size={32} className="text-primary" />
            </div>
            <Typography variant="h5" fontWeight={800} className="mb-2">Upload Video</Typography>
            <Typography variant="body2" color="text.secondary" className="text-center mb-8 max-w-xs">
              Videos must be in vertical format (9:16) and under 60 seconds for best performance.
            </Typography>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="video/*" 
              className="hidden" 
            />
            <Button onClick={() => fileInputRef.current?.click()} size="lg" className="rounded-xl px-8">
              Select from device
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Preview */}
            <div className="w-full md:w-64 aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-xl relative border border-white/10">
              <video src={videoPreview!} className="h-full w-full object-cover" controls />
              <button 
                onClick={() => setStep(1)}
                className="absolute top-4 right-4 h-8 w-8 bg-black/40 rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <X size={16} className="text-white" />
              </button>
            </div>

            {/* Details Form */}
            <div className="flex-1 space-y-6">
              <div>
                <Typography variant="caption" fontWeight={700} className="mb-2 block uppercase tracking-widest text-slate-400">Details</Typography>
                <Input 
                  placeholder="Reel Title" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mb-4"
                />
                <Textarea 
                  placeholder="Tell your story... #hashtags @mentions" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-transparent focus-within:border-primary transition-all">
                    <MapPin size={18} className="text-slate-400" />
                    <input 
                      placeholder="Add Location" 
                      className="bg-transparent border-none outline-none text-sm w-full"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                 </div>
                 <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-transparent focus-within:border-primary transition-all">
                    <Music size={18} className="text-slate-400" />
                    <Typography variant="body2" className="text-slate-500">Original Audio</Typography>
                 </div>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Typography variant="caption" fontWeight={700}>Publishing...</Typography>
                    <Typography variant="caption" fontWeight={700}>{uploadProgress}%</Typography>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button variant="outline" fullWidth className="rounded-xl border-slate-200 dark:border-slate-800" disabled={isUploading}>
                  Save Draft
                </Button>
                <Button fullWidth className="rounded-xl shadow-lg shadow-primary/20" onClick={handlePublish} isLoading={isUploading}>
                  Publish Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
