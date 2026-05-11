"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, ImageIcon, PlayCircle, Upload } from "lucide-react";

export type JobMediaDraft = {
  thumbnail: File | null;
  images: File[];
  videos: File[];
  documents: File[];
};

export const EMPTY_JOB_MEDIA_DRAFT: JobMediaDraft = {
  thumbnail: null,
  images: [],
  videos: [],
  documents: [],
};

export function hasSupportingJobMedia(media: JobMediaDraft) {
  return media.images.length > 0 || media.videos.length > 0 || media.documents.length > 0;
}

function mediaCountLabel(label: string, count: number) {
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}

function SelectionChips({ media }: { media: JobMediaDraft }) {
  const items = [
    media.thumbnail ? "1 thumbnail" : null,
    media.images.length ? mediaCountLabel("image", media.images.length) : null,
    media.videos.length ? mediaCountLabel("video", media.videos.length) : null,
    media.documents.length ? mediaCountLabel("file", media.documents.length) : null,
  ].filter(Boolean) as string[];

  if (items.length === 0) {
    return <p className="text-sm text-slate-400">No files selected.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function FilePicker({
  label,
  helper,
  accept,
  multiple = true,
  onSelect,
}: {
  label: string;
  helper: string;
  accept: string;
  multiple?: boolean;
  onSelect: (files: File[]) => void;
}) {
  return (
    <label className="block rounded-[24px] bg-slate-50/85 p-4 transition hover:bg-white hover:shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Upload className="h-4 w-4" />
        {label}
      </span>
      <span className="mt-1 block text-xs text-slate-500">{helper}</span>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="mt-3 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
        onChange={(event) => onSelect(Array.from(event.target.files ?? []))}
      />
    </label>
  );
}

function MediaPreview({ media }: { media: JobMediaDraft }) {
  const preview = useMemo(() => {
    if (media.thumbnail) return { kind: "image" as const, file: media.thumbnail };
    if (media.images[0]) return { kind: "image" as const, file: media.images[0] };
    if (media.videos[0]) return { kind: "video" as const, file: media.videos[0] };
    return null;
  }, [media.images, media.thumbnail, media.videos]);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!preview?.file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(preview.file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [preview]);

  if (preview && previewUrl) {
    return (
      <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)] transition hover:shadow-[0_26px_70px_rgba(15,23,42,0.14)]">
        {preview.kind === "image" ? (
          <img
            src={previewUrl}
            alt="Job media preview"
            className="h-56 w-full object-cover"
            loading="lazy"
          />
        ) : (
          <video
            src={previewUrl}
            className="h-56 w-full bg-black object-cover"
            controls
            preload="metadata"
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-56 items-center justify-center rounded-[28px] bg-slate-50/90 text-center shadow-[inset_0_0_0_1px_rgba(15,23,42,0.04)]">
      <div>
        <ImageIcon className="mx-auto h-6 w-6 text-slate-300" />
        <p className="mt-2 text-sm text-slate-400">Preview appears here</p>
      </div>
    </div>
  );
}

export function JobMediaComposer({
  value,
  onChange,
}: {
  value: JobMediaDraft;
  onChange: (next: JobMediaDraft) => void;
}) {
  return (
    <section className="space-y-5 rounded-[32px] bg-white/75 p-6 shadow-[0_18px_52px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Media</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add one thumbnail and at least one image, video, or file.
          </p>
        </div>
        <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
            <ImageIcon className="h-3.5 w-3.5" />
            Visual
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
            <PlayCircle className="h-3.5 w-3.5" />
            Video
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
            <FileText className="h-3.5 w-3.5" />
            File
          </span>
        </div>
      </div>

      <MediaPreview media={value} />

      <div className="grid gap-4 md:grid-cols-2">
        <FilePicker
          label="Thumbnail"
          helper="Used as the main preview."
          accept="image/*"
          multiple={false}
          onSelect={(files) => onChange({ ...value, thumbnail: files[0] ?? null })}
        />
        <FilePicker
          label="Images"
          helper="Add supporting stills."
          accept="image/*"
          onSelect={(files) => onChange({ ...value, images: files })}
        />
        <FilePicker
          label="Videos"
          helper="Short clips or demos."
          accept="video/*"
          onSelect={(files) => onChange({ ...value, videos: files })}
        />
        <FilePicker
          label="Files"
          helper="Briefs, PDFs, decks, and docs."
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.csv"
          onSelect={(files) => onChange({ ...value, documents: files })}
        />
      </div>

      <SelectionChips media={value} />
    </section>
  );
}
