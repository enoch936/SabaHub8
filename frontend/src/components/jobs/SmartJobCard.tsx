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
  FileText,
  Heart,
  MapPin,
  MessageSquare,
  PlayCircle,
  Send,
  Trash2,
  Users,
  User,
  ExternalLink,
  Eye,
  Download,
  Info,
  ShieldCheck,
  Target,
  Zap,
  Briefcase,
  Clock,
  Sparkles,
  X,
  Share2,
  ArrowUpRight,
  Layers,
  Activity,
  Calendar,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { AIMatchBadge } from "./AIMatchBadge";
import type { Job } from "@/lib/types";
import { workspaceRoutes } from "@/lib/workspace-routes";

/**
 * Advanced Glass UI Helper
 */
const glassStyles = {
  base: "backdrop-blur-md bg-white/40 border border-white/20 shadow-sm transition-all duration-300",
  hover: "hover:bg-gray-100/50 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] hover:border-white/40",
  action: "backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/30 text-gray-800 transition-all active:scale-95",
};

export const SmartJobCard = memo(function SmartJobCard({
  job,
  viewMode = "grid",
  onApply,
  onSave,
  onDelete,
  onMessage,
}: {
  job: Job;
  viewMode?: "grid" | "list";
  onApply: (job: Job) => void;
  onSave: (jobId: string) => void;
  onDelete?: (jobId: string) => void;
  onMessage?: (job: Job) => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);

  const employerProfileHref = job.employerId
    ? workspaceRoutes.publicProfile("employer", job.employerId)
    : null;

  const assets = useMemo(() => {
    return {
      images: job.sampleImageUrls || [],
      videos: job.sampleVideoUrls || [],
      docs: job.sampleDocumentUrls || [],
      audios: job.sampleAudioUrls || [],
    };
  }, [job]);

  const allMedia = useMemo(() => {
    return [
      ...assets.images.map(url => ({ type: 'image' as const, url })),
      ...assets.videos.map(url => ({ type: 'video' as const, url }))
    ];
  }, [assets]);

  const activeMedia = allMedia[mediaIndex] || null;

  const hasAssets = assets.images.length > 0 || assets.videos.length > 0 || assets.docs.length > 0;

  const nextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMediaIndex(prev => (prev + 1) % allMedia.length);
  };

  const prevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMediaIndex(prev => (prev - 1 + allMedia.length) % allMedia.length);
  };

  if (viewMode === "list") {
    return (
      <div
        className={`group relative rounded-2xl ${glassStyles.base} ${glassStyles.hover} p-3 cursor-pointer flex items-center justify-between gap-4`}
        onClick={() => setShowDetail(true)}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-gray-950 flex items-center justify-center text-white shrink-0 shadow-lg overflow-hidden">
            {assets.images[0] ? (
              <img src={assets.images[0]} className="w-full h-full object-cover" alt="Job" />
            ) : (
              <Briefcase className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-950 text-sm truncate tracking-tight">{job.title}</h3>
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              <span className="text-gray-900">
                {job.budget.type === "FIXED" ? `$${(job.budget.min / 1000).toFixed(0)}k+` : `$${job.budget.min}/hr`}
              </span>
              <span>•</span>
              <span className="truncate opacity-60">{job.employerName}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onApply(job); }}
            className="h-8 px-4 rounded-xl bg-gray-950 text-white text-[9px] font-black uppercase tracking-widest shadow-lg"
          >
            Apply
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowDetail(true); }}
            className={`h-8 px-4 rounded-xl ${glassStyles.action} text-[9px] font-black uppercase tracking-widest shadow-lg`}
          >
            Detailed
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Static Glass Card (Grid) - Square Gallery & Dynamic Reveal */}
      <div
        className={`group relative rounded-[32px] ${glassStyles.base} ${glassStyles.hover} p-4 cursor-pointer overflow-hidden flex flex-col h-[440px] transition-all duration-500 hover:scale-[1.02]`}
        onClick={() => setShowDetail(true)}
      >
        {/* Content View - Full Visibility */}
        <div className="flex flex-col h-full transition-all duration-500">
          {/* MASSIVE SQUARE HERO Visual Part - Always Visible */}
          <div className="relative -mx-4 -mt-4 mb-4 aspect-square shrink-0 overflow-hidden bg-gray-950 group-hover:brightness-90 transition-all duration-500 border-b border-white/10">
            {activeMedia ? (
              <>
                {activeMedia.type === 'image' ? (
                  <img 
                    src={activeMedia.url} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    alt="Mission Header" 
                  />
                ) : (
                  <video src={activeMedia.url} className="w-full h-full object-cover" />
                )}
                
                {/* Media Switcher Controls - Always available */}
                {allMedia.length > 1 && (
                  <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex justify-between z-30 transition-opacity duration-300">
                    <button
                      onClick={prevMedia}
                      className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors border border-white/10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={nextMedia}
                      className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors border border-white/10"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
                <Briefcase className="h-10 w-10 text-gray-500/30" />
              </div>
            )}
            
            {/* Overlay Status Bar - Always Visible */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />
            
            <div className="absolute top-3 left-4 right-4 flex justify-between items-start z-20">
               <div className="flex flex-wrap gap-1.5">
                <span className="bg-emerald-500 text-white text-[7px] font-black px-2 py-0.5 rounded-md shadow-2xl uppercase tracking-widest">
                  {job.status}
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onSave(job.id); }}
                className="p-1.5 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 transition-all active:scale-90"
              >
                <Bookmark className={`h-3.5 w-3.5 ${job.isSaved ? "fill-red-500 text-red-500" : "text-white"}`} />
              </button>
            </div>

            {/* Media Indicators (Dots) - Always Visible */}
            {allMedia.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-30">
                {allMedia.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all ${i === mediaIndex ? 'w-4 bg-white' : 'w-1 bg-white/40'}`} />
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Partition */}
          <div className="flex-1 flex flex-col justify-between relative overflow-hidden">
            <div className="min-w-0">
              <div className="flex justify-between items-start gap-2 mb-1">
                <h3 className="font-black text-gray-950 text-[15px] leading-[1.1] line-clamp-1 tracking-tight group-hover:text-indigo-600 transition-colors">
                  {job.title}
                </h3>
                {employerProfileHref && (
                  <Link 
                    href={employerProfileHref}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-all shadow-sm border border-transparent hover:border-gray-200"
                    title="View Profile"
                  >
                    <User className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3">
                <ShieldCheck className="h-2.5 w-2.5 text-blue-400" />
                {job.employerName}
              </div>

              <div className="space-y-2">
                <p className="text-[11px] text-gray-600 font-medium line-clamp-2 leading-tight">
                  {job.description}
                </p>
                
                <div className="flex flex-wrap gap-1">
                  {job.skills.slice(0, 3).map(skill => (
                    <span key={skill} className="text-[7px] font-black px-2 py-0.5 rounded-lg bg-indigo-50/50 border border-indigo-100/50 text-indigo-600 uppercase tracking-tight">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-2 py-3 mt-4 border-t border-white/30">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Disbursement</span>
                  <span className="text-[12px] font-black text-gray-950 tracking-tighter">
                    {job.budget.type === "FIXED" 
                      ? `$${(job.budget.min / 1000).toFixed(0)}k+` 
                      : `$${job.budget.min}/hr`}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 text-right">
                  <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Operation</span>
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-[9px] font-black text-gray-900 uppercase">
                      {job.experienceLevel}
                    </span>
                    <Zap className="h-3 w-3 text-amber-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Overlay - Bottom 25% on Hover */}
        <div className="absolute bottom-0 left-0 right-0 h-1/4 z-20 flex items-center justify-center p-4 opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 bg-white/40 backdrop-blur-xl border-t border-white/40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pointer-events-none group-hover:pointer-events-auto">
          <div className="w-full flex gap-2 px-2">
            {employerProfileHref && (
              <Link
                href={employerProfileHref}
                onClick={(e) => e.stopPropagation()}
                className="h-10 w-10 rounded-2xl bg-white/80 text-gray-950 border border-gray-200 flex items-center justify-center shadow-xl hover:bg-white transition-all active:scale-95"
                title="View Employer Profile"
              >
                <User className="h-4 w-4" />
              </Link>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onApply(job); }}
              className="flex-1 h-10 rounded-2xl bg-gray-950 text-white text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-2xl hover:bg-gray-800 transition-all active:scale-95"
            >
              <Target className="h-3.5 w-3.5" />
              Apply
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowDetail(true); }}
              className="h-10 w-10 rounded-2xl bg-white/80 text-gray-950 border border-gray-200 flex items-center justify-center shadow-xl hover:bg-white transition-all active:scale-95"
              title="Detailed View"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Detail View (Partitioned Modal) */}
      <AnimatePresence>
        {showDetail && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4" 
            onClick={() => setShowDetail(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-white rounded-t-[32px] md:rounded-[32px] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-gray-100 relative" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative h-48 shrink-0 bg-gray-950 border-b border-gray-100">
                {assets.images[0] ? (
                  <img src={assets.images[0]} className="w-full h-full object-cover opacity-40 blur-[1px]" alt="Header" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-black" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-80" />
                
                <button 
                  onClick={() => setShowDetail(false)} 
                  className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-full text-gray-900 shadow-sm hover:bg-white transition-all z-30"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <div className="absolute bottom-6 left-8 right-8 z-30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest shadow-sm">
                      {job.status}
                    </span>
                    <AIMatchBadge score={job.aiMatchScore} />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-gray-950 leading-tight line-clamp-2">
                    {job.title}
                  </h2>
                </div>
              </div>

              {/* Content Scroll Area */}
              <div className="flex-1 overflow-y-auto pt-6 pb-24 px-8 custom-scrollbar">
                <div className="space-y-6">
                  {/* Employer Row */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="h-12 w-12 rounded-xl overflow-hidden shadow-sm bg-white shrink-0">
                      <img 
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(job.employerName)}&backgroundColor=f1f5f9`} 
                        className="w-full h-full object-cover" 
                        alt="Employer" 
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hiring Organization</p>
                      <h3 className="font-bold text-gray-900 truncate">{job.employerName}</h3>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payload</p>
                      <p className="text-lg font-black text-gray-900">
                        {job.budget.type === "FIXED" ? `$${job.budget.min.toLocaleString()}` : `$${job.budget.min}/hr`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Location</p>
                      <div className="flex items-center justify-end gap-1 text-emerald-600 font-bold text-sm">
                        <MapPin className="h-4 w-4" /> {job.isRemote ? "Remote" : job.workLocation}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mission Objective</h4>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {job.description}
                    </p>
                  </div>

                  {/* Skills Chips */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Required Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map(skill => (
                        <span key={skill} className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-500 font-bold text-[10px] uppercase">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Assets if any */}
                  {hasAssets && (
                    <div className="space-y-4 pt-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-t border-gray-100 pt-6">Intelligence Assets</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {assets.images.slice(0, 2).map((url, i) => (
                          <img key={i} src={url} className="rounded-xl border border-gray-100 shadow-sm aspect-video object-cover" alt="Asset" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed Footer Actions */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex gap-3 z-40">
                <button 
                  onClick={() => { onApply(job); setShowDetail(false); }}
                  className="flex-1 h-12 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  Engage Now
                </button>
                <button 
                  onClick={() => { onMessage?.(job); setShowDetail(false); }}
                  className="h-12 w-12 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
                >
                  <MessageSquare className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
