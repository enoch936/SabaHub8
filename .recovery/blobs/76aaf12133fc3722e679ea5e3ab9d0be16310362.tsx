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
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onApply(job)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-gray-950 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
      >
        <Send className="h-3.5 w-3.5" />
        Apply
      </button>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        View
      </button>
      <button
        type="button"
        onClick={() => onMessage?.(job)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        Contact
      </button>
      {onDelete ? (
        <button
          type="button"
          onClick={() => onDelete(job.id)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      ) : null}
    </div>
  );

  return (
    <div
      className={`group rounded-[20px] bg-transparent transition ${
        viewMode === "list" ? "p-2.5" : "p-2.5"
      }`}
    >
      <div className={`gap-2.5 ${viewMode === "list" ? "flex flex-col xl:flex-row" : "flex flex-col"}`}>
        <div className={viewMode === "list" ? "xl:w-[80px] xl:flex-shrink-0" : ""}>
          {activeMedia ? (
            <div className="relative overflow-hidden rounded-[12px] bg-[var(--accent)] shadow-[0_6px_16px_rgba(15,23,42,0.04)] transition duration-200 group-hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
              {activeMedia.kind === "image" ? (
                <img
                  src={activeMedia.url}
                  alt={`${job.title} media ${mediaIndex + 1}`}
                  className={`w-full object-cover transition duration-200 group-hover:scale-[1.01] ${viewMode === "list" ? "h-16 w-20" : "h-16 w-20"}`}
                  loading="lazy"
                />
              ) : (
                <video
                  src={activeMedia.url}
                  poster={activeVideoPoster}
                  controls
                  preload="metadata"
                  className={`w-full object-cover bg-black ${viewMode === "list" ? "h-16 w-20" : "h-16 w-20"}`}
                />
              )}

              {totalMedia > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMediaIndex((prev) => (prev - 1 + totalMedia) % totalMedia)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 shadow-sm"
                    aria-label="Previous media"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaIndex((prev) => (prev + 1) % totalMedia)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 shadow-sm"
                    aria-label="Next media"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              ) : null}
            </div>
          ) : (
            <div
              className={`rounded-[12px] bg-gray-50/90 h-16 w-20 flex items-center justify-center`}
            >
              <div className="text-center">
                <PlayCircle className="mx-auto h-3 w-3 text-gray-300" />
              </div>
            </div>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-gray-500">
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                {job.aiMatchScore !== undefined ? <AIMatchBadge score={job.aiMatchScore} /> : null}
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-medium text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
                  {job.budget.type}
                </span>
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium shadow-[0_4px_12px_rgba(15,23,42,0.03)] ${locationSignal.tone}`}>
                  {locationSignal.label}
                </span>
              </div>
              <h3 className="text-sm font-semibold leading-tight text-gray-900 transition group-hover:underline group-hover:decoration-slate-300 group-hover:underline-offset-2">
                {job.title}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                {employerProfileHref ? (
                  <Link
                    href={employerProfileHref}
                    className="inline-flex items-center gap-0.5 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-medium text-gray-700 shadow-[0_4px_12px_rgba(15,23,42,0.03)] transition hover:bg-gray-50"
                  >
                    <Building2 className="h-2.5 w-2.5" />
                    {job.employerName}
                    {job.employerVerified ? <CheckCircle className="h-3 w-3 text-blue-500" /> : null}
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-medium text-gray-700 shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
                    <Building2 className="h-2.5 w-2.5" />
                    {job.employerName}
                    {job.employerVerified ? <CheckCircle className="h-3 w-3 text-blue-500" /> : null}
                  </span>
                )}
                <span className="inline-flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {job.workLocation ?? job.locationLabel ?? "Remote"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleVoiceSave}
                className={`rounded-lg border px-2 py-1.5 text-[10px] font-medium transition ${
                  isListening
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-[var(--border)] bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  <Mic className="h-2.5 w-2.5" />
                  {isListening ? "..." : "Save"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onSave(job.id)}
                className={`rounded-lg border p-1.5 transition ${
                  job.isSaved
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-[var(--border)] bg-white text-gray-500 hover:bg-gray-50"
                }`}
                aria-label={job.isSaved ? "Unsave job" : "Save job"}
              >
                <Bookmark className={`h-3.5 w-3.5 ${job.isSaved ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-2">
            <div className="rounded-[14px] bg-white px-2 py-1.5 shadow-[0_6px_14px_rgba(15,23,42,0.02)]">
              <p className="text-[9px] uppercase tracking-[0.14em] text-gray-400">Budget</p>
              <p className="mt-0.5 text-xs font-semibold text-gray-900">
                {job.budget.type === "FIXED"
                  ? `$${(job.budget.min / 1000).toFixed(0)}k - $${(job.budget.max / 1000).toFixed(0)}k`
                  : `$${job.budget.min}/hr`}
              </p>
            </div>
            <div className="rounded-[14px] bg-white px-2 py-1.5 shadow-[0_6px_14px_rgba(15,23,42,0.02)]">
              <p className="text-[9px] uppercase tracking-[0.14em] text-gray-400">Applicants</p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-gray-900">
                <Users className="h-3 w-3 text-gray-500" />
                {job.applicantCount}
              </p>
            </div>
          </div>

          <div className="mt-1.5 flex flex-wrap gap-1">
            {job.skills.slice(0, expanded ? job.skills.length : 3).map((skill) => (
              <span key={skill} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                {skill}
              </span>
            ))}
          </div>

          <div className="mt-1.5 hidden xl:block">
            <p className={`text-xs leading-4 text-gray-600 ${expanded ? "" : "line-clamp-1"}`}>{job.description.slice(0, 120)}...</p>
          </div>

          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
              <span>Proposal load</span>
              <span>{applicantPct}% of queue target</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-gray-900" style={{ width: `${applicantPct}%` }} />
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            {actionButtons}
            <div className="text-xs text-gray-400">Saved in your workspace.</div>
          </div>
        </div>
      </div>
    </div>
  );
});
