"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Alert, Box, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { saveAssetMetadata, uploadSignature } from "@/lib/api";

type Props = {
  scope: "PROFILE" | "PORTFOLIO" | "JOB" | "CHAT" | "DISPUTE" | "CONTENT";
  title?: string;
  accept?: string;
  maxSizeMb?: number;
  folder?: string;
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
      const sig = await uploadSignature({ timestamp, folder });
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(timestamp));
      form.append("signature", sig.signature);
      if (sig.params?.folder) form.append("folder", sig.params.folder);

      const endpoint = `https://api.cloudinary.com/v1_1/${sig.cloudName as string}/auto/upload`;
      const xhr = new XMLHttpRequest();
      const uploadPromise: Promise<Record<string, unknown>> = new Promise((resolve, reject) => {
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText) as Record<string, unknown>);
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
      const saved = await saveAssetMetadata({
        scope,
        title,
        secureUrl: String(result.secure_url || ""),
        publicId: String(result.public_id || ""),
        resourceType: String(result.resource_type || ""),
        mimeType: file.type,
        size: (result.bytes as number) ?? file.size,
      });

      onUploaded?.(saved as { id: string; url: string });
      setProgress(100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Stack spacing={1}>
      <Paper
        variant="outlined"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={onPick}
        sx={{
          p: 3,
          cursor: "pointer",
          textAlign: "center",
          borderStyle: "dashed",
          borderColor: isDragging ? "primary.main" : "divider",
          bgcolor: isDragging ? "action.hover" : "background.paper",
        }}
      >
        <input ref={inputRef} type="file" accept={accept} hidden onChange={onChange} />
        <Typography fontWeight={600}>Drag and drop to upload</Typography>
        <Typography variant="body2" color="text.secondary">or click to pick a file</Typography>
        {uploading ? (
          <Box sx={{ mt: 1.5, mx: "auto", maxWidth: 300 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption" color="text.secondary">{progress}%</Typography>
          </Box>
        ) : null}
      </Paper>
      {error ? <Alert severity="error">{error}</Alert> : null}
    </Stack>
  );
}
