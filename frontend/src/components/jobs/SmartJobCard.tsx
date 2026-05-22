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

  const prevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMediaIndex(prev => (prev - 1 + totalMedia) % totalMedia);
  };

  if (viewMode === "list") {
    return (
      <div
        className="group relative rounded-[24px] backdrop-blur-md bg-white/40 border border-white/20 shadow-sm transition-all duration-300 hover:bg-gray-100/50 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] hover:border-white/40 p-5 cursor-pointer flex items-start justify-between gap-6"
        onClick={() => {}}
      >
        <div className="flex items-start gap-5 flex-1 min-w-0">
          <div className="h-20 w-20 rounded-2xl bg-gray-950 flex items-center justify-center text-white shrink-0 shadow-xl overflow-hidden border border-white/20">
            {activeMedia && activeMedia.kind === 'image' ? (
              <img src={activeMedia.url} className="w-full h-full object-cover" alt="Job" />
            ) : (
              <Building2 className="h-8 w-8 text-gray-500/50" />
            )}
          </div>
          <div className="flex-1 min-w-0 py-1">
            <div className="flex items-center gap-3 mb-1.5">
              <h3 className="font-black text-gray-950 text-lg truncate tracking-tight group-hover:text-indigo-600 transition-colors">
                {job.title}
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
                {job.status}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
              <div className="flex items-center gap-1.5 text-gray-900">
                <Building2 className="h-3.5 w-3.5" />
                {job.budget.type === "FIXED" ? `$${(job.budget.min / 1000).toFixed(0)}k+` : `$${job.budget.min}/hr`}
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                <span className="truncate">{job.employerName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                <span>{job.isRemote ? "Remote" : job.workLocation ?? "On-site"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>{job.applicantCount} Applicants</span>
              </div>
            </div>

            <p className="text-[13px] text-gray-600 font-medium line-clamp-2 leading-relaxed mb-4 max-w-4xl">
              {job.description}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {job.skills.slice(0, 6).map(skill => (
                <span key={skill} className="text-[9px] font-black px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 uppercase tracking-tight">
                  {skill}
                </span>
              ))}
              {job.skills.length > 6 && (
                <span className="text-[9px] font-black px-3 py-1 rounded-lg bg-gray-50 border border-gray-100 text-gray-400 uppercase tracking-tight">
                  +{job.skills.length - 6}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 self-center opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
          <button
            onClick={(e) => { e.stopPropagation(); onApply(job); }}
            className="h-11 px-6 rounded-2xl bg-gray-950 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Apply
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
            className="h-11 px-6 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/30 text-gray-800 transition-all active:scale-95 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-2"
          >
            Detailed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group rounded-[28px] bg-transparent transition ${
        viewMode === "list" ? "p-5" : "p-4"
      }`}
    >
      <div className={`gap-5 ${viewMode === "list" ? "flex flex-col xl:flex-row" : "flex flex-col"}`}>
        <div className={viewMode === "list" ? "xl:w-[320px] xl:flex-shrink-0" : ""}>
          {activeMedia ? (
            <div className="relative overflow-hidden rounded-[22px] bg-[var(--accent)] shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition duration-200 group-hover:shadow-[0_24px_56px_rgba(15,23,42,0.14)]">
              {activeMedia.kind === "image" ? (
                <img
                  src={activeMedia.url}
                  alt={`${job.title} media ${mediaIndex + 1}`}
                  className={`w-full object-cover transition duration-200 group-hover:scale-[1.01] ${viewMode === "list" ? "h-52" : "h-44"}`}
                  loading="lazy"
                />
              ) : (
                <video
                  src={activeMedia.url}
                  poster={activeVideoPoster}
                  controls
                  preload="metadata"
                  className={`w-full object-cover bg-black ${viewMode === "list" ? "h-52" : "h-44"}`}
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
              className={`rounded-[22px] bg-gray-50/90 ${
                viewMode === "list" ? "h-52" : "h-44"
              } flex items-center justify-center`}
            >
              <div className="text-center">
                <PlayCircle className="mx-auto h-6 w-6 text-gray-300" />
                <p className="mt-2 text-sm text-gray-400">No media</p>
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {(job.sampleImageUrls?.length ?? 0) > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
                <PlayCircle className="h-3.5 w-3.5" />
                {(job.sampleImageUrls ?? []).length} images
              </span>
            ) : null}
            {(job.sampleVideoUrls?.length ?? 0) > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
                <Video className="h-3.5 w-3.5" />
                {(job.sampleVideoUrls ?? []).length} videos
              </span>
            ) : null}
            {(job.sampleDocumentUrls?.length ?? 0) > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
                <FileText className="h-3.5 w-3.5" />
                {(job.sampleDocumentUrls ?? []).length} files
              </span>
            ) : null}
            {(job.sampleAudioUrls?.length ?? 0) > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
                <Waves className="h-3.5 w-3.5" />
                {(job.sampleAudioUrls ?? []).length} audio
              </span>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {job.aiMatchScore !== undefined ? <AIMatchBadge score={job.aiMatchScore} /> : null}
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
                  {job.budget.type}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium shadow-[0_8px_20px_rgba(15,23,42,0.05)] ${locationSignal.tone}`}>
                  {locationSignal.label}
                </span>
              </div>
              <h3 className="text-lg font-semibold leading-snug text-gray-900 transition group-hover:underline group-hover:decoration-slate-300 group-hover:underline-offset-4">
                {job.title}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                {employerProfileHref ? (
                  <Link
                    href={employerProfileHref}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:bg-gray-50"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    {job.employerName}
                    {job.employerVerified ? <CheckCircle className="h-4 w-4 text-blue-500" /> : null}
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
                    <Building2 className="h-3.5 w-3.5" />
                    {job.employerName}
                    {job.employerVerified ? <CheckCircle className="h-4 w-4 text-blue-500" /> : null}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.workLocation ?? job.locationLabel ?? "Remote"}
                </span>
                <span>{new Date(job.postedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleVoiceSave}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  isListening
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-[var(--border)] bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Mic className="h-3.5 w-3.5" />
                  {isListening ? "Listening..." : "Voice save"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onSave(job.id)}
                className={`rounded-xl border p-2.5 transition ${
                  job.isSaved
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-[var(--border)] bg-white text-gray-500 hover:bg-gray-50"
                }`}
                aria-label={job.isSaved ? "Unsave job" : "Save job"}
              >
                <Bookmark className={`h-4 w-4 ${job.isSaved ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-white px-3 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] uppercase tracking-[0.16em] text-gray-400">Budget</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {job.budget.type === "FIXED"
                  ? `$${job.budget.min.toLocaleString()} - $${job.budget.max.toLocaleString()}`
                  : `$${job.budget.min.toLocaleString()} - $${job.budget.max.toLocaleString()}/hr`}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] uppercase tracking-[0.16em] text-gray-400">Duration</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{job.duration}</p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] uppercase tracking-[0.16em] text-gray-400">Applicants</p>
              <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-gray-900">
                <Users className="h-4 w-4 text-gray-500" />
                {job.applicantCount}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] uppercase tracking-[0.16em] text-gray-400">Timezone</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{job.timezone ?? "Flexible"}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {job.skills.slice(0, expanded ? job.skills.length : 6).map((skill) => (
              <span key={skill} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                {skill}
              </span>
            ))}
          </div>

          <div className="mt-4">
            <p className={`text-sm leading-6 text-gray-600 ${expanded ? "" : "line-clamp-3"}`}>{job.description}</p>
          </div>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
              <span>Proposal load</span>
              <span>{applicantPct}% of queue target</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-gray-900" style={{ width: `${applicantPct}%` }} />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            {actionButtons}
            <div className="text-xs text-gray-400">Saved in your workspace.</div>
          </div>
        </div>
      </div>
    </div>
  );
});
