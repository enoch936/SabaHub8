"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { Loader2, Mic, Paperclip, SendHorizontal, Smile, Square, X, XCircle } from "lucide-react";
import { saveAssetMetadata, uploadSignature } from "@/lib/api";
import { registerGlobalStream } from "@/lib/callStore";
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
      registerGlobalStream(stream);
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
    } catch (error: any) {
      stopMediaStream();
      console.error("Voice recording permission error:", error);
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setUploadError("Microphone access blocked. Click the lock icon in your browser address bar to allow microphone access and try again.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setUploadError("No microphone found. Please connect a microphone and try again.");
      } else {
        setUploadError(error.message || "Failed to access microphone.");
      }
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

  const handleTyping = () => {
    onTyping?.();
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {uploadError && (
          <div className="absolute bottom-full left-0 right-0 mb-4 flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400 backdrop-blur-xl">
            <XCircle className="h-5 w-5 shrink-0" />
            <p className="flex-1 font-medium">{uploadError}</p>
            <button
              onClick={() => setUploadError(null)}
              className="rounded-lg p-1 hover:bg-rose-500/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-3">
        <div className="relative flex-1">
          <div className="flex min-h-[56px] items-end gap-2 rounded-[28px] border border-white/10 bg-white/5 p-2 pr-4 backdrop-blur-xl transition-all focus-within:border-indigo-500/50 focus-within:bg-white/10">
            <div className="flex h-10 w-10 items-center justify-center">
              <ChatSecondaryButton
                onClick={() => setEmojiOpen(!emojiOpen)}
                className={emojiOpen ? "text-indigo-400" : ""}
                title="Emojis"
              >
                <Smile className="h-5 w-5" />
              </ChatSecondaryButton>
            </div>

            <textarea
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Send an encrypted signal..."
              className="max-h-32 flex-1 resize-none bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-600"
              rows={1}
              disabled={disabled || isRecording}
            />

            <div className="flex h-10 items-center gap-1">
              <ChatSecondaryButton
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isRecording || isUploading}
                title="Attach file"
              >
                <Paperclip className="h-5 w-5" />
              </ChatSecondaryButton>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFileSelection(e.target.files)}
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
              />
            </div>
          </div>

          <AnimatePresence>
            {emojiOpen && (
              <div className="absolute bottom-full left-0 mb-4 z-50">
                <div className="rounded-2xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden">
                  <EmojiPicker
                    onEmojiClick={(data: EmojiClickData) => {
                      setValue(value + data.emoji);
                    }}
                    theme={Theme.DARK}
                    width={320}
                    height={400}
                  />
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex h-[56px] items-center gap-2">
          {isRecording ? (
            <VoiceMessageUI
              seconds={recordingSeconds}
              onCancel={stopMediaStream}
              onStop={stopVoiceRecording}
            />
          ) : (
            <>
              <button
                onClick={startVoiceRecording}
                disabled={disabled || isUploading}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                title="Voice message"
              >
                <Mic className="h-5 w-5" />
              </button>
              <button
                onClick={handleSubmit}
                disabled={disabled || !value.trim() || isUploading}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20 transition active:scale-95 disabled:opacity-50 disabled:grayscale"
                title="Send"
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <SendHorizontal className="h-5 w-5" />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {uploadStatus && (
        <div className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 animate-pulse">
          {uploadStatus}
        </div>
      )}
    </div>
  );
}
