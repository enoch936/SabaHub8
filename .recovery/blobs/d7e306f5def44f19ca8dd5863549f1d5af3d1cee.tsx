"use client";

import { useEffect, useRef, useState } from "react";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { Loader2, Mic, Paperclip, SendHorizontal, Smile, Square, X } from "lucide-react";
import { saveAssetMetadata, uploadSignature } from "@/lib/api";
import { VoiceMessageUI } from "./VoiceMessageUI";

interface MessageInputProps {
  onSend: (content: string) => void;
  onSendAsset?: (assetId: string) => void;
  onTyping?: () => void;
  disabled?: boolean;
  draftText?: string;
  onDraftChange?: (value: string) => void;
  contextLabel?: string | null;
  onClearContext?: () => void;
}

export async function uploadChatAsset(file: File) {
  const timestamp = Math.floor(Date.now() / 1000);
  const sig = await uploadSignature({ timestamp, folder: "sabahub/chat" });
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", sig.signature);
  if (sig.params?.folder) {
    form.append("folder", sig.params.folder);
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${sig.cloudName as string}/auto/upload`;
  const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as Record<string, unknown>);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.open("POST", endpoint);
    xhr.send(form);
  });

  return saveAssetMetadata({
    scope: "CHAT",
    title: file.name,
    secureUrl: String(result.secure_url || ""),
    publicId: String(result.public_id || ""),
    resourceType: String(result.resource_type || ""),
    mimeType: file.type,
    size: (result.bytes as number) ?? file.size,
  });
}

function formatRecordingSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function MessageInput({
  onSend,
  onSendAsset,
  onTyping,
  disabled = false,
  draftText,
  onDraftChange,
  contextLabel,
  onClearContext,
}: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  const [internalDraft, setInternalDraft] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const value = draftText ?? internalDraft;

  const setValue = (next: string) => {
    if (onDraftChange) {
      onDraftChange(next);
      return;
    }
    setInternalDraft(next);
  };

  const clearRecordingTimer = () => {
    if (recordingTimerRef.current != null) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const stopMediaStream = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    mediaRecorderRef.current = null;
    clearRecordingTimer();
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      stopMediaStream();
    };
  }, []);

  const uploadFile = async (file: File) => {
    if (!onSendAsset || disabled) {
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadStatus(`Uploading ${file.name}…`);

    try {
      const asset = await uploadChatAsset(file);
      onSendAsset(asset.id);
      setUploadStatus(file.type.startsWith("audio/") ? "Voice note sent" : `${file.name} shared`);
      window.setTimeout(() => {
        setUploadStatus((current) =>
          current === "Voice note sent" || current === `${file.name} shared` ? null : current,
        );
      }, 1600);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload attachment.");
      setUploadStatus(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isRecording || isUploading) {
      return;
    }
    onSend(trimmed);
    setValue("");
    setEmojiOpen(false);
  };

  const handleFileSelection = async (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []).slice(0, 5);
    if (selectedFiles.length === 0) {
      return;
    }
    for (const file of selectedFiles) {
      await uploadFile(file);
    }
  };

  const startVoiceRecording = async () => {
    if (!onSendAsset || disabled || isUploading) {
      return;
    }

    if (
      typeof navigator === "undefined"
      || !navigator.mediaDevices?.getUserMedia
      || typeof MediaRecorder === "undefined"
    ) {
      setUploadError("Voice recording is not supported in this browser.");
      return;
    }

    try {
      setUploadError(null);
      setUploadStatus(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener("stop", () => {
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stopMediaStream();

        if (blob.size === 0) {
          setUploadError("No audio captured. Please try again.");
          return;
        }

        const extension = blob.type.includes("mpeg")
          ? "mp3"
          : blob.type.includes("ogg")
            ? "ogg"
            : "webm";
        const file = new File([blob], `voice-note-${Date.now()}.${extension}`, {
          type: blob.type || "audio/webm",
        });
        void uploadFile(file);
      });

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((current) => current + 1);
      }, 1000);
    } catch (error) {
      stopMediaStream();
      setUploadError(error instanceof Error ? error.message : "Microphone access was not granted.");
    }
  };

  const stopVoiceRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      stopMediaStream();
      return;
    }
    recorder.stop();
  };

  return (
    <div className="px-4 py-4">
      {contextLabel ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-[20px] border border-[#d6e4d3] bg-[#eef4ec] px-3 py-2 text-xs text-[#315447] shadow-[0_14px_24px_rgba(38,67,56,0.04)]">
          <span className="truncate font-medium">{contextLabel}</span>
          {onClearContext ? (
            <button
              type="button"
              onClick={onClearContext}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#315447] transition hover:bg-white/70"
              aria-label="Clear message context"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}

      {uploadError ? (
        <div className="mb-3 rounded-[20px] border border-[#f1cbc1] bg-[#fff5f2] px-3 py-2 text-xs font-medium text-[#b45a4b]">
          {uploadError}
        </div>
      ) : null}

      {uploadStatus ? (
        <div className="mb-3 rounded-[20px] border border-[#d8e0d6] bg-white/80 px-3 py-2 text-xs font-medium text-[#5f6d65]">
          {uploadStatus}
        </div>
      ) : null}

      {isRecording ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-[24px] border border-[#f4d3c7] bg-[#fff4f0] px-4 py-3">
          <VoiceMessageUI isRecording />
          <div className="text-sm font-semibold text-[#b45a4b]">{formatRecordingSeconds(recordingSeconds)}</div>
        </div>
      ) : null}

      <div className="relative rounded-[28px] border border-[#d8e0d6] bg-white/92 px-3 py-3 shadow-[0_20px_36px_rgba(38,67,56,0.07)] backdrop-blur-sm">
        {emojiOpen ? (
          <div className="absolute bottom-[calc(100%+12px)] right-0 z-20 overflow-hidden rounded-[24px] border border-[#d8e0d6] bg-white shadow-[0_28px_60px_rgba(38,67,56,0.14)]">
            <EmojiPicker
              width={320}
              height={380}
              theme={Theme.LIGHT}
              lazyLoadEmojis
              onEmojiClick={(emojiData: EmojiClickData) => {
                setValue(`${value}${emojiData.emoji}`);
                setEmojiOpen(false);
              }}
            />
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          {onSendAsset ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                multiple
                hidden
                onChange={(event) => void handleFileSelection(event.target.files)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading || isRecording}
                className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#f4f7f2] text-[#5f6d65] transition hover:bg-[#ecf3eb] hover:text-[#315447] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Attach file"
              >
                <Paperclip className="h-4.5 w-4.5" />
              </button>
            </>
          ) : null}

          <button
            type="button"
            onClick={() => setEmojiOpen((current) => !current)}
            disabled={disabled || isRecording}
            className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#f4f7f2] text-[#5f6d65] transition hover:bg-[#ecf3eb] hover:text-[#315447] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Open emoji picker"
          >
            <Smile className="h-4.5 w-4.5" />
          </button>

          <div className="flex-1 rounded-[22px] bg-[#f7faf6] px-2 py-1">
            <textarea
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                onTyping?.();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              rows={1}
              disabled={disabled || isRecording}
              placeholder={
                disabled
                  ? "Posting is disabled in this conversation"
                  : isUploading
                    ? "Uploading…"
                    : isRecording
                      ? "Recording voice note…"
                      : "Write a message"
              }
              className="max-h-40 min-h-[48px] w-full resize-y bg-transparent px-3 py-2.5 text-sm text-[#20332d] outline-none placeholder:text-[#94a198] disabled:cursor-not-allowed"
            />
          </div>

          {onSendAsset ? (
            <button
              type="button"
              onClick={() => {
                if (isRecording) {
                  stopVoiceRecording();
                  return;
                }
                void startVoiceRecording();
              }}
              disabled={disabled || isUploading}
              className={`inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl transition disabled:cursor-not-allowed disabled:opacity-40 ${
                isRecording
                  ? "bg-[#c96a57] text-white hover:bg-[#b45a4b]"
                  : "bg-[#f4f7f2] text-[#5f6d65] hover:bg-[#27463b] hover:text-white"
              }`}
              aria-label={isRecording ? "Stop voice recording" : "Record voice note"}
            >
              {isUploading ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : isRecording ? (
                <Square className="h-4.5 w-4.5" />
              ) : (
                <Mic className="h-4.5 w-4.5" />
              )}
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || isUploading || isRecording || !value.trim()}
            className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#27463b] text-white shadow-[0_16px_28px_rgba(39,70,59,0.22)] transition hover:bg-[#315447] disabled:cursor-not-allowed disabled:bg-[#dbe2db] disabled:text-[#8fa095] disabled:shadow-none"
            aria-label="Send message"
          >
            <SendHorizontal className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 px-1">
          <p className="text-[11px] text-[#87958d]">Message composer</p>
          <p className="text-[11px] font-medium text-[#9aa69f]">{value.trim().length > 0 ? `${value.trim().length} chars` : "Ready"}</p>
        </div>
      </div>
    </div>
  );
}
