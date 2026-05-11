import type { StreamDetail, StreamMediaKind, StreamVisibility } from "./api";

export const STREAM_VISIBILITY_OPTIONS: Array<{ value: StreamVisibility; label: string; description: string }> = [
  { value: "PUBLIC", label: "Public", description: "Anyone with account access can watch and chat." },
  { value: "UNLISTED", label: "Unlisted", description: "Shareable link, hidden from broad discovery." },
  { value: "PRIVATE", label: "Private", description: "Restricted owner-managed audience." },
];

export function formatStreamStatus(status?: string | null) {
  switch ((status ?? "").toUpperCase()) {
    case "LIVE":
      return "Live";
    case "ENDED":
      return "Ended";
    case "TERMINATED":
      return "Terminated";
    default:
      return "Draft";
  }
}

export function formatViewerCount(count?: number | null) {
  const value = typeof count === "number" ? count : 0;
  return new Intl.NumberFormat().format(value);
}

export function resolvePreferredPlaybackUrl(stream: Pick<StreamDetail, "liveHlsUrl" | "playbackHlsUrl" | "status">) {
  if (stream.status === "LIVE" && stream.liveHlsUrl) {
    return stream.liveHlsUrl;
  }
  return stream.playbackHlsUrl ?? stream.liveHlsUrl ?? "";
}

export function resolveStreamPlaybackSource(stream: {
  id?: string | null;
  status?: StreamDetail["status"] | null;
  liveHlsUrl?: string | null;
  playbackHlsUrl?: string | null;
  mediaKind?: StreamMediaKind | null;
}) {
  const primaryUrl = resolvePreferredPlaybackUrl({
    status: stream.status ?? "DRAFT",
    liveHlsUrl: stream.liveHlsUrl ?? null,
    playbackHlsUrl: stream.playbackHlsUrl ?? null,
  });

  return {
    primaryUrl,
    posterUrl: "",
    accent: stream.status === "LIVE" ? "Live feed" : "Replay",
  };
}

export function buildStreamWatchHref(streamId: string) {
  return `/live/${encodeURIComponent(streamId)}`;
}
