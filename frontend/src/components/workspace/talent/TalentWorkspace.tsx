"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  FolderOpen,
  FileText,
  Grid3X3,
  ImageIcon,
  LayoutList,
  MessageSquare,
  PlayCircle,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import {
  type MarketplaceSearchGig,
  type MarketplaceSearchProjectPost,
  type MarketplaceSearchResponse,
  type MarketplaceSearchStory,
  type MarketplaceSearchTalent,
  searchEmployerMarketplace,
} from "@/lib/api";
import { useSession } from "@/lib/session";
import { workspaceRoutes } from "@/lib/workspace-routes";
import { toast } from "sonner";

type BoardId = "all" | "talents" | "projects" | "gigs" | "stories";
type ViewMode = "grid" | "list";
type MarketplaceMediaFilter = "ALL" | "VISUAL" | "VIDEO" | "DOCUMENT";
type MarketplaceSort = "relevance" | "priceAsc" | "priceDesc" | "deliveryAsc";

type TalentFilterPreset = {
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
};

const TALENT_PRESETS_STORAGE_KEY = "workspace:talent-filter-presets";

const boardLabels: Record<BoardId, string> = {
  all: "All assets",
  talents: "Talents",
  projects: "Projects",
  gigs: "Gigs",
  stories: "Stories",
};

function formatCurrencyRange(min?: number, max?: number, currency?: string) {
  if (typeof min !== "number" && typeof max !== "number") {
    return "Budget on request";
  }

  const resolvedCurrency = currency ?? "USD";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: resolvedCurrency,
    maximumFractionDigits: 0,
  });

  if (typeof min === "number" && typeof max === "number") {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }

  if (typeof min === "number") {
    return `From ${formatter.format(min)}`;
  }

  return `Up to ${formatter.format(max ?? 0)}`;
}

