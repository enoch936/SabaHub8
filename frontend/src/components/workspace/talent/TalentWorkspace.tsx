"use client";

import Link from "next/link";
import { useEffect, useState, useDeferredValue, useMemo } from "react";
import { 
  Search, 
  Sparkles, 
  MapPin, 
  Star, 
  ShieldCheck, 
  MessageSquare, 
  ImageIcon, 
  FileText, 
  PlayCircle,
  ArrowRight,
  SlidersHorizontal,
  LayoutGrid,
  LayoutList,
  Save,
  FolderOpen,
  ChevronDown,
  Grid3X3,
  Zap,
  Target,
  Eye,
  User,
  Send,
  X,
  Share2,
  Globe,
  Award,
  Clock,
  Briefcase,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/lib/session";
import { workspaceRoutes } from "@/lib/workspace-routes";
import { formatCurrencyRange, formatPrice } from "@/lib/utils";
import type { 
  MarketplaceSearchResponse, 
  MarketplaceSearchTalent, 
  MarketplaceSearchGig, 
  MarketplaceSearchProjectPost, 
  MarketplaceSearchStory, 
  MarketplaceSort, 
  MarketplaceMediaFilter,
  ExperienceLevel
} from "@/lib/types";
import { toast } from "sonner";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { useTheme, alpha } from "@mui/material";

const TALENT_PRESETS_STORAGE_KEY = "sabahub_talent_presets";

type BoardId = "all" | "talents" | "projects" | "gigs" | "stories";
type ViewMode = "grid" | "list";

interface TalentFilterPreset {
  id: string;
  name: string;
  query: string;
  activeSkill: string;
  categoryFilter: string;
  mediaFilter: MarketplaceMediaFilter;
  sortBy: MarketplaceSort;
  minBudget: string;
  maxBudget: string;
  minPrice: string;
  maxPrice: string;
}

/**
 * Advanced Glass UI Helper
 */
const glassStyles = {
  base: "backdrop-blur-md bg-white/40 border border-white/20 shadow-sm transition-all duration-300",
  hover: "hover:bg-gray-100/50 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] hover:border-white/40",
  action: "backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/30 text-gray-800 transition-all active:scale-95",
};

/**
 * Simple Mobile-Friendly Detailed View Modal
 */
function DetailedViewModal({ 
  isOpen, 
  onClose, 
  data, 
  type 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  data: any; 
  type: 'talent' | 'project' | 'gig' 
}) {
  if (!data) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4" 
          onClick={onClose}
        >
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-white rounded-t-[32px] md:rounded-[32px] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-gray-100" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative h-48 shrink-0 bg-gray-50 border-b border-gray-100">
              <img 
                src={data.thumbnailUrl || "/api/placeholder/800/400"} 
                className="w-full h-full object-cover opacity-20" 
                alt="Banner" 
              />
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-full text-gray-900 shadow-sm hover:bg-white transition-all z-10"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="absolute -bottom-10 left-8">
                <div className="h-20 w-20 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white">
                  <img 
                    src={data.profilePicture || data.thumbnailUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name || data.title)}`} 
                    className="w-full h-full object-cover" 
                    alt="Avatar" 
                  />
                </div>
              </div>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto pt-12 pb-24 px-8 custom-scrollbar">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                      {type}
                    </span>
                    {data.rating && (
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <Star className="h-3 w-3 fill-current" /> {data.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-gray-950 leading-tight">
                    {data.name || data.title}
                  </h2>
                  <p className="text-gray-500 font-bold text-xs mt-1">
                    {data.professionalTitle || data.freelancerName || "Verified Professional"}
                  </p>
                </div>

                <div className="py-4 border-y border-gray-50 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rate / Budget</p>
                    <p className="text-lg font-black text-gray-900">
                      {data.hourlyRate ? `$${data.hourlyRate}/hr` : formatCurrencyRange(data.budgetMin, data.budgetMax, data.currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                    <div className="flex items-center justify-end gap-1 text-emerald-600 font-bold text-sm uppercase tracking-tighter">
                      <CheckCircle className="h-4 w-4" /> Available
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {data.description || "High-quality professional services focused on delivering exceptional results. Specializing in advanced operations and strategic management."}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {(data.skills || []).map((skill: string) => (
                      <span key={skill} className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-500 font-bold text-[10px] uppercase">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex gap-3">
              <button className="flex-1 h-12 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                Book Now
              </button>
              <button className="h-12 w-12 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all">
                <MessageSquare className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TalentCard({
  talent,
  viewMode,
  onExploreSkill,
}: {
  talent: MarketplaceSearchTalent;
  viewMode: ViewMode;
  onExploreSkill: (skill: string) => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const chatHref = talent.userId ? `/chat?user=${encodeURIComponent(talent.userId)}` : "/chat";
  const previewUrl = talent.profilePicture || talent.portfolioThumbnailUrl || talent.coverImage;

  return (
    <>
      <article
        className={`group relative rounded-[28px] ${glassStyles.base} ${glassStyles.hover} p-4 cursor-pointer overflow-hidden flex flex-col h-[360px]`}
        onClick={() => setShowDetail(true)}
      >
        {/* Content View - Full Visibility */}
        <div className="flex flex-col h-full transition-all duration-500">
          {/* Square Hero Visual */}
          <div className="relative -mx-4 -mt-4 mb-4 aspect-square shrink-0 overflow-hidden bg-gray-950 border-b border-white/10">
            {previewUrl ? (
              <img src={previewUrl} className="w-full h-full object-cover" alt={talent.name} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                <User className="h-10 w-10 text-gray-700" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-60" />
            <div className="absolute bottom-3 left-4 flex items-center gap-1.5">
              <Star className="h-3 w-3 text-amber-500 fill-current" />
              <span className="text-[10px] font-black text-white">{talent.rating?.toFixed(1) || "New"}</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            <div className="min-w-0">
              <h3 className="font-black text-gray-950 text-[14px] leading-[1.1] line-clamp-1 mb-1 tracking-tight">
                {talent.name || "Freelancer"}
              </h3>
              <div className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">
                <ShieldCheck className="h-2.5 w-2.5 text-blue-400" />
                {talent.professionalTitle || "Verified Talent"}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-1">
                  {(talent.skills ?? []).slice(0, 3).map(skill => (
                    <span key={skill} className="text-[7px] font-black px-2 py-0.5 rounded-lg bg-gray-100/50 border border-gray-200/50 text-gray-500 uppercase">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-2 py-2 mt-3 border-t border-white/30">
                <div className="flex flex-col">
                  <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Rate</span>
                  <span className="text-[11px] font-black text-gray-950">${talent.hourlyRate || "0"}/hr</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Success</span>
                  <span className="text-[11px] font-black text-emerald-600">{talent.successRate || "100"}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Overlay - Bottom 25% on Hover */}
        <div className="absolute bottom-0 left-0 right-0 h-1/4 z-20 flex items-center justify-center p-4 opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 bg-white/40 backdrop-blur-xl border-t border-white/40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pointer-events-none group-hover:pointer-events-auto">
          <div className="w-full flex gap-2 px-2">
            <Link
              href={workspaceRoutes.publicProfile("freelancer", talent.freelancerId)}
              onClick={(e) => e.stopPropagation()}
              className="h-10 w-10 rounded-2xl bg-white/80 text-gray-950 border border-gray-200 flex items-center justify-center shadow-xl hover:bg-white transition-all active:scale-95"
              title="View Profile"
            >
              <User className="h-4 w-4" />
            </Link>
            <button
              onClick={(e) => { e.stopPropagation(); setShowDetail(true); }}
              className="flex-1 h-10 rounded-2xl bg-gray-950 text-white text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-2xl hover:bg-gray-800 transition-all active:scale-95"
            >
              <Eye className="h-3.5 w-3.5" />
              Detailed
            </button>
            <Link
              href={chatHref}
              onClick={(e) => e.stopPropagation()}
              className="h-10 w-10 rounded-2xl bg-emerald-600/90 text-white flex items-center justify-center shadow-xl hover:bg-emerald-500 transition-all active:scale-95"
              title="Contact"
            >
              <MessageSquare className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>

      <DetailedViewModal isOpen={showDetail} onClose={() => setShowDetail(false)} data={talent} type="talent" />
    </>
  );
}

function ProjectPostCard({
  post,
  viewMode,
}: {
  post: MarketplaceSearchProjectPost;
  viewMode: ViewMode;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const chatHref = post.freelancerUserId ? `/chat?user=${encodeURIComponent(post.freelancerUserId)}` : "/chat";

  return (
    <>
      <article
        className={`group relative rounded-[28px] ${glassStyles.base} ${glassStyles.hover} p-4 cursor-pointer overflow-hidden flex flex-col h-[360px]`}
        onClick={() => setShowDetail(true)}
      >
        <div className="flex flex-col h-full transition-all duration-500">
          <div className="relative -mx-4 -mt-4 mb-4 aspect-square shrink-0 overflow-hidden bg-gray-950 border-b border-white/10">
            {post.thumbnailUrl ? (
              <img src={post.thumbnailUrl} className="w-full h-full object-cover" alt={post.title} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-black">
                <Target className="h-10 w-10 text-purple-400 opacity-30" />
              </div>
            )}
            <div className="absolute top-3 left-4">
              <span className="bg-purple-600 text-white text-[7px] font-black px-2 py-0.5 rounded-md shadow-2xl uppercase tracking-widest">Project</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            <div className="min-w-0">
              <h3 className="font-black text-gray-950 text-[14px] leading-[1.1] line-clamp-1 mb-1 tracking-tight">
                {post.title}
              </h3>
              <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">
                by {post.freelancerName}
              </div>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-2 py-2 mt-3 border-t border-white/30">
                <div className="flex flex-col">
                  <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Budget</span>
                  <span className="text-[11px] font-black text-gray-950">
                    {formatCurrencyRange(post.budgetMin, post.budgetMax, post.currency)}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Delivery</span>
                  <span className="text-[11px] font-black text-gray-950">{post.deliveryDays} Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Overlay - Bottom 25% on Hover */}
        <div className="absolute bottom-0 left-0 right-0 h-1/4 z-20 flex items-center justify-center p-4 opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 bg-white/40 backdrop-blur-xl border-t border-white/40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pointer-events-none group-hover:pointer-events-auto">
          <div className="w-full flex gap-2 px-2">
            <Link
              href={workspaceRoutes.publicProfile("freelancer", post.freelancerId)}
              onClick={(e) => e.stopPropagation()}
              className="h-10 w-10 rounded-2xl bg-white/80 text-gray-950 border border-gray-200 flex items-center justify-center shadow-xl hover:bg-white transition-all active:scale-95"
              title="View Profile"
            >
              <User className="h-4 w-4" />
            </Link>
            <button
              onClick={(e) => { e.stopPropagation(); setShowDetail(true); }}
              className="flex-1 h-10 rounded-2xl bg-gray-950 text-white text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-2xl hover:bg-gray-800 transition-all active:scale-95"
            >
              <Eye className="h-3.5 w-3.5" />
              Detailed
            </button>
            <Link
              href={chatHref}
              onClick={(e) => e.stopPropagation()}
              className="h-10 w-10 rounded-2xl bg-indigo-600/90 text-white flex items-center justify-center shadow-xl hover:bg-indigo-500 transition-all active:scale-95"
              title="Contact"
            >
              <Send className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>

      <DetailedViewModal isOpen={showDetail} onClose={() => setShowDetail(false)} data={post} type="project" />
    </>
  );
}

function GigCard({
  gig,
  viewMode,
}: {
  gig: MarketplaceSearchGig;
  viewMode: ViewMode;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const chatHref = gig.freelancerUserId ? `/chat?user=${encodeURIComponent(gig.freelancerUserId)}` : "/chat";

  return (
    <>
      <article
        className={`group relative rounded-[28px] ${glassStyles.base} ${glassStyles.hover} p-4 cursor-pointer overflow-hidden flex flex-col h-[360px]`}
        onClick={() => setShowDetail(true)}
      >
        <div className="flex flex-col h-full transition-all duration-500">
          <div className="relative -mx-4 -mt-4 mb-4 aspect-square shrink-0 overflow-hidden bg-gray-950 border-b border-white/10">
            {gig.thumbnailUrl ? (
              <img src={gig.thumbnailUrl} className="w-full h-full object-cover" alt={gig.title} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-900 to-black">
                <Zap className="h-10 w-10 text-green-400 opacity-30" />
              </div>
            )}
            <div className="absolute top-3 left-4">
              <span className="bg-green-600 text-white text-[7px] font-black px-2 py-0.5 rounded-md shadow-2xl uppercase tracking-widest">Service</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            <div className="min-w-0">
              <h3 className="font-black text-gray-950 text-[14px] leading-[1.1] line-clamp-1 mb-1 tracking-tight">
                {gig.title}
              </h3>
              <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">
                by {gig.freelancerName}
              </div>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-2 py-2 mt-3 border-t border-white/30">
                <div className="flex flex-col">
                  <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Price</span>
                  <span className="text-[11px] font-black text-gray-950">
                    {formatPrice(gig.price, gig.currency)}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Delivery</span>
                  <span className="text-[11px] font-black text-gray-950">{gig.deliveryDays}d</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Overlay - Bottom 25% on Hover */}
        <div className="absolute bottom-0 left-0 right-0 h-1/4 z-20 flex items-center justify-center p-4 opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 bg-white/40 backdrop-blur-xl border-t border-white/40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pointer-events-none group-hover:pointer-events-auto">
          <div className="w-full flex gap-2 px-2">
            <Link
              href={workspaceRoutes.publicProfile("freelancer", gig.freelancerId)}
              onClick={(e) => e.stopPropagation()}
              className="h-10 w-10 rounded-2xl bg-white/80 text-gray-950 border border-gray-200 flex items-center justify-center shadow-xl hover:bg-white transition-all active:scale-95"
              title="View Profile"
            >
              <User className="h-4 w-4" />
            </Link>
            <button
              onClick={(e) => { e.stopPropagation(); setShowDetail(true); }}
              className="flex-1 h-10 rounded-2xl bg-gray-950 text-white text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-2xl hover:bg-gray-800 transition-all active:scale-95"
            >
              <Eye className="h-3.5 w-3.5" />
              Detailed
            </button>
            <Link
              href={chatHref}
              onClick={(e) => e.stopPropagation()}
              className="h-10 w-10 rounded-2xl bg-emerald-600/90 text-white flex items-center justify-center shadow-xl hover:bg-emerald-500 transition-all active:scale-95"
              title="Apply"
            >
              <Zap className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>

      <DetailedViewModal isOpen={showDetail} onClose={() => setShowDetail(false)} data={gig} type="gig" />
    </>
  );
}

function StoryCard({
  story,
  viewMode,
}: {
  story: MarketplaceSearchStory;
  viewMode: ViewMode;
}) {
  const chatHref = story.freelancerUserId ? `/chat?user=${encodeURIComponent(story.freelancerUserId)}` : "/chat";

  return (
    <article
      className={`group relative rounded-[28px] ${glassStyles.base} ${glassStyles.hover} p-4 cursor-pointer overflow-hidden flex flex-col h-[360px]`}
    >
      <div className="flex flex-col h-full transition-all duration-500">
        <div className="relative -mx-4 -mt-4 mb-4 aspect-square shrink-0 overflow-hidden bg-gray-950 border-b border-white/10">
          {story.imageUrls?.[0] ? (
            <img src={story.imageUrls[0]} className="w-full h-full object-cover" alt={story.title} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-900 to-black">
              <Sparkles className="h-10 w-10 text-amber-400 opacity-30" />
            </div>
          )}
          <div className="absolute top-3 left-4">
            <span className="bg-amber-600 text-white text-[7px] font-black px-2 py-0.5 rounded-md shadow-2xl uppercase tracking-widest">Story</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="min-w-0">
            <h3 className="font-black text-gray-950 text-[14px] leading-[1.1] line-clamp-1 mb-1 tracking-tight">
              {story.title}
            </h3>
            <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">
              by {story.freelancerName}
            </div>
          </div>
        </div>
      </div>

      {/* Action Overlay - Bottom 25% on Hover */}
      <div className="absolute bottom-0 left-0 right-0 h-1/4 z-20 flex items-center justify-center p-4 opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 bg-white/40 backdrop-blur-xl border-t border-white/40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pointer-events-none group-hover:pointer-events-auto">
        <div className="w-full flex gap-2 px-2">
          <Link
            href={workspaceRoutes.publicProfile("freelancer", story.freelancerId)}
            className="h-10 w-10 rounded-2xl bg-white/80 text-gray-950 border border-gray-200 flex items-center justify-center shadow-xl hover:bg-white transition-all active:scale-95"
            title="View Profile"
          >
            <User className="h-4 w-4" />
          </Link>
          <Link
            href={chatHref}
            className="flex-1 h-10 rounded-2xl bg-amber-600 text-white text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-2xl hover:bg-amber-500 transition-all active:scale-95"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Contact
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function TalentWorkspace() {
  const role = useSession((state) => state.role);
  const [query, setQuery] = useState("");
  const [activeBoard, setActiveBoard] = useState<BoardId>("all");
  const [activeSkill, setActiveSkill] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [mediaFilter, setMediaFilter] = useState<MarketplaceMediaFilter>("ALL");
  const [sortBy, setSortBy] = useState<MarketplaceSort>("relevance");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<MarketplaceSearchResponse | null>(null);
  const [savedPresets, setSavedPresets] = useState<TalentFilterPreset[]>([]);
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [presetName, setPresetName] = useState("");

  const deferredQuery = useDeferredValue(query);

  const boards: { id: BoardId; label: string; count: number }[] = [
    { id: "all", label: "All", count: (results?.talents.length || 0) + (results?.projectPosts.length || 0) + (results?.gigs.length || 0) + (results?.stories.length || 0) },
    { id: "talents", label: "Talent", count: results?.talents.length || 0 },
    { id: "projects", label: "Projects", count: results?.projectPosts.length || 0 },
    { id: "gigs", label: "Gigs", count: results?.gigs.length || 0 },
    { id: "stories", label: "Stories", count: results?.stories.length || 0 },
  ];

  const featuredSkills = useMemo(() => {
    const allSkills = results?.talents.flatMap(t => t.skills || []) || [];
    const counts = allSkills.reduce((acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([s]) => s)
      .slice(0, 10);
  }, [results]);

  useEffect(() => {
    setIsLoading(true);
    // Mock search for now
    setTimeout(() => {
      const mockResults: MarketplaceSearchResponse = {
        talents: [
          { freelancerId: "1", userId: "u1", name: "Abebe Kebede", professionalTitle: "Fullstack Developer", hourlyRate: 45, rating: 4.8, reviewCount: 12, successRate: 98, skills: ["React", "Node.js", "PostgreSQL"], languages: ["English", "Amharic"], timezone: "UTC+3", availability: "AVAILABLE" },
          { freelancerId: "2", userId: "u2", name: "Sara Tadesse", professionalTitle: "UI/UX Designer", hourlyRate: 35, rating: 4.9, reviewCount: 8, successRate: 100, skills: ["Figma", "Tailwind", "Motion"], languages: ["English", "Amharic"], timezone: "UTC+3", availability: "AVAILABLE" },
        ],
        projectPosts: [
          { id: "p1", title: "E-commerce App Redesign", freelancerId: "2", freelancerName: "Sara T.", category: "Design", budgetMin: 1000, budgetMax: 2500, currency: "USD", deliveryDays: 14, skills: ["Figma", "UI Design"], status: "OPEN", postedAt: new Date().toISOString() },
        ],
        gigs: [
          { id: "g1", title: "Landing Page Development", freelancerId: "1", freelancerName: "Abebe K.", price: 500, currency: "USD", deliveryDays: 3, skills: ["Next.js", "Vercel"], status: "OPEN" },
        ],
        stories: [
          { id: "s1", title: "Fintech App Success Story", freelancerId: "1", freelancerName: "Abebe K.", description: "Helping a local bank digitize their payment systems.", imageUrls: ["/api/placeholder/400/400"], technologies: ["Java", "Spring Boot"], completedAt: new Date().toISOString() },
        ],
      };
      setResults(mockResults);
      setIsLoading(false);
    }, 1000);
  }, [deferredQuery, activeBoard, mediaFilter, sortBy, minBudget, maxBudget, minPrice, maxPrice]);

  return (
    <div className="space-y-1.5 p-4">
      {/* Reduced Command Board */}
      <section className="rounded-lg border border-gray-200/50 bg-white p-1.5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-950 text-white">
              <Sparkles className="h-3 w-3" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-gray-900 leading-none">Command board</h1>
              <p className="mt-0.5 text-[8px] text-gray-400 leading-none">Manage marketplace assets</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex h-6 items-center gap-1 rounded-md px-2 text-[9px] font-bold transition ${
                showFilters ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <SlidersHorizontal className="h-3 w-3" />
              {showFilters ? "Hide" : "Filter"}
            </button>
            <Link
              href={workspaceRoutes.home}
              className="inline-flex h-6 items-center rounded-md bg-gray-50 px-2 text-[9px] font-bold text-gray-600 hover:bg-gray-100"
            >
              Jobs
            </Link>
          </div>
        </div>

        <div className="mt-1.5 grid gap-1.5 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
            <input
              id="marketplace-search"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search..."
              className="h-8 w-full rounded-md border border-gray-100 bg-gray-50 pl-7 pr-2 text-[10px] text-gray-700 outline-none focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1">
            {boards.map((board) => (
              <button
                key={board.id}
                type="button"
                onClick={() => setActiveBoard(board.id)}
                className={`h-8 rounded-md px-2 text-[9px] font-bold transition ${
                  activeBoard === board.id
                    ? "bg-gray-950 text-white"
                    : "bg-white text-gray-400 border border-gray-100 hover:bg-gray-50"
                }`}
              >
                {board.label.slice(0, 1)}
              </button>
            ))}
          </div>
        </div>

        {showFilters && (
          <div className="mt-1.5 rounded-md border border-gray-100 bg-gray-50 p-1.5">
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
              <input
                type="text"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                placeholder="Category"
                className="h-7 w-full rounded-md border border-gray-200 bg-white px-2 text-[9px] outline-none"
              />
              <select
                value={mediaFilter}
                onChange={(event) => setMediaFilter(event.target.value as MarketplaceMediaFilter)}
                className="h-7 w-full rounded-md border border-gray-200 bg-white px-2 text-[9px] outline-none"
              >
                <option value="ALL">All media</option>
                <option value="VISUAL">Visual</option>
              </select>
              <input
                type="number"
                value={minBudget}
                onChange={(event) => setMinBudget(event.target.value)}
                placeholder="Min Budget"
                className="h-7 w-full rounded-md border border-gray-200 bg-white px-2 text-[9px] outline-none"
              />
              <input
                type="number"
                value={maxBudget}
                onChange={(event) => setMaxBudget(event.target.value)}
                placeholder="Max Budget"
                className="h-7 w-full rounded-md border border-gray-200 bg-white px-2 text-[9px] outline-none"
              />
            </div>
          </div>
        )}
      </section>

      {/* Grid 4 columns requested for Talent */}
      <div className="space-y-6 pt-4">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-[360px] rounded-3xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : (
          <>
            {results?.talents.length ? (
              <section>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Verified Intelligence</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {results.talents.map(talent => (
                    <TalentCard key={talent.freelancerId} talent={talent} viewMode={viewMode} onExploreSkill={setActiveSkill} />
                  ))}
                </div>
              </section>
            ) : null}

            {results?.projectPosts.length ? (
              <section>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Target className="h-4 w-4 text-purple-400" />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Project Operations</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {results.projectPosts.map(post => (
                    <ProjectPostCard key={post.id} post={post} viewMode={viewMode} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
