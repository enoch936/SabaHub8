import type { StreamDetail, StreamJoinResponse } from "../../types/models";

export function resolvePlaybackUrl(stream: StreamDetail | null, joinInfo: StreamJoinResponse | null) {
  const live = joinInfo?.liveHlsUrl ?? stream?.liveHlsUrl;
  const playback = joinInfo?.playbackHlsUrl ?? stream?.playbackHlsUrl;
  if (stream?.status === "LIVE") {
    return live ?? playback ?? null;
  }
  return playback ?? live ?? null;
}