function formatPrice(value?: number, currency?: string) {
  if (typeof value !== "number") {
    return "Custom pricing";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function MarketplaceMediaPreview({
  title,
  thumbnailUrl,
  imageUrls,
  videoUrls,
}: {
  title: string;
  thumbnailUrl?: string;
  imageUrls?: string[];
  videoUrls?: string[];
}) {
  const imageUrl = thumbnailUrl || imageUrls?.[0];
  const videoUrl = videoUrls?.[0];

  if (imageUrl) {
    return (
      <div className="overflow-hidden rounded-[22px] border border-gray-200 bg-gray-50">
        <img src={imageUrl} alt={title} className="h-40 w-full object-cover" loading="lazy" />
      </div>
    );
  }

  if (videoUrl) {
    return (
      <div className="overflow-hidden rounded-[22px] border border-gray-200 bg-black">
        <video src={videoUrl} className="h-40 w-full object-cover" controls preload="metadata" />
      </div>
    );
  }

  return (
    <div className="flex h-40 items-center justify-center rounded-[22px] border border-dashed border-gray-200 bg-gray-50 text-gray-400">
      <div className="text-center">
        <ImageIcon className="mx-auto h-5 w-5 text-gray-300" />
        <p className="mt-2 text-sm">No preview uploaded</p>
      </div>
    </div>
  );
}

function MediaChips({
  imageUrls,
  videoUrls,
  documentUrls,
}: {
  imageUrls?: string[];
  videoUrls?: string[];
  documentUrls?: string[];
}) {
  return (
    <>
      {(imageUrls?.length ?? 0) > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1">
          <ImageIcon className="h-3.5 w-3.5" />
          {(imageUrls?.length ?? 0)} images
        </span>
      ) : null}
      {(videoUrls?.length ?? 0) > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1">
          <PlayCircle className="h-3.5 w-3.5" />
          {(videoUrls?.length ?? 0)} videos
        </span>
      ) : null}
      {(documentUrls?.length ?? 0) > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1">
          <FileText className="h-3.5 w-3.5" />
          {(documentUrls?.length ?? 0)} files
        </span>
      ) : null}
    </>
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
  const displayName = talent.name?.trim() || "Freelancer";
        const primarySkill = talent.skills?.[0];
  const chatHref = talent.userId ? `/chat?user=${encodeURIComponent(talent.userId)}` : "/chat";
  const profileHref = talent.freelancerId
    ? workspaceRoutes.publicProfile("freelancer", talent.freelancerId)
    : null;
  const previewUrl = talent.profilePicture || talent.portfolioThumbnailUrl || talent.coverImage;
  const talentMediaPreview = talent.portfolioThumbnailUrl || talent.coverImage || talent.portfolioImageUrls?.[0];

  return (
    <article
      className={`group relative rounded-[22px] border border-gray-200/80 bg-white p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.1)] hover:border-gray-300/80 ${
        viewMode === "list" ? "lg:flex lg:items-center lg:justify-between lg:gap-5" : ""
      }`}
    >
      {/* Premium Badge/Case Indicator */}
      {talent.rating && talent.rating >= 4.5 ? (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 border border-amber-200/50">
          <Star className="h-3 w-3 fill-current" />
          Premium
        </div>
      ) : null}

      <div className={viewMode === "list" ? "flex-1" : ""}>
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 text-xs font-bold uppercase tracking-[0.12em] text-white ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all duration-300">
            {previewUrl ? (
              <img src={previewUrl} alt={displayName} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              displayName.slice(0, 2)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-sm font-semibold tracking-[-0.01em] text-gray-900 truncate">{displayName}</h3>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700 border border-blue-200/50 whitespace-nowrap">
                <ShieldCheck className="h-2.5 w-2.5" />
                Verified
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500 truncate">{talent.professionalTitle || "Freelancer"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
              <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
                <Star className="h-3 w-3 fill-current text-amber-500" />
                {typeof talent.rating === "number" ? talent.rating.toFixed(1) : "New"}
              </span>
              {(talent.portfolioImageUrls?.length ?? 0) > 0 ? (
                <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
                  <ImageIcon className="h-3 w-3" />
                  {talent.portfolioImageUrls?.length} works
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <MarketplaceMediaPreview
            title={displayName}
            thumbnailUrl={talentMediaPreview}
            imageUrls={talent.portfolioImageUrls}
          />
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {(talent.skills ?? []).slice(0, 4).map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => onExploreSkill(skill)}
              className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900"
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      <div className={`mt-3.5 flex flex-wrap gap-2 ${viewMode === "list" ? "lg:mt-0 lg:shrink-0 lg:justify-end" : ""}`}>
        {profileHref ? (
          <Link
            href={profileHref}
            className="inline-flex h-9 items-center rounded-full border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:border-gray-300"
          >
            Profile
          </Link>
        ) : null}
        <Link
          href={chatHref}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gray-950 px-3 text-xs font-semibold text-white transition hover:bg-gray-800"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Message
        </Link>
      </div>
    </article>
  );
}

function ProjectPostCard({
  post,
  viewMode,
}: {
  post: MarketplaceSearchProjectPost;
  viewMode: ViewMode;
}) {
  const chatHref = post.freelancerUserId ? `/chat?user=${encodeURIComponent(post.freelancerUserId)}` : "/chat";
  const profileHref = post.freelancerId
    ? workspaceRoutes.publicProfile("freelancer", post.freelancerId)
    : null;

  return (
    <article
      className={`group relative rounded-[20px] border border-gray-200/80 bg-white p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.1)] hover:border-gray-300/80 ${
        viewMode === "list" ? "lg:flex lg:items-start lg:justify-between lg:gap-5" : ""
      }`}
    >
      <div className={viewMode === "list" ? "flex-1" : ""}>
        <div className="mb-3">
          <MarketplaceMediaPreview
            title={post.title || "Project post"}
            thumbnailUrl={post.thumbnailUrl}
            imageUrls={post.sampleImageUrls}
            videoUrls={post.sampleVideoUrls}
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
          <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-purple-700 border border-purple-200/50">
            Project
          </span>
          <span className="text-gray-400">{post.category || "Uncategorized"}</span>
        </div>
        <h3 className="mt-2.5 text-base font-semibold tracking-[-0.01em] text-gray-900 line-clamp-2">
          {post.title || "Untitled project"}
        </h3>
        <p className="mt-1 text-xs text-gray-500">by {post.freelancerName || "Freelancer"}</p>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-600">
          {post.description || "No description published."}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {(post.skills ?? []).slice(0, 3).map((skill) => (
            <span key={skill} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className={`mt-3.5 flex flex-col gap-2 ${viewMode === "list" ? "lg:mt-0 lg:w-56 lg:shrink-0" : "w-full"}`}>
        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Budget</p>
          <p className="mt-1.5 text-sm font-semibold text-gray-900">
            {formatCurrencyRange(post.budgetMin, post.budgetMax, post.currency)}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {typeof post.deliveryDays === "number" ? `${post.deliveryDays}d delivery` : "Flexible timeline"}
          </p>
        </div>
        <Link
          href={chatHref}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-gray-950 px-3 text-xs font-semibold text-white transition hover:bg-gray-800"
        >
          Message
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        {profileHref ? (
          <Link
            href={profileHref}
            className="inline-flex h-9 w-full items-center justify-center rounded-full border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:border-gray-300"
          >
            Freelancer
          </Link>
        ) : null}
      </div>
    </article>
  );
}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:border-gray-300"
function GigCard({
  gig,
  viewMode,
}: {
  gig: MarketplaceSearchGig;
  viewMode: ViewMode;
}) {
            className="inline-flex h-9 w-full items-center justify-center rounded-full border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:border-gray-300"
  const profileHref = gig.freelancerId
    ? workspaceRoutes.publicProfile("freelancer", gig.freelancerId)
    : null;

  return (
    <article
      className={`group relative rounded-[20px] border border-gray-200/80 bg-white p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.1)] hover:border-gray-300/80 ${
        viewMode === "list" ? "lg:flex lg:items-start lg:justify-between lg:gap-5" : ""
      }`}
    >
      <div className={viewMode === "list" ? "flex-1" : ""}>
        <div className="mb-3">
          <MarketplaceMediaPreview
            title={gig.title || "Gig"}
            thumbnailUrl={gig.thumbnailUrl}
            imageUrls={gig.sampleImageUrls}
            videoUrls={gig.sampleVideoUrls}
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-green-700 border border-green-200/50">
            <BriefcaseBusiness className="h-2.5 w-2.5 mr-1" />
            Service
          </span>
        </div>
        <h3 className="mt-2.5 text-base font-semibold tracking-[-0.01em] text-gray-900 line-clamp-2">{gig.title || "Untitled gig"}</h3>
        <p className="mt-1 text-xs text-gray-500">by {gig.freelancerName || "Freelancer"}</p>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-600">
          {gig.description || "No service summary published."}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {(gig.skills ?? []).slice(0, 3).map((skill) => (
            <span key={skill} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className={`mt-3.5 flex flex-col gap-2 ${viewMode === "list" ? "lg:mt-0 lg:w-56 lg:shrink-0" : "w-full"}`}>
        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Price</p>
          <p className="mt-1.5 text-sm font-semibold text-gray-900">{formatPrice(gig.price, gig.currency)}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {typeof gig.deliveryDays === "number" ? `${gig.deliveryDays}d delivery` : "Flexible delivery"}
          </p>
        </div>
        <Link
          href={chatHref}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:border-gray-300"
        >
          Message
        </Link>
        {profileHref ? (
          <Link
            href={profileHref}
            className="inline-flex h-9 w-full items-center justify-center rounded-full border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:border-gray-300"
          >
            Seller
          </Link>
        ) : null}
      </div>
    </article>
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
  const profileHref = story.freelancerId
    ? workspaceRoutes.publicProfile("freelancer", story.freelancerId)
    : null;

  return (
    <article
      className={`rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.04)] ${
        viewMode === "list" ? "lg:flex lg:items-start lg:justify-between lg:gap-6" : ""
      }`}
    >
      <div className={viewMode === "list" ? "flex-1" : ""}>
        <div className="mb-4">
          <MarketplaceMediaPreview
            title={story.title || "Portfolio story"}
            thumbnailUrl={story.imageUrls?.[0]}
            imageUrls={story.imageUrls}
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
          <Sparkles className="h-4 w-4" />
          Portfolio story
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-gray-900">
          {story.title || "Untitled story"}
        </h3>
        <p className="mt-2 text-sm text-gray-500">by {story.freelancerName || "Freelancer"}</p>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600">
          {story.description || "No story description has been published yet."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(story.technologies ?? []).slice(0, 5).map((technology) => (
            <span key={technology} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
              {technology}
            </span>
          ))}
          {(story.imageUrls?.length ?? 0) > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-500">
              <ImageIcon className="h-3.5 w-3.5" />
              {story.imageUrls?.length} images
            </span>
          ) : null}
          {story.projectUrl ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-500">
              <FileText className="h-3.5 w-3.5" />
              Linked proof
            </span>
          ) : null}
        </div>
      </div>

      <div className={`mt-5 space-y-3 ${viewMode === "list" ? "lg:mt-0 lg:w-64 lg:shrink-0" : ""}`}>
        <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Story status</p>
          <p className="mt-2 text-sm font-semibold text-gray-900">Published</p>
          <p className="mt-1 text-xs text-gray-500">
            {story.completedAt ? `Completed ${new Date(story.completedAt).toLocaleDateString()}` : "Recent profile update"}
          </p>
        </div>
        {story.projectUrl ? (
          <a
            href={story.projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            <FileText className="h-4 w-4" />
            Open story link
          </a>
        ) : null}
        <Link
          href={chatHref}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
        >
          Message creator
        </Link>
        {profileHref ? (
          <Link
            href={profileHref}
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            Open creator profile
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export default function TalentWorkspace() {
  const role = useSession((state) => state.role);
  const [query, setQuery] = useState("");
  const [activeBoard, setActiveBoard] = useState<BoardId>("all");
  const [activeSkill, setActiveSkill] = useState<string>("");
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(TALENT_PRESETS_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setSavedPresets(parsed as TalentFilterPreset[]);
      }
    } catch {
      setSavedPresets([]);
    }
  }, []);

  const persistPresets = (next: TalentFilterPreset[]) => {
    setSavedPresets(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TALENT_PRESETS_STORAGE_KEY, JSON.stringify(next));
    }
  };

  const capturePreset = (name: string): TalentFilterPreset => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    query,
    activeSkill,
    categoryFilter,
    mediaFilter,
    sortBy,
    minBudget,
    maxBudget,
    minPrice,
    maxPrice,
  });

  const applyPreset = (preset: TalentFilterPreset) => {
    setQuery(preset.query);
    setActiveSkill(preset.activeSkill);
    setCategoryFilter(preset.categoryFilter);
    setMediaFilter(preset.mediaFilter);
    setSortBy(preset.sortBy);
    setMinBudget(preset.minBudget);
    setMaxBudget(preset.maxBudget);
    setMinPrice(preset.minPrice);
    setMaxPrice(preset.maxPrice);
  };

  const handleSavePreset = () => {
    const name = presetName.trim();
    if (!name) {
      return;
    }
    const next = [capturePreset(name), ...savedPresets].slice(0, 8);
    persistPresets(next);
    setPresetName("");
    setShowPresetInput(false);
    toast.success("Talent filter preset saved");
  };

  useEffect(() => {
    let active = true;

    const timer = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        const data = await searchEmployerMarketplace({
          q: deferredQuery.trim(),
          limit: 24,
          skill: activeSkill.trim() || undefined,
          category: categoryFilter.trim() || undefined,
          mediaFilter,
          minBudget: minBudget.trim() ? Number(minBudget) : undefined,
          maxBudget: maxBudget.trim() ? Number(maxBudget) : undefined,
          minPrice: minPrice.trim() ? Number(minPrice) : undefined,
          maxPrice: maxPrice.trim() ? Number(maxPrice) : undefined,
        });

        if (!active) {
          return;
        }

        startTransition(() => {
          setResults(data);
        });
      } catch (error) {
        if (active) {
          toast.error("Failed to load marketplace search results");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [
    activeSkill,
    categoryFilter,
    deferredQuery,
    maxBudget,
    maxPrice,
    mediaFilter,
    minBudget,
    minPrice,
  ]);

  const featuredSkills = useMemo(() => {
    const counts = new Map<string, number>();
    const talents = results?.talents ?? [];
    const projectPosts = results?.projectPosts ?? [];
    const gigs = results?.gigs ?? [];
    const stories = results?.stories ?? [];

    [
      ...talents.flatMap((talent) => talent.skills ?? []),
      ...projectPosts.flatMap((post) => post.skills ?? []),
      ...gigs.flatMap((gig) => gig.skills ?? []),
      ...stories.flatMap((story) => story.technologies ?? []),
    ].forEach((skill) => {
      if (!skill.trim()) {
        return;
      }

      counts.set(skill, (counts.get(skill) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 8)
      .map(([skill]) => skill);
  }, [results]);

  const filteredResults = useMemo(() => {
    const queryNeedle = deferredQuery.trim().toLowerCase();
    const skillNeedle = activeSkill.trim().toLowerCase();
    const categoryNeedle = categoryFilter.trim().toLowerCase();
    const minBudgetValue = minBudget.trim() ? Number(minBudget) : undefined;
    const maxBudgetValue = maxBudget.trim() ? Number(maxBudget) : undefined;
    const minPriceValue = minPrice.trim() ? Number(minPrice) : undefined;
    const maxPriceValue = maxPrice.trim() ? Number(maxPrice) : undefined;

    const matchesSkill = (skills?: string[]) =>
      !skillNeedle || (skills ?? []).some((skill) => skill.toLowerCase().includes(skillNeedle));

    const hasMedia = (images?: string[], videos?: string[], docs?: string[]) => {
      if (mediaFilter === "ALL") {
        return true;
      }
      if (mediaFilter === "VISUAL") {
        return (images?.length ?? 0) > 0 || (videos?.length ?? 0) > 0;
      }
      if (mediaFilter === "VIDEO") {
        return (videos?.length ?? 0) > 0;
      }
      return (docs?.length ?? 0) > 0;
    };

    const isPublished = (status?: string) => status === "PUBLISHED";

    const projectPosts = (results?.projectPosts ?? [])
      .filter((post) => isPublished(post.status))
      .filter((post) => {
        if (!queryNeedle) {
          return true;
        }
        const haystack = [
          post.title,
          post.description,
          post.category,
          post.freelancerName,
          ...(post.skills ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(queryNeedle);
      })
      .filter((post) => matchesSkill(post.skills))
      .filter((post) => !categoryNeedle || (post.category ?? "").toLowerCase().includes(categoryNeedle))
      .filter((post) => {
        if (typeof minBudgetValue !== "number" || Number.isNaN(minBudgetValue)) {
          return true;
        }
        const upper = typeof post.budgetMax === "number" ? post.budgetMax : post.budgetMin;
        return typeof upper === "number" && upper >= minBudgetValue;
      })
      .filter((post) => {
        if (typeof maxBudgetValue !== "number" || Number.isNaN(maxBudgetValue)) {
          return true;
        }
        const lower = typeof post.budgetMin === "number" ? post.budgetMin : post.budgetMax;
        return typeof lower === "number" && lower <= maxBudgetValue;
      })
      .filter((post) => hasMedia(post.sampleImageUrls, post.sampleVideoUrls, post.sampleDocumentUrls));

    const gigs = (results?.gigs ?? [])
      .filter((gig) => isPublished(gig.status))
      .filter((gig) => {
        if (!queryNeedle) {
          return true;
        }
        const haystack = [
          gig.title,
          gig.description,
          gig.freelancerName,
          ...(gig.skills ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(queryNeedle);
      })
      .filter((gig) => matchesSkill(gig.skills))
      .filter((gig) => {
        if (typeof minPriceValue !== "number" || Number.isNaN(minPriceValue)) {
          return true;
        }
        return typeof gig.price === "number" && gig.price >= minPriceValue;
      })
      .filter((gig) => {
        if (typeof maxPriceValue !== "number" || Number.isNaN(maxPriceValue)) {
          return true;
        }
        return typeof gig.price === "number" && gig.price <= maxPriceValue;
      })
      .filter((gig) => hasMedia(gig.sampleImageUrls, gig.sampleVideoUrls, gig.sampleDocumentUrls));

    const byPriceAsc = (left?: number, right?: number) => (left ?? Number.MAX_SAFE_INTEGER) - (right ?? Number.MAX_SAFE_INTEGER);
    const byPriceDesc = (left?: number, right?: number) => (right ?? 0) - (left ?? 0);
    const byDeliveryAsc = (left?: number, right?: number) => (left ?? Number.MAX_SAFE_INTEGER) - (right ?? Number.MAX_SAFE_INTEGER);

    const sortedProjectPosts = [...projectPosts];
    const sortedGigs = [...gigs];
    const stories = (results?.stories ?? [])
      .filter((story) => {
        if (!queryNeedle) {
          return true;
        }
        const haystack = [
          story.title,
          story.description,
          story.category,
          story.freelancerName,
          ...(story.technologies ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(queryNeedle);
      })
      .filter((story) => matchesSkill(story.technologies))
      .filter((story) => !categoryNeedle || (story.category ?? "").toLowerCase().includes(categoryNeedle))
      .filter((story) => hasMedia(story.imageUrls, undefined, story.projectUrl ? [story.projectUrl] : undefined));
    const sortedStories = [...stories];

    if (sortBy === "priceAsc") {
      sortedProjectPosts.sort((left, right) => byPriceAsc(left.budgetMin, right.budgetMin));
      sortedGigs.sort((left, right) => byPriceAsc(left.price, right.price));
    } else if (sortBy === "priceDesc") {
      sortedProjectPosts.sort((left, right) => byPriceDesc(left.budgetMax, right.budgetMax));
      sortedGigs.sort((left, right) => byPriceDesc(left.price, right.price));
    } else if (sortBy === "deliveryAsc") {
      sortedProjectPosts.sort((left, right) => byDeliveryAsc(left.deliveryDays, right.deliveryDays));
      sortedGigs.sort((left, right) => byDeliveryAsc(left.deliveryDays, right.deliveryDays));
    }

    return {
      talents: (results?.talents ?? [])
        .filter((talent) => {
          if (!queryNeedle) {
            return true;
          }
          const haystack = [
            talent.name,
            talent.professionalTitle,
            ...(talent.skills ?? []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(queryNeedle);
        })
        .filter((talent) => matchesSkill(talent.skills)),
      projectPosts: sortedProjectPosts,
      gigs: sortedGigs,
      stories: sortedStories,
    };
  }, [activeSkill, categoryFilter, deferredQuery, maxBudget, maxPrice, mediaFilter, minBudget, minPrice, results, sortBy]);

  const counts = useMemo(
    () => ({
      talents: filteredResults.talents.length,
      projectPosts: filteredResults.projectPosts.length,
      gigs: filteredResults.gigs.length,
      stories: filteredResults.stories.length,
    }),
    [filteredResults],
  );

  const totalVisible = counts.talents + counts.projectPosts + counts.gigs + counts.stories;
  const isEmployer = role === "EMPLOYER";

  const boards: Array<{ id: BoardId; label: string; count: number }> = [
    { id: "all", label: "All assets", count: totalVisible },
    { id: "talents", label: "Talents", count: counts.talents },
    { id: "projects", label: "Projects", count: counts.projectPosts },
    { id: "gigs", label: "Gigs", count: counts.gigs },
    { id: "stories", label: "Stories", count: counts.stories },
  ];

  return (
    <div className="space-y-3">
      <section className="rounded-[24px] border border-gray-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,247,250,0.94))] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              <Sparkles className="h-3.5 w-3.5" />
              AI talent discovery
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-gray-900">Marketplace command board</h1>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-gray-500">
                Search real marketplace inventory across talents, published projects, gigs, and portfolio stories without breaking the existing backend or workspace performance model.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={workspaceRoutes.home}
              className="inline-flex h-10 items-center rounded-full border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-900 transition hover:bg-gray-100"
            >
              Open jobs board
            </Link>
            <Link
              href={isEmployer ? workspaceRoutes.createJob : workspaceRoutes.wallet}
              className="inline-flex h-10 items-center rounded-full bg-gray-950 px-4 text-xs font-semibold text-white transition hover:bg-gray-800"
            >
              {isEmployer ? "Create enterprise brief" : "Review earnings"}
            </Link>
          </div>
        </div>

        <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
          <div className="rounded-[20px] border border-gray-100 bg-white p-3.5">
            <label htmlFor="marketplace-search" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
              Search the directory
            </label>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="marketplace-search"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by freelancer name, skill, project post, or gig"
                className="h-12 w-full rounded-[22px] border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm text-gray-700 outline-none transition focus:border-gray-300 focus:bg-white"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {featuredSkills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => setActiveSkill((current) => (current === skill ? "" : skill))}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    activeSkill === skill
                      ? "bg-gray-950 text-white"
                        : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {skill}
                </button>
              ))}
              {featuredSkills.length === 0 ? (
                <span className="rounded-full border border-dashed border-gray-200 px-3 py-1.5 text-xs text-gray-400">
                  Skill clusters will appear once results load
                </span>
              ) : null}
            </div>

            <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters like Jobs
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <label className="text-xs text-gray-500">
                  Project category
                  <input
                    type="text"
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    placeholder="Design, Web, Mobile..."
                    className="mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-gray-300"
                  />
                </label>

                <label className="text-xs text-gray-500">
                  Media filter
                  <select
                    value={mediaFilter}
                    onChange={(event) => setMediaFilter(event.target.value as MarketplaceMediaFilter)}
                    className="mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-gray-300"
                  >
                    <option value="ALL">All media</option>
                    <option value="VISUAL">Image or video</option>
                    <option value="VIDEO">Video only</option>
                    <option value="DOCUMENT">Document only</option>
                  </select>
                </label>

                <label className="text-xs text-gray-500">
                  Sort by
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as MarketplaceSort)}
                    className="mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-gray-300"
                  >
                    <option value="relevance">Best match</option>
                    <option value="priceAsc">Price low to high</option>
                    <option value="priceDesc">Price high to low</option>
                    <option value="deliveryAsc">Fastest delivery</option>
                  </select>
                </label>

                <label className="text-xs text-gray-500">
                  Project budget min
                  <input
                    type="number"
                    min={0}
                    value={minBudget}
                    onChange={(event) => setMinBudget(event.target.value)}
                    placeholder="0"
                    className="mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-gray-300"
                  />
                </label>

                <label className="text-xs text-gray-500">
                  Project budget max
                  <input
                    type="number"
                    min={0}
                    value={maxBudget}
                    onChange={(event) => setMaxBudget(event.target.value)}
                    placeholder="5000"
                    className="mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-gray-300"
                  />
                </label>

                <label className="text-xs text-gray-500">
                  Gig price min
                  <input
                    type="number"
                    min={0}
                    value={minPrice}
                    onChange={(event) => setMinPrice(event.target.value)}
                    placeholder="0"
                    className="mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-gray-300"
                  />
                </label>

                <label className="text-xs text-gray-500 sm:col-span-2 xl:col-span-1">
                  Gig price max
                  <input
                    type="number"
                    min={0}
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                    placeholder="5000"
                    className="mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-gray-300"
                  />
                </label>
              </div>

              <div className="mt-3 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Filter presets</p>

                {savedPresets.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {savedPresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-xs font-medium text-gray-600 transition hover:bg-gray-100"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        <span className="truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                {showPresetInput ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={presetName}
                      onChange={(event) => setPresetName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleSavePreset();
                        }
                      }}
                      placeholder="Preset name"
                      className="h-10 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-gray-300"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSavePreset}
                        className="inline-flex h-10 items-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPresetInput(false);
                          setPresetName("");
                        }}
                        className="inline-flex h-10 items-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPresetInput(true)}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save current filters
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[20px] border border-gray-100 bg-white p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Talents</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-gray-900">{counts.talents}</p>
              <p className="mt-1 text-xs text-gray-500">Qualified profiles surfaced for this search</p>
            </div>
            <div className="rounded-[20px] border border-gray-100 bg-white p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Projects</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-gray-900">{counts.projectPosts}</p>
              <p className="mt-1 text-xs text-gray-500">Published project posts currently visible</p>
            </div>
            <div className="rounded-[20px] border border-gray-100 bg-white p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Gigs</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-gray-900">{counts.gigs}</p>
              <p className="mt-1 text-xs text-gray-500">Packaged service offers with live commercial terms</p>
            </div>
            <div className="rounded-[20px] border border-gray-100 bg-white p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Stories</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-gray-900">{counts.stories}</p>
              <p className="mt-1 text-xs text-gray-500">Published portfolio stories and proof-of-work entries</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[20px] border border-gray-200/80 bg-white p-3 shadow-[0_12px_28px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {boards.map((board) => (
              <button
                key={board.id}
                type="button"
                onClick={() => setActiveBoard(board.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  activeBoard === board.id
                    ? "bg-gray-950 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {board.label} ({board.count})
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveSkill("");
                setCategoryFilter("");
                setMediaFilter("ALL");
                setSortBy("relevance");
                setMinBudget("");
                setMaxBudget("");
                setMinPrice("");
                setMaxPrice("");
              }}
              className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
            >
              Clear all filters
            </button>
            <button
              type="button"
              onClick={() => setActiveSkill("")}
              className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
            >
              {activeSkill ? `Clear ${activeSkill}` : "Clear skill filter"}
            </button>
            <div className="flex items-center gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-xl p-1.5 transition ${viewMode === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                aria-label="Grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-xl p-1.5 transition ${viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                aria-label="List view"
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((row) => (
            <div key={row} className="rounded-[28px] border border-gray-200/80 bg-white p-5">
              <LoadingSkeleton rows={4} />
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && totalVisible === 0 ? (
        <section className="rounded-[32px] border border-dashed border-gray-200 bg-white p-10 text-center shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            {boardLabels[activeBoard]}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-gray-900">No marketplace matches</h2>
          <p className="mt-2 text-sm text-gray-500">
            Try a broader search term or clear the active skill cluster to expand the result set.
          </p>
        </section>
      ) : null}

      {!isLoading && totalVisible > 0 ? (
        <div className="space-y-4">
          {(activeBoard === "all" || activeBoard === "talents") && counts.talents > 0 ? (
            <section className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Talent listing</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-gray-900">Freelancer discovery</h2>
                </div>
                <p className="text-sm text-gray-500">
                  {counts.talents} profiles surfaced{activeSkill ? ` for ${activeSkill}` : ""}.
                </p>
              </div>
              <div className={viewMode === "grid" ? "grid gap-3 xl:grid-cols-2" : "space-y-3"}>
                {filteredResults.talents.map((talent) => (
                  <TalentCard
                    key={`${talent.freelancerId ?? "talent"}-${talent.userId ?? talent.name ?? "profile"}`}
                    talent={talent}
                    viewMode={viewMode}
                    onExploreSkill={(skill) => {
                      setActiveBoard("talents");
                      setActiveSkill(skill);
                    }}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {(activeBoard === "all" || activeBoard === "projects") && counts.projectPosts > 0 ? (
            <section className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Project flow</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-gray-900">Published projects</h2>
                </div>
                <p className="text-sm text-gray-500">
                  {counts.projectPosts} appraisable project opportunities in this search window.
                </p>
              </div>
              <div className={viewMode === "grid" ? "grid gap-3 xl:grid-cols-2" : "space-y-3"}>
                {filteredResults.projectPosts.map((post) => (
                  <ProjectPostCard
                    key={post.projectPostId ?? `${post.title ?? "project"}-${post.freelancerId ?? "owner"}`}
                    post={post}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {(activeBoard === "all" || activeBoard === "gigs") && counts.gigs > 0 ? (
            <section className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Service catalog</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-gray-900">Packaged gigs</h2>
                </div>
                <p className="text-sm text-gray-500">
                  {counts.gigs} delivery-ready offers with pricing and timeline context.
                </p>
              </div>
              <div className={viewMode === "grid" ? "grid gap-3 xl:grid-cols-2" : "space-y-3"}>
                {filteredResults.gigs.map((gig) => (
                  <GigCard
                    key={gig.gigId ?? `${gig.title ?? "gig"}-${gig.freelancerId ?? "owner"}`}
                    gig={gig}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {(activeBoard === "all" || activeBoard === "stories") && counts.stories > 0 ? (
            <section className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Portfolio stories</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-gray-900">Published stories</h2>
                </div>
                <p className="text-sm text-gray-500">
                  {counts.stories} portfolio stories connected to real freelancer profiles.
                </p>
              </div>
              <div className={viewMode === "grid" ? "grid gap-3 xl:grid-cols-2" : "space-y-3"}>
                {filteredResults.stories.map((story) => (
                  <StoryCard
                    key={story.storyId ?? `${story.title ?? "story"}-${story.freelancerId ?? "owner"}`}
                    story={story}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
