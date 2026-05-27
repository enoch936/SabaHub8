/**
 * Enterprise Media Orchestration & Telemetry Manager
 * Supports cinematic playback, real-time analytics, and premium management
 */

"use client";

import { useState, ReactNode, useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  LinearProgress,
  useTheme,
  alpha,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Chip,
  Grid,
  Avatar,
  Tooltip,
} from "@mui/material";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import VideoLibraryRoundedIcon from "@mui/icons-material/VideoLibraryRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import PlayCircleFilledRoundedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, GlassCardHeader } from "./GlassCard";
import { ModernDonutChart } from "./ModernCharts";
import SoftButton from "@/components/mui/SoftButton";

export interface MediaFile {
  id: string;
  name: string;
  type: "image" | "video" | "document" | "other";
  size: number;
  sizeFormatted: string;
  uploadedAt: Date;
  url?: string;
  uploadedBy?: { name: string; id: string };
  status?: "optimizing" | "ready" | "failed";
}

interface MediaManagerProps {
  files?: MediaFile[];
  maxSize?: number;
  maxSizeFormatted?: string;
  onUpload?: (files: File[]) => void;
  onDelete?: (fileId: string) => void;
  storageUsed?: number;
  storageTotal?: number;
}

const typeConfig: Record<MediaFile["type"], { color: string; icon: ReactNode; label: string }> = {
  image: { color: "#06B6D4", icon: <ImageRoundedIcon />, label: "Images" },
  video: { color: "#8B5CF6", icon: <VideoLibraryRoundedIcon />, label: "Videos" },
  document: { color: "#F59E0B", icon: <DescriptionRoundedIcon />, label: "Documents" },
  other: { color: "#94A3B8", icon: <FolderRoundedIcon />, label: "Other" },
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
}

