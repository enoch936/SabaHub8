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
  const employerProfileHref = job.employerId
    ? workspaceRoutes.publicProfile("employer", job.employerId)
    : null;
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

  const locationSignal = useMemo(() => {
    if (job.isRemote) {
      return { label: "Global match", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }

    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (job.timezone && browserTimezone.toLowerCase().includes(job.timezone.toLowerCase().replace("utc", ""))) {
      return { label: "Timezone fit", tone: "bg-blue-50 text-blue-700 border-blue-200" };
    }

    return { label: "Location review", tone: "bg-amber-50 text-amber-700 border-amber-200" };
  }, [job.isRemote, job.timezone]);

  const handleVoiceSave = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as Window & {
        SpeechRecognition?: new () => SpeechRecognitionInstance;
        webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
      })
        .SpeechRecognition ??
      (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onSave(job.id);
      toast.success("Saved the job. Voice save is not supported in this browser, so the command ran instantly.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;
    recognition.interimResults = false;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.toLowerCase() ?? "";
      if (transcript.includes("save")) {
        onSave(job.id);
        toast.success("Voice save completed");
      } else {
        toast.info('Say "save this job" to store the brief quickly.');
      }
    };

    recognition.onerror = () => {
      toast.error("Voice save could not start");
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const actionButtons = (
    <div className="flex flex-col gap-1.5 w-full">
      <button
        type="button"
        onClick={() => onApply(job)}
        className="w-full inline-flex items-center justify-center gap-0.5 rounded-lg bg-gray-950 px-2 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
      >
        <Send className="h-3 w-3" />
        Apply Now
      </button>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="w-full inline-flex items-center justify-center gap-0.5 rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? "Less" : "Details"}
      </button>
      <button
        type="button"
        onClick={() => onMessage?.(job)}
        className="w-full inline-flex items-center justify-center gap-0.5 rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
      >
        <MessageSquare className="h-3 w-3" />
        Contact
      </button>
      {onDelete ? (
        <button
          type="button"
          onClick={() => onDelete(job.id)}
          className="w-full inline-flex items-center justify-center gap-0.5 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      ) : null}
    </div>
  );

  if (viewMode === "list") {
    return (
      <div className="group bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden flex">
        {/* LEFT 70% - Image + Content */}
        <div className="w-[70%] flex">
          {/* Image Section */}
          <div className="w-32 h-32 flex-shrink-0">
            {activeMedia ? (
              <div className="relative w-full h-full overflow-hidden bg-[var(--accent)] transition duration-200 group-hover:scale-105">
                {activeMedia.kind === "image" ? (
                  <img
                    src={activeMedia.url}
                    alt={`${job.title} media`}
                    className="w-full h-full object-cover transition duration-200"
                    loading="lazy"
                  />
                ) : (
                  <video
                    src={activeMedia.url}
                    poster={activeVideoPoster}
                    preload="metadata"
                    className="w-full h-full object-cover bg-black"
                  />
                )}

                {totalMedia > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setMediaIndex((prev) => (prev - 1 + totalMedia) % totalMedia)}
                      className="absolute left-0.5 top-1/2 -translate-y-1/2 rounded-full bg-white/70 p-0.5 text-gray-700 hover:bg-white"
                      aria-label="Previous media"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaIndex((prev) => (prev + 1) % totalMedia)}
                      className="absolute right-0.5 top-1/2 -translate-y-1/2 rounded-full bg-white/70 p-0.5 text-gray-700 hover:bg-white"
                      aria-label="Next media"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <PlayCircle className="h-6 w-6 text-gray-300" />
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 p-3 flex flex-col justify-between">
            {/* Top */}
            <div>
              {/* Posted + Save */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="text-[10px] text-gray-600">
                  Posted {job.postedTime || "1 hour ago"} • Proposals: {job.proposalCount || "5 to 10"}
                </div>
                <button
                  type="button"
                  onClick={() => onSave(job.id)}
                  className={`p-0.5 transition flex-shrink-0 ${
                    job.isSaved
                      ? "text-red-500 hover:text-red-600"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                  aria-label={job.isSaved ? "Unsave job" : "Save job"}
                >
                  <Heart className={`h-4 w-4 ${job.isSaved ? "fill-current" : ""}`} />
                </button>
              </div>

              {/* Title - Green */}
              <h3 className="text-sm font-bold text-green-600 mb-0.5 line-clamp-2 hover:underline cursor-pointer">
                {job.title}
              </h3>

              {/* Budget + Level + Type */}
              <div className="text-[10px] text-gray-600 mb-1.5">
                {job.budget.type === "FIXED" ? "Fixed-price" : "Hourly"} • {job.level || "Intermediate"} • Est. Budget: {job.budget.type === "FIXED"
                  ? `$${(job.budget.min / 1000).toFixed(0)}k - $${(job.budget.max / 1000).toFixed(0)}k`
                  : `$${job.budget.min}-$${job.budget.max}/hr`}
              </div>

              {/* Description + More */}
              <p className="text-xs text-gray-700 leading-snug">
                {expanded ? job.description : `${job.description.substring(0, 150)}...`}
                {job.description.length > 150 && (
                  <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="text-blue-600 hover:underline font-semibold ml-1"
                  >
                    {expanded ? "less" : "more"}
                  </button>
                )}
              </p>

              {/* Skills */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {job.skills.slice(0, 4).map((skill) => (
                  <span key={skill} className="inline-block bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[9px] font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="flex items-center gap-1.5 text-[9px] text-gray-600 border-t border-gray-200 pt-1.5">
              {job.employerVerified && (
                <div className="flex items-center gap-0.5">
                  <CheckCircle className="h-3 w-3 text-blue-500" />
                  <span className="font-medium">Verified</span>
                </div>
              )}
              {job.employerRating && (
                <span className="text-orange-500 font-medium">⭐⭐⭐⭐⭐</span>
              )}
              {job.employerSpending && (
                <span className="font-medium">{job.employerSpending}+ spent</span>
              )}
              {job.employerLocation && (
                <div className="flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  <span>{job.employerLocation}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT 30% - Empty White Space */}
        <div className="w-[30%] bg-gradient-to-l from-gray-50 to-white" />
      </div>
    );
  }

  return (
    <div
      className={`group rounded-[12px] bg-white overflow-hidden shadow-sm hover:shadow-lg transition`}
    >
      <div className={`flex flex-col`}>
        <div>
          {activeMedia ? (
            <div className="relative overflow-hidden bg-[var(--accent)] transition duration-200 group-hover:shadow-md">
              {activeMedia.kind === "image" ? (
                <img
                  src={activeMedia.url}
                  alt={`${job.title} media ${mediaIndex + 1}`}
                  className={`w-full h-32 object-cover transition duration-200 group-hover:scale-105`}
                  loading="lazy"
                />
              ) : (
                <video
                  src={activeMedia.url}
                  poster={activeVideoPoster}
                  controls
                  preload="metadata"
                  className={`w-full h-32 object-cover bg-black`}
                />
              )}

              {totalMedia > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMediaIndex((prev) => (prev - 1 + totalMedia) % totalMedia)}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-gray-700 shadow-sm hover:bg-white"
                    aria-label="Previous media"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaIndex((prev) => (prev + 1) % totalMedia)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-gray-700 shadow-sm hover:bg-white"
                    aria-label="Next media"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : null}

              <button
                type="button"
                onClick={() => onSave(job.id)}
                className="absolute right-2 top-2 rounded-full p-1.5 transition"
                aria-label={job.isSaved ? "Unsave job" : "Save job"}
              >
                <Bookmark className={`h-4 w-4 ${job.isSaved ? "fill-red-500 text-red-500" : "fill-white text-white drop-shadow"}`} />
              </button>
            </div>
          ) : (
            <div
              className={`bg-gray-50/90 h-32 flex items-center justify-center`}
            >
              <div className="text-center">
                <PlayCircle className="mx-auto h-5 w-5 text-gray-300" />
              </div>
            </div>
          )}
        </div>

        <div className="p-3">
          <div>
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold leading-tight text-gray-900 line-clamp-2 text-xs">
                  {job.title}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <span className="text-[8px] text-slate-700 bg-white border border-gray-200 inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 font-medium">
                    {job.budget.type === "FIXED"
                      ? `$${(job.budget.min / 1000).toFixed(0)}k - $${(job.budget.max / 1000).toFixed(0)}k`
                      : `$${job.budget.min}/hr`}
                  </span>
                  {job.employerVerified && <CheckCircle className="h-3.5 w-3.5 text-blue-500" />}
                </div>
                <p className="mt-1 font-semibold text-gray-700 text-[11px]">
                  {job.employerName}
                </p>
                <div className="mt-1 flex items-center gap-1 text-gray-500 text-[10px]">
                  <Users className="h-3.5 w-3.5" />
                  {job.applicantCount} applied
                </div>
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-1.5">
              {actionButtons}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
