/**
 * Media Manager Component
 * File upload, management, and cloud storage analytics
 */

"use client";

import { useState, ReactNode } from "react";
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
  Card,
} from "@mui/material";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import VideoLibraryRoundedIcon from "@mui/icons-material/VideoLibraryRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import { motion } from "framer-motion";
import { GlassCard, GlassCardHeader } from "./GlassCard";
import { ModernDonutChart } from "./ModernCharts";

export interface MediaFile {
  id: string;
  name: string;
  type: "image" | "video" | "document" | "other";
  size: number;
  sizeFormatted: string;
  uploadedAt: Date;
  url?: string;
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
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

function getFileIcon(type: MediaFile["type"]): ReactNode {
  return typeConfig[type].icon;
}

export function MediaManager({
  files = [],
  maxSize = 5368709120, // 5GB
  maxSizeFormatted = "5 GB",
  onUpload,
  onDelete,
  storageUsed = 1073741824, // 1GB
  storageTotal = 5368709120, // 5GB
}: MediaManagerProps) {
  const theme = useTheme();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const storagePercentage = (storageUsed / storageTotal) * 100;
  const storageStatus = storagePercentage > 80 ? "warning" : "operational";

  // Calculate storage by type
  const filesByType = files.reduce(
    (acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + file.size;
      return acc;
    },
    {} as Record<string, number>
  );

  const storageData = Object.entries(filesByType).map(([type, size]) => ({
    name: typeConfig[type as MediaFile["type"]].label,
    value: Math.round((size / storageUsed) * 100),
  }));

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    onUpload?.(droppedFiles);
  };

  return (
    <GlassCard>
      <GlassCardHeader title="Media Manager" subtitle="Cloud storage and file management" />

      {/* Storage Usage */}
      <Box
        sx={{
          p: 2,
          borderRadius: "12px",
          backgroundColor: alpha(theme.palette.background.default, 0.3),
          border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          mb: 3,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography sx={{ fontSize: "13px", fontWeight: 600 }}>
            Storage Usage
          </Typography>
          <Typography sx={{ fontSize: "12px", color: theme.palette.text.secondary }}>
            {formatFileSize(storageUsed)} / {maxSizeFormatted}
          </Typography>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={storagePercentage}
          sx={{
            height: 8,
            borderRadius: "4px",
            backgroundColor: alpha(theme.palette.text.secondary, 0.1),
            "& .MuiLinearProgress-bar": {
              backgroundColor:
                storageStatus === "warning"
                  ? "#F59E0B"
                  : "#10B981",
              borderRadius: "4px",
            },
          }}
        />

        <Typography
          sx={{
            fontSize: "11px",
            color: theme.palette.text.secondary,
            mt: 1,
          }}
        >
          {storagePercentage.toFixed(1)}% used
        </Typography>
      </Box>

      {/* Storage Distribution */}
      {storageData.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: "13px", fontWeight: 600, mb: 1.5 }}>
            Storage by Type
          </Typography>
          <Box sx={{ height: 200 }}>
            <ModernDonutChart
              data={storageData}
              height={200}
              innerRadius={40}
              outerRadius={70}
            />
          </Box>
        </Box>
      )}

      {/* Upload Area */}
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: "12px",
          border: `2px dashed ${alpha(
            dragActive ? theme.palette.primary.main : theme.palette.divider,
            0.5
          )}`,
          backgroundColor: dragActive
            ? alpha(theme.palette.primary.main, 0.08)
            : alpha(theme.palette.background.default, 0.3),
          transition: "all 200ms ease",
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        <Stack spacing={1.5} alignItems="center">
          <CloudUploadRoundedIcon
            sx={{
              fontSize: 40,
              color: dragActive
                ? theme.palette.primary.main
                : theme.palette.text.secondary,
            }}
          />
          <Box>
            <Typography sx={{ fontSize: "13px", fontWeight: 600, mb: 0.5 }}>
              {dragActive ? "Drop files here" : "Drag files to upload"}
            </Typography>
            <Typography sx={{ fontSize: "12px", color: theme.palette.text.secondary }}>
              or <Button size="small">browse files</Button>
            </Typography>
          </Box>
          <Typography sx={{ fontSize: "11px", color: theme.palette.text.secondary }}>
            Max size: {maxSizeFormatted} per file
          </Typography>
        </Stack>
      </Box>

      {/* Files List */}
      {files.length > 0 ? (
        <Box>
          <Typography sx={{ fontSize: "13px", fontWeight: 600, mb: 1.5 }}>
            Recent Files ({files.length})
          </Typography>
          <Stack spacing={1}>
            {files.slice(0, 8).map((file, idx) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
              >
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "8px",
                    backgroundColor: alpha(theme.palette.background.default, 0.3),
                    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "8px",
                      backgroundColor: alpha(typeConfig[file.type].color, 0.15),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: typeConfig[file.type].color,
                      flexShrink: 0,
                    }}
                  >
                    {getFileIcon(file.type)}
                  </Box>

                  <Box flex={1} minWidth={0}>
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: theme.palette.text.primary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {file.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "11px",
                        color: theme.palette.text.secondary,
                      }}
                    >
                      {file.sizeFormatted} • {file.uploadedAt.toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <IconButton size="small" title="Download">
                      <DownloadRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onDelete?.(file.id)}
                      title="Delete"
                    >
                      <DeleteRoundedIcon sx={{ fontSize: 16, color: theme.palette.error.main }} />
                    </IconButton>
                  </Stack>
                </Box>
              </motion.div>
            ))}
          </Stack>

          {files.length > 8 && (
            <Box sx={{ mt: 1.5, textAlign: "center" }}>
              <Button size="small">View all {files.length} files</Button>
            </Box>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            textAlign: "center",
            py: 4,
            color: theme.palette.text.secondary,
          }}
        >
          <Typography variant="body2">No files uploaded yet</Typography>
        </Box>
      )}
    </GlassCard>
  );
}