export function MediaManager({
  files = [],
  maxSizeFormatted = "10 GB",
  onUpload,
  onDelete,
  storageUsed = 2147483648, // 2GB
  storageTotal = 10737418240, // 10GB
}: MediaManagerProps) {
  const theme = useTheme();
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const storagePercentage = (storageUsed / storageTotal) * 100;
  
  const storageData = useMemo(() => {
    const filesByType = files.reduce((acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + file.size;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(filesByType).map(([type, size]) => ({
      name: typeConfig[type as MediaFile["type"]].label,
      value: size,
    }));
  }, [files]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) onUpload?.(Array.from(e.dataTransfer.files));
  };

  return (
    <Stack spacing={3}>
      <GlassCard sx={{ p: 0, overflow: "hidden" }}>
        <GlassCardHeader title="Asset Intelligence" subtitle="Real-time storage orchestration and lifecycle management" />
        
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Storage Telemetry */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ p: 2.5, borderRadius: "20px", bgcolor: "var(--glass-gray)", border: "1px solid var(--border)" }}>
                <Stack direction="row" justifyContent="space-between" mb={2}>
                  <Box>
                    <Typography variant="caption" fontWeight={800} color="text.secondary">STORAGE CAPACITY</Typography>
                    <Typography variant="h5" fontWeight={900}>{formatFileSize(storageUsed)}</Typography>
                  </Box>
                  <Tooltip title="View Detailed Quotas">
                    <IconButton size="small" sx={{ height: 32, width: 32 }}><InfoRoundedIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={storagePercentage} 
                  sx={{ height: 10, borderRadius: "10px", bgcolor: alpha("#6366F1", 0.1), "& .MuiLinearProgress-bar": { borderRadius: "10px" }}} 
                />
                <Typography variant="caption" sx={{ mt: 1, display: "block", textAlign: "right", fontWeight: 700, opacity: 0.6 }}>
                  {storagePercentage.toFixed(1)}% of {maxSizeFormatted} Allocated
                </Typography>
              </Box>

              <Box sx={{ mt: 3, height: 220 }}>
                <ModernDonutChart data={storageData} height={220} innerRadius={60} outerRadius={90} />
              </Box>
            </Grid>

            {/* Ingest Point */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Box
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                sx={{
                  height: "100%",
                  minHeight: 300,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "24px",
                  border: "2px dashed",
                  borderColor: dragActive ? "primary.main" : "var(--border)",
                  bgcolor: dragActive ? alpha(theme.palette.primary.main, 0.05) : "transparent",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer",
                  "&:hover": { borderColor: "var(--primary)", bgcolor: "var(--glass-gray)" }
                }}
              >
                <Stack spacing={2} alignItems="center">
                  <Box sx={{ 
                    width: 64, height: 64, borderRadius: "20px", 
                    bgcolor: alpha("#6366F1", 0.1), color: "#6366F1",
                    display: "grid", placeItems: "center", mb: 1
                  }}>
                    <CloudUploadRoundedIcon sx={{ fontSize: 32 }} />
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight={900}>Ingest Assets</Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                      Synchronize your media library with high-speed cloud storage
                    </Typography>
                  </Box>
                  <Button variant="contained" size="large" sx={{ borderRadius: "14px", fontWeight: 800 }}>
                    Synchronize
                  </Button>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </GlassCard>

      <GlassCard sx={{ p: 0 }}>
        <Box sx={{ p: 3, borderBottom: "1px solid var(--border)" }}>
          <Typography variant="h6" fontWeight={900}>Asset Registry ({files.length})</Typography>
        </Box>
        <Stack spacing={1} sx={{ p: 2 }}>
          {files.map((file, idx) => (
            <motion.div key={file.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
              <Box
                sx={{
                  p: 1.5, borderRadius: "16px",
                  bgcolor: "var(--glass-gray)",
                  border: "1px solid transparent",
                  display: "flex", alignItems: "center", gap: 2,
                  transition: "all 0.25s",
                  "&:hover": { 
                    bgcolor: "var(--glass-gray-hover)", 
                    borderColor: "var(--border)",
                    transform: "translateX(8px)"
                  }
                }}
              >
                <Box sx={{ 
                  width: 56, height: 56, borderRadius: "12px", 
                  overflow: "hidden", position: "relative",
                  bgcolor: "black", flexShrink: 0
                }}>
                  {file.type === 'image' ? (
                    <Box component="img" src={file.url} sx={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} />
                  ) : (
                    <Box sx={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: typeConfig[file.type].color }}>
                      {typeConfig[file.type].icon}
                    </Box>
                  )}
                  <IconButton 
                    size="small" 
                    onClick={() => setSelectedFile(file)}
                    sx={{ position: "absolute", inset: 0, borderRadius: 0, color: "white", bgcolor: "rgba(0,0,0,0.4)", opacity: 0, "&:hover": { opacity: 1 } }}
                  >
                    {file.type === 'video' ? <PlayCircleFilledRoundedIcon /> : <VisibilityRoundedIcon />}
                  </IconButton>
                </Box>

                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" fontWeight={800} noWrap>{file.name}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ opacity: 0.7 }}>
                    <Typography variant="caption" fontWeight={700}>{file.sizeFormatted}</Typography>
                    <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "currentColor" }} />
                    <Typography variant="caption" fontWeight={700}>
                      Owner: {file.uploadedBy?.name || "System Orchestrator"} (#USR-{file.uploadedBy?.id?.slice(-6).toUpperCase() || "ADMIN"})
                    </Typography>
                  </Stack>
                </Box>

                <Stack direction="row" spacing={1}>
                  <IconButton size="small" sx={{ bgcolor: "var(--surface)", border: "1px solid var(--border)" }}><DownloadRoundedIcon fontSize="small" /></IconButton>
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => onDelete?.(file.id)}
                    sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), border: "1px solid", borderColor: alpha(theme.palette.error.main, 0.2) }}
                  >
                    <DeleteRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            </motion.div>
          ))}
        </Stack>
      </GlassCard>

      {/* Cinematic Media Viewer */}
      <Dialog 
        open={!!selectedFile} 
        onClose={() => setSelectedFile(null)} 
        maxWidth="lg" 
        fullWidth
        slotProps={{ paper: { sx: { bgcolor: "black", borderRadius: "32px", overflow: "hidden" }}}}
      >
        <AnimatePresence mode="wait">
          {selectedFile && (
            <Box sx={{ position: "relative", minHeight: 400, display: "flex", flexDirection: "column" }}>
              <IconButton 
                onClick={() => setSelectedFile(null)} 
                sx={{ position: "absolute", top: 20, right: 20, zIndex: 10, bgcolor: "rgba(255,255,255,0.1)", color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" }}}
              >
                <CloseRoundedIcon />
              </IconButton>

              <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "black" }}>
                {selectedFile.type === 'video' ? (
                  <Box component="video" src={selectedFile.url} controls autoPlay sx={{ maxWidth: "100%", maxHeight: "70vh" }} />
                ) : selectedFile.type === 'image' ? (
                  <Box component="img" src={selectedFile.url} sx={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }} />
                ) : (
                  <Stack spacing={2} alignItems="center" color="white">
                    {typeConfig[selectedFile.type].icon}
                    <Typography>Document Preview Not Available</Typography>
                    <Button variant="outlined" color="inherit" startIcon={<DownloadRoundedIcon />}>Download to View</Button>
                  </Stack>
                )}
              </Box>

              <Box sx={{ p: 4, bgcolor: "rgba(20,20,20,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
                  <Box>
                    <Typography variant="h5" fontWeight={900} color="white">{selectedFile.name}</Typography>
                    <Typography variant="body2" color="rgba(255,255,255,0.6)" fontWeight={600}>
                      {selectedFile.sizeFormatted} · Uploaded by {selectedFile.uploadedBy?.name || "System"} (#USR-{selectedFile.uploadedBy?.id?.slice(-6).toUpperCase() || "ADMIN"})
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={2}>
                    <SoftButton variant="outline" sx={{ color: "white", borderColor: "rgba(255,255,255,0.3)" }} startIcon={<DeleteRoundedIcon />}>Delete</SoftButton>
                    <SoftButton variant="contained" color="primary" startIcon={<DownloadRoundedIcon />}>Download Asset</SoftButton>
                  </Stack>
                </Stack>
              </Box>
            </Box>
          )}
        </AnimatePresence>
      </Dialog>
    </Stack>
  );
}

