"use client";

import { Pause, Play, Radio, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type StreamVideoStageProps = {
  primarySrc?: string | null;
  mediaStream?: MediaStream | null;
  posterSrc?: string;
  headline: string;
  detail?: string;
  statusLabel?: string;
  accentLabel?: string;
  aspectClassName?: string;
  autoPlay?: boolean;
  muted?: boolean;
};

export function StreamVideoStage({
  primarySrc,
  mediaStream,
  posterSrc,
  headline,
  detail,
  statusLabel = "Video preview",
  accentLabel,
  aspectClassName = "aspect-video",
  autoPlay = false,
  muted = false,
}: StreamVideoStageProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [source, setSource] = useState(primarySrc || "");
  const [isPlaying, setIsPlaying] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const hasDeviceStream = Boolean(mediaStream);
  const hasRenderableSource = hasDeviceStream || Boolean(source);

  useEffect(() => {
    if (mediaStream) {
      setSource("");
      setIsPlaying(false);
      setStatusNote("");
      return;
    }

    setSource(primarySrc || "");
    setIsPlaying(false);
    setStatusNote("");
  }, [mediaStream, primarySrc]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) {
      return;
    }

    if (!mediaStream) {
      element.srcObject = null;
      return;
    }

    element.srcObject = mediaStream;
    if (autoPlay) {
      void element.play().catch(() => undefined);
    }

    return () => {
      if (element.srcObject === mediaStream) {
        element.srcObject = null;
      }
    };
  }, [autoPlay, mediaStream]);

  const togglePlayback = async () => {
    const element = videoRef.current;
    if (!element) {
      return;
    }

    try {
      if (element.paused) {
        await element.play();
        setIsPlaying(true);
      } else {
        element.pause();
        setIsPlaying(false);
      }
    } catch {
      setStatusNote("Playback is waiting for the browser. Press play again to continue.");
    }
  };

  const handleError = () => {
    setStatusNote("Real stream video is not available right now.");
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[28px] border border-gray-200/80 bg-black shadow-[0_22px_60px_rgba(15,23,42,0.16)]">
        <div className={`relative ${aspectClassName}`}>
          {hasRenderableSource ? (
            <video
              ref={videoRef}
              key={hasDeviceStream ? "device-stream" : source}
              src={hasDeviceStream ? undefined : source}
              poster={posterSrc}
              autoPlay={autoPlay}
              muted={muted}
              controls
              playsInline
              className="h-full w-full bg-black object-cover"
              onError={hasDeviceStream ? undefined : handleError}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-950 px-6 text-center text-sm text-gray-300">
              Video will appear here when the stream source is ready.
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/65 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
              <Radio className="h-3.5 w-3.5" />
              {statusLabel}
            </div>
            {accentLabel ? (
              <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                {accentLabel}
              </div>
            ) : null}
          </div>

          {hasRenderableSource && !isPlaying ? (
            <button
              type="button"
              onClick={() => void togglePlayback()}
              className="absolute left-1/2 top-1/2 inline-flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white shadow-[0_12px_28px_rgba(15,23,42,0.32)] backdrop-blur"
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="ml-1 h-6 w-6" />}
            </button>
          ) : null}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-white/12 p-3 text-white backdrop-blur">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">{headline}</div>
                {detail ? <p className="mt-1 max-w-2xl text-sm leading-6 text-white/80">{detail}</p> : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
          {hasDeviceStream ? "Live device source" : "Real stream playback"}
        </span>
        {statusNote ? <span>{statusNote}</span> : null}
      </div>
    </div>
  );
}
