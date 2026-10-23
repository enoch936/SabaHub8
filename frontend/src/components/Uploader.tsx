/**
 * Enterprise Premium Media Uploader
 * Supports real-time progress, drag-and-drop, and cinematic feedback
 */

"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { 
  Alert, 
  Box, 
  CircularProgress, 
  Paper, 
  Stack, 
  Typography, 
  IconButton,
  alpha,
  useTheme,
  LinearProgress
} from "@mui/material";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import { saveAssetMetadata, uploadSignature, getStorageUsage } from "@/lib/api";
import { useEffect } from "react";

type Props = {
  scope: "PROFILE" | "PORTFOLIO" | "JOB" | "CHAT" | "DISPUTE" | "CONTENT";
  title?: string;
  accept?: string;
  maxSizeMb?: number;
  folder?: string;
  onUploaded?: (asset: { id: string; url: string }) => void;
  showStorageInfo?: boolean;
};

export default function Uploader({ 
  scope, 
  title = "", 
  accept, 
  maxSizeMb = 20, 
  folder = "sabahub", 
  onUploaded,
  showStorageInfo = false
}: Props) {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ totalSize: number; storageTotal: number } | null>(null);

  const maxBytes = useMemo(() => maxSizeMb * 1024 * 1024, [maxSizeMb]);

  useEffect(() => {
    if (showStorageInfo) {
      void refreshUsage();
    }
  }, [showStorageInfo]);

  const refreshUsage = async () => {
    try {
      const data = await getStorageUsage();
      setUsage(data);
    } catch (err) {
      console.error("Failed to fetch storage usage", err);
    }
  };

  const onPick = useCallback(() => inputRef.current?.click(), []);

  const handleFile = async (file: File) => {
    setError(null);
    setSuccess(false);
    setProgress(0);
    setFileName(file.name);
    setFileType(file.type);

    // Instant Preview
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    if (file.size > maxBytes) {
      setError(`Telemetry: File volume exceeds threshold. Max ${maxSizeMb} MB permitted.`);
      return;
    }

    if (usage && usage.totalSize + file.size > usage.storageTotal) {
      setError(`Orchestration: Insufficient storage quota. Please upgrade or delete existing assets.`);
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

      const endpoint = `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`;
      const xhr = new XMLHttpRequest();
      
      const uploadPromise: Promise<any> = new Promise((resolve, reject) => {
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Orchestration failure: Code ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Network layer disconnection detected."));
      });

      xhr.open("POST", endpoint);
      xhr.send(form);

      const result = await uploadPromise;
      const saved = await saveAssetMetadata({
        scope,
        title: title || file.name,
        secureUrl: String(result.secure_url || ""),
        publicId: String(result.public_id || ""),
        resourceType: String(result.resource_type || ""),
        mimeType: file.type,
        size: result.bytes ?? file.size,
      });

      onUploaded?.(saved as { id: string; url: string });
      setSuccess(true);
      setProgress(100);
      void refreshUsage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Asset synchronization failed.");
    } finally {
      setUploading(false);
    }
  };

  const usagePercent = usage ? Math.round((usage.totalSize / usage.storageTotal) * 100) : 0;
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <Stack spacing={2}>
      {showStorageInfo && usage && (
        <Box sx={{ p: 2, bgcolor: "var(--glass-gray)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <StorageRoundedIcon sx={{ fontSize: 16, color: usagePercent > 90 ? "var(--error)" : "var(--primary)" }} />
              <Typography variant="caption" fontWeight={800} sx={{ color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Storage Vault Status
              </Typography>
            </Stack>
            <Typography variant="caption" fontWeight={900}>
              {formatBytes(usage.totalSize)} / {formatBytes(usage.storageTotal)}
            </Typography>
          </Stack>
          <LinearProgress 
            variant="determinate" 
            value={usagePercent} 
            sx={{ 
              height: 4, 
              borderRadius: 2, 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              "& .MuiLinearProgress-bar": {
                bgcolor: usagePercent > 90 ? "var(--error)" : "var(--primary)",
                boxShadow: usagePercent > 90 ? "0 0 10px var(--error-glow)" : "0 0 10px var(--primary-glow)"
              }
            }} 
          />
        </Box>
      )}

      <Paper
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files?.length) void handleFile(e.dataTransfer.files[0]);
        }}
        onClick={!uploading ? onPick : undefined}
        sx={{
          minHeight: 240,
          cursor: uploading ? "wait" : "pointer",
          textAlign: "center",
          border: "2px dashed",
          borderColor: isDragging ? "var(--primary)" : success ? "var(--success)" : "var(--border)",
          bgcolor: isDragging ? "var(--glass-gray-hover)" : "var(--surface)",
          backdropFilter: "blur(var(--glass-blur))",
          borderRadius: "var(--radius-xl)",
          transition: "all 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          "&:hover": {
            borderColor: uploading ? "var(--border)" : "var(--primary)",
            transform: uploading ? "none" : "translateY(-4px)",
            bgcolor: uploading ? "var(--surface)" : "var(--surface-hover)",
            boxShadow: "var(--glass-shadow)"
          }
        }}
      >
        <input ref={inputRef} type="file" accept={accept} hidden onChange={(e) => {
          if (e.target.files?.[0]) void handleFile(e.target.files[0]);
        }} />

        {previewUrl ? (
          <Box sx={{ position: "absolute", inset: 0, zIndex: 0, opacity: uploading ? 0.3 : 0.6 }}>
            {fileType?.startsWith("video/") ? (
              <Box component="video" src={previewUrl} autoPlay muted loop sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Box component="img" src={previewUrl} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.4))" }} />
          </Box>
        ) : null}

        <Stack spacing={2} alignItems="center" sx={{ position: "relative", zIndex: 1 }}>
          {uploading ? (
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <CircularProgress 
                variant="determinate" 
                value={progress} 
                size={80} 
                thickness={4} 
                sx={{ color: "var(--primary)", filter: "drop-shadow(0 0 10px var(--primary-glow))" }} 
              />
              <Box sx={{ inset: 0, position: "absolute", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="h6" fontWeight={900}>{progress}%</Typography>
              </Box>
            </Box>
          ) : success ? (
            <Box sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), p: 2, borderRadius: "50%" }}>
              <CheckCircleRoundedIcon sx={{ fontSize: 48, color: "var(--success)" }} />
            </Box>
          ) : (
            <Box sx={{ bgcolor: "var(--glass-gray)", p: 2.5, borderRadius: "20px", border: "1px solid var(--border)" }}>
              <CloudUploadRoundedIcon sx={{ fontSize: 40, color: isDragging ? "var(--primary)" : "var(--foreground-muted)" }} />
            </Box>
          )}

          <Box>
            <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: "-0.01em" }}>
              {uploading ? "Ingesting Data..." : success ? "Stream Synchronized" : "Asset Ingest Point"}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ opacity: 0.7, mt: 0.5 }}>
              {uploading ? `Transferring: ${fileName}` : success ? fileName : "Drag assets here or select from vault"}
            </Typography>
          </Box>
        </Stack>

        {progress > 0 && progress < 100 && (
          <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 6, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
            <Box sx={{ height: "100%", bgcolor: "var(--primary)", width: `${progress}%`, transition: "width 0.4s cubic-bezier(0.22, 1, 0.36, 1)" }} />
          </Box>
        )}
      </Paper>

      {error && (
        <Alert 
          severity="error" 
          variant="filled"
          sx={{ borderRadius: "16px", fontWeight: 800, bgcolor: "var(--error)" }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
    </Stack>
  );
}


