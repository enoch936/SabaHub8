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
      <div className="group bg-white rounded-lg shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-5">
          {/* Top Meta Row: Posted time, Proposals, Icons */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span>Posted {job.postedTime || "1 hour ago"}</span>
              <span>•</span>
              <span>Proposals: {job.proposalCount || "5 to 10"}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-1.5 text-gray-400 hover:text-gray-600 transition"
                aria-label="Not interested"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 15l6-6 6 6M6 9l6-6 6 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onSave(job.id)}
                className={`p-1.5 transition ${
                  job.isSaved
                    ? "text-red-500 hover:text-red-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                aria-label={job.isSaved ? "Unsave job" : "Save job"}
              >
                <Heart className={`h-4 w-4 ${job.isSaved ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
            {job.title}
          </h3>

          {/* Budget, Level, Type */}
          <div className="flex items-center gap-2 mb-3 text-xs text-gray-700">
            <span className="font-medium">{job.budget.type === "FIXED" ? "Fixed-price" : "Hourly"}</span>
            <span>•</span>
            <span>{job.level || "Intermediate"}</span>
            <span>•</span>
            <span>Est. Budget: {job.budget.type === "FIXED"
              ? `$${(job.budget.min / 1000).toFixed(0)}k - $${(job.budget.max / 1000).toFixed(0)}k`
              : `$${job.budget.min}-$${job.budget.max}/hr`}</span>
          </div>

          {/* Description - 2-3 lines */}
          <p className="text-sm text-gray-700 mb-3 line-clamp-3 leading-relaxed">
            {job.description}
          </p>

          {/* Skills Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {job.skills.slice(0, 6).map((skill) => (
              <span key={skill} className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                {skill}
              </span>
            ))}
          </div>

          {/* Bottom Meta Row */}
          <div className="flex items-center gap-3 text-xs text-gray-600 border-t border-gray-100 pt-3">
            {job.employerVerified && (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                <span>Payment verified</span>
              </div>
            )}
            {job.employerRating && (
              <div className="flex items-center gap-1">
                <span>⭐ {job.employerRating}</span>
              </div>
            )}
            {job.employerSpending && (
              <span>{job.employerSpending}+ spent</span>
            )}
            {job.employerLocation && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{job.employerLocation}</span>
              </div>
            )}
          </div>

          {/* Action Buttons - Bottom */}
          <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => onApply(job)}
              className="px-4 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded hover:bg-gray-800 transition"
            >
              Apply Now
            </button>
            <button
              type="button"
              onClick={() => onMessage?.(job)}
              className="px-4 py-1.5 border border-gray-300 bg-white text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition"
            >
              Message
            </button>
          </div>
        </div>

        {/* Right Sidebar - 30% White Space */}
        <div className="hidden lg:block lg:absolute lg:right-0 lg:top-0 lg:bottom-0 lg:w-1/3 bg-gradient-to-l from-gray-50 to-transparent" />
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
