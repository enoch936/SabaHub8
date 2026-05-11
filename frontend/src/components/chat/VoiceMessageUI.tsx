"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

interface VoiceMessageUIProps {
  audioUrl?: string;
  isRecording?: boolean;
  duration?: number;
}

const WAVEFORM_BAR_HEIGHTS = [8, 14, 11, 16, 10, 18, 12, 9, 15, 13, 17, 11, 8, 14, 10];

function formatDuration(seconds: number) {
  const totalSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function VoiceMessageUI({ audioUrl, isRecording = false, duration }: VoiceMessageUIProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [resolvedDuration, setResolvedDuration] = useState<number>(duration ?? 0);

  useEffect(() => {
    setResolvedDuration(duration ?? 0);
  }, [duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setResolvedDuration(audio.duration);
      }
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  if (audioUrl) {
    return (
      <div className="rounded-[20px] border border-sky-100 bg-sky-50/80 px-3 py-2 text-slate-900">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const audio = audioRef.current;
              if (!audio) {
                return;
              }
              if (audio.paused) {
                void audio.play();
                return;
              }
              audio.pause();
            }}
            className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition hover:opacity-90"
            aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {WAVEFORM_BAR_HEIGHTS.map((height, index) => (
                <span
                  key={`${height}-${index}`}
                  className={`block w-1 rounded-full transition ${
                    isPlaying ? "bg-sky-500" : "bg-slate-300"
                  }`}
                  style={{ height }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-medium text-slate-500">
              <span>Voice note</span>
              <span>{formatDuration(resolvedDuration)}</span>
            </div>
          </div>
        </div>
        <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
      <span className={`inline-flex h-2.5 w-2.5 rounded-full ${isRecording ? "animate-pulse bg-rose-500" : "bg-rose-300"}`} />
      Recording voice note
    </div>
  );
}
