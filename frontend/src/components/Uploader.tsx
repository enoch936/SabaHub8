"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { saveAssetMetadata, uploadSignature } from "@/lib/api";

type Props = {
  scope: "PROFILE" | "PORTFOLIO" | "JOB" | "CHAT" | "DISPUTE" | "CONTENT";
  title?: string;
  accept?: string; // e.g. "image/*,application/pdf"
  maxSizeMb?: number;
  folder?: string; // cloudinary folder
  onUploaded?: (asset: { id: string; url: string }) => void;
};

export default function Uploader({ scope, title = "", accept, maxSizeMb = 20, folder = "sabahub", onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const maxBytes = useMemo(() => maxSizeMb * 1024 * 1024, [maxSizeMb]);

  const onPick = useCallback(() => inputRef.current?.click(), []);

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!e.dataTransfer.files?.length) return;
    await handleFile(e.dataTransfer.files[0]);
  }, []);

  const onChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    await handleFile(f);
  }, []);

  async function handleFile(file: File) {
    setError(null);
    setProgress(0);
    if (file.size > maxBytes) {
      setError(`File too large. Max ${maxSizeMb} MB`);
      return;
    }
    try {
      setUploading(true);
      const timestamp = Math.floor(Date.now() / 1000);
      const params = { timestamp, folder } as Record<string, any>;
      const sig = await uploadSignature(params);
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(timestamp));
      form.append("signature", sig.signature);
      if (sig.params?.folder) form.append("folder", sig.params.folder);

      const cloudName = sig.cloudName as string;
      const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

      const xhr = new XMLHttpRequest();
      const uploadPromise: Promise<any> = new Promise((resolve, reject) => {
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
      });

      xhr.open("POST", endpoint);
      xhr.send(form);

      const result = await uploadPromise;
      const secureUrl = result.secure_url as string;
      const publicId = result.public_id as string;
      const resourceType = result.resource_type as string;
      const bytes = (result.bytes as number) ?? file.size;

      const saved = await saveAssetMetadata({
        scope,
        title,
        secureUrl,
        publicId,
        resourceType,
        mimeType: file.type,
        size: bytes,
      });

      onUploaded?.(saved as any);
      setProgress(100);
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center ${isDragging ? "border-sky-600 bg-sky-50" : "border-slate-300"}`}
        onClick={onPick}
      >
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onChange} />
        <p className="font-medium">Drag & drop to upload</p>
        <p className="text-sm text-slate-600">or click to pick a file</p>
        {uploading && (
          <div className="mt-3 h-2 w-full max-w-xs overflow-hidden rounded bg-slate-200">
            <div className="h-2 bg-sky-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}
