"use client";

import Link from "next/link";
import { memo, useMemo, useState } from "react";
import {
  Building2,
  Bookmark,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileText,
  Heart,
  MapPin,
  MessageSquare,
  Mic,
  PlayCircle,
  Send,
  Trash2,
  Users,
  Video,
  Waves,
} from "lucide-react";
import { toast } from "sonner";
import { AIMatchBadge } from "./AIMatchBadge";
import type { Job } from "@/lib/types";
import { workspaceRoutes } from "@/lib/workspace-routes";

function deriveCloudinaryVideoPosterUrl(videoUrl: string, options?: { width?: number; height?: number }) {
  try {
    const url = new URL(videoUrl);
    if (!url.hostname.includes("cloudinary.com")) {
      return null;
    }

    const marker = "/video/upload/";
    const path = url.pathname;
    const markerIndex = path.indexOf(marker);
    if (markerIndex === -1) {
      return null;
    }

    const prefix = path.slice(0, markerIndex + marker.length);
    const suffix = path.slice(markerIndex + marker.length).replace(/^\/+/, "");
    const width = options?.width ?? 960;
    const height = options?.height ?? 540;
    const transform = `so_0,f_jpg,q_auto,w_${width},h_${height},c_fill`;

    let posterPath = `${prefix}${transform}/${suffix}`;

    const lastSlash = posterPath.lastIndexOf("/");
    const fileName = lastSlash >= 0 ? posterPath.slice(lastSlash + 1) : posterPath;
    const dotIndex = fileName.lastIndexOf(".");
    if (dotIndex > 0) {
      const baseName = fileName.slice(0, dotIndex);
      posterPath = `${posterPath.slice(0, lastSlash + 1)}${baseName}.jpg`;
    } else {
      posterPath = `${posterPath}.jpg`;
    }

    return `${url.origin}${posterPath}`;
  } catch {
    return null;
  }
}

type ViewMode = "grid" | "list";

interface SmartJobCardProps {
  job: Job;
  viewMode?: ViewMode;
  onApply: (job: Job) => void;
  onSave: (jobId: string) => void;
  onDelete?: (jobId: string) => void;
  onMessage?: (job: Job) => void;
}

type SpeechRecognitionInstance = {
  lang: string;
  maxAlternatives: number;
  interimResults: boolean;
  start: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, Badge, Button } from "@/components/ui";

