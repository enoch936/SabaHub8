"use client";

import { useEffect, useRef, useState } from "react";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { Loader2, Mic, Paperclip, SendHorizontal, Smile, Square, X } from "lucide-react";
import { saveAssetMetadata, uploadSignature } from "@/lib/api";
import { VoiceMessageUI } from "./VoiceMessageUI";
import { ChatPrimaryButton, ChatSecondaryButton } from "./chat-ui";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (emojiOpen) {
          setEmojiOpen(false);
          return;
        }
        if (contextLabel && onClearContext) {
          onClearContext();
        }
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "m") {
        event.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [contextLabel, emojiOpen, onClearContext]);

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
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-700 shadow-sm">
          <span className="truncate font-medium">{contextLabel}</span>
          {onClearContext ? (
            <button
              type="button"
              onClick={onClearContext}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-700 transition hover:bg-white"
              aria-label="Clear message context"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}

      {uploadError ? (
        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          {uploadError}
        </div>
      ) : null}

      {uploadStatus ? (
        <div className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
          {uploadStatus}
        </div>
      ) : null}

      {isRecording ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <VoiceMessageUI isRecording />
          <div className="text-sm font-semibold text-rose-700">{formatRecordingSeconds(recordingSeconds)}</div>
        </div>
      ) : null}

      <div className="relative rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
        {emojiOpen ? (
          <div className="absolute bottom-[calc(100%+12px)] right-0 z-20 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
              <ChatSecondaryButton
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading || isRecording}
                className="h-11 w-11 flex-shrink-0 rounded-xl border-slate-200 bg-white p-0 text-slate-600 hover:bg-slate-50"
                aria-label="Attach file"
              >
                <Paperclip className="h-4.5 w-4.5" />
              </ChatSecondaryButton>
            </>
          ) : null}

          <ChatSecondaryButton
            onClick={() => setEmojiOpen((current) => !current)}
            disabled={disabled || isRecording}
            className="h-11 w-11 flex-shrink-0 rounded-xl border-slate-200 bg-white p-0 text-slate-600 hover:bg-slate-50"
            aria-label="Open emoji picker"
          >
            <Smile className="h-4.5 w-4.5" />
          </ChatSecondaryButton>

          <div className="flex-1 rounded-xl bg-slate-50 px-2 py-1">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                onTyping?.();
              }}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  handleSubmit();
                  return;
                }
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
              className="max-h-40 min-h-[48px] w-full resize-y bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
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
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : "bg-white text-slate-600 hover:bg-slate-900 hover:text-white"
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

          <ChatPrimaryButton
            onClick={handleSubmit}
            disabled={disabled || isUploading || isRecording || !value.trim()}
            className="h-11 w-11 flex-shrink-0 rounded-2xl p-0"
            aria-label="Send message"
          >
            <SendHorizontal className="h-4.5 w-4.5" />
          </ChatPrimaryButton>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 px-1">
          <p className="text-[11px] text-slate-500">Message composer</p>
          <p className="text-[11px] font-medium text-slate-400">{value.trim().length > 0 ? `${value.trim().length} chars` : "Ready"}</p>
        </div>
      </div>
    </div>
  );
}