export const SmartJobCard = memo(function SmartJobCard({
  job,
  viewMode = "grid",
  onApply,
  onSave,
  onDelete,
  onMessage,
}: SmartJobCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);

  const applicantPct = Math.min(100, Math.round((job.applicantCount / Math.max(job.maxApplicants, 1)) * 100));
  const mediaItems = [
    ...(job.sampleImageUrls ?? []).map((url) => ({ kind: "image" as const, url })),
    ...(job.sampleVideoUrls ?? []).map((url) => ({ kind: "video" as const, url })),
  ];
  const activeMedia = mediaItems[mediaIndex] ?? null;
  const totalMedia = mediaItems.length;

  const activeVideoPoster = useMemo(() => {
    if (!activeMedia || activeMedia.kind !== "video") {
      return undefined;
    }

    const listMode = viewMode === "list";
    const poster = deriveCloudinaryVideoPosterUrl(activeMedia.url, {
      width: listMode ? 1080 : 900,
      height: listMode ? 600 : 500,
    });

    return poster ?? undefined;
  }, [activeMedia, viewMode]);

  const actionButtons = (
    <div className="flex flex-col gap-2 w-full mt-4">
      <Button
        onClick={() => onApply(job)}
        variant="primary"
        size="sm"
        className="w-full !rounded-xl !py-2.5"
        leftIcon={<Send className="h-3.5 w-3.5" />}
      >
        Apply Now
      </Button>
      <div className="flex gap-2">
        <Button
          onClick={() => setExpanded((value) => !value)}
          variant="outline"
          size="sm"
          className="flex-1 !rounded-xl !py-2"
        >
          {expanded ? "Less" : "Details"}
        </Button>
        <Button
          onClick={() => onMessage?.(job)}
          variant="outline"
          size="sm"
          className="flex-1 !rounded-xl !py-2"
          leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
        >
          Contact
        </Button>
      </div>
      {onDelete && (
        <Button
          onClick={() => onDelete(job.id)}
          variant="danger"
          size="sm"
          className="w-full !rounded-xl !py-2"
          leftIcon={<Trash2 className="h-3.5 w-3.5" />}
        >
          Delete
        </Button>
      )}
    </div>
  );

  if (viewMode === "list") {
    return (
      <GlassCard className="!p-0 overflow-hidden border-white/5 hover:border-white/10" hover={true}>
        <div className="flex flex-col sm:flex-row min-h-[160px]">
          <div className="relative w-full sm:w-48 md:w-64 h-48 sm:h-auto overflow-hidden bg-white/5">
            {activeMedia ? (
              <div className="h-full w-full">
                {activeMedia.kind === "image" ? (
                  <img
                    src={activeMedia.url}
                    alt={job.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <video
                    src={activeMedia.url}
                    poster={activeVideoPoster}
                    className="h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <BriefcaseBusiness className="h-12 w-12 text-white/10" />
              </div>
            )}
            
            {totalMedia > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {mediaItems.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 rounded-full transition-all ${i === mediaIndex ? "w-4 bg-white" : "w-1 bg-white/30"}`} 
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="purple" size="sm">
                  {job.experienceLevel || "Intermediate"}
                </Badge>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {new Date(job.postedAt).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => onSave(job.id)}
                className={`transition-all hover:scale-125 ${job.isSaved ? "text-pink-500" : "text-white/20 hover:text-white"}`}
              >
                <Heart className={`h-5 w-5 ${job.isSaved ? "fill-current" : ""}`} />
              </button>
            </div>

            <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-blue-400 transition-colors">
              {job.title}
            </h3>

            <div className="flex items-center gap-4 mb-4 text-xs font-semibold text-white/60">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-neon-blue" />
                {job.budget.type === "FIXED" ? "Fixed Price" : "Hourly"}
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                {job.isRemote ? "Global / Remote" : job.workLocation}
              </div>
            </div>

            <p className="text-sm text-white/50 leading-relaxed line-clamp-2 mb-4">
              {job.description}
            </p>

            <div className="mt-auto flex items-center justify-between">
              <div className="flex gap-2">
                {job.skills.slice(0, 3).map(skill => (
                  <span key={skill} className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white/40">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)} className="!rounded-xl">
                  Details
                </Button>
                <Button variant="primary" size="sm" onClick={() => onApply(job)} className="!rounded-xl">
                  Apply Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="h-full flex flex-col group border-white/5 hover:border-white/10" hover={true}>
      <div className="relative aspect-[16/10] -mx-6 -mt-6 mb-6 overflow-hidden bg-white/5">
        <AnimatePresence mode="wait">
          <motion.div
            key={mediaIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full"
          >
            {activeMedia ? (
              activeMedia.kind === "image" ? (
                <img
                  src={activeMedia.url}
                  alt={job.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <video
                  src={activeMedia.url}
                  poster={activeVideoPoster}
                  className="h-full w-full object-cover"
                />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <BriefcaseBusiness className="h-10 w-10 text-white/10" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
        
        <button
          onClick={() => onSave(job.id)}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl glass-button !px-2 !py-2 transition-all hover:scale-110"
        >
          <Bookmark className={`h-4 w-4 ${job.isSaved ? "fill-white" : "text-white/60"}`} />
        </button>

        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {totalMedia > 1 && mediaItems.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all ${i === mediaIndex ? "w-4 bg-white" : "w-1 bg-white/30"}`} />
              ))}
            </div>
            {job.employerVerified && (
              <div className="flex items-center gap-1 bg-emerald-500/20 backdrop-blur-md px-2 py-1 rounded-lg border border-emerald-500/30">
                <BadgeCheck className="h-3 w-3 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Verified</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="purple" size="sm">
            {job.experienceLevel || "Intermediate"}
          </Badge>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
            {new Date(job.postedAt).toLocaleDateString()}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-blue-400 transition-colors line-clamp-2">
          {job.title}
        </h3>

        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-white/60 font-semibold">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-neon-blue" />
            {job.budget.type === "FIXED"
              ? `$${(job.budget.min / 1000).toFixed(0)}k - $${(job.budget.max / 1000).toFixed(0)}k`
              : `$${job.budget.min}-$${job.budget.max}/hr`}
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40 font-medium">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{job.isRemote ? "Remote / Global" : job.workLocation}</span>
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white/40">
                    {i}
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-bold text-white/30 uppercase">{job.applicantCount} Applied</span>
            </div>
            <div className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">
              {applicantPct}% Full
            </div>
          </div>
          
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="text-sm text-white/50 leading-relaxed mb-4 pt-2 border-t border-white/5">
                  {job.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {job.skills.map(skill => (
                    <span key={skill} className="px-2 py-1 rounded-md bg-white/5 text-[9px] font-bold text-white/40 border border-white/5">
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {actionButtons}
        </div>
      </div>
    </GlassCard>
  );
});
