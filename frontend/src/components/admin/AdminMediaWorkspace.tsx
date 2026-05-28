"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CardContent,
  Chip,
  Stack,
  Typography,
  useTheme,
  alpha,
  Grid,
  IconButton,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import VideoLibraryRoundedIcon from "@mui/icons-material/VideoLibraryRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import PieChartRoundedIcon from "@mui/icons-material/PieChartRounded";
import { Button } from "../ui";
import { GlassCard } from "./GlassCard";
import { DataTable, type TableColumn } from "./DataTable";
import { adminGetStorageAnalytics, listAssets, type Asset, deleteAsset } from "@/lib/api";
import { ModernDonutChart } from "./ModernCharts";
import NoSsrResponsiveContainer from "@/components/charts/NoSsrResponsiveContainer";
import Uploader from "../Uploader";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function AdminMediaWorkspace() {
  const theme = useTheme();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assetList, stats] = await Promise.all([
        listAssets(),
        adminGetStorageAnalytics()
      ]);
      setAssets(assetList);
      setAnalytics(stats);
    } catch (err) {
      setError("Failed to load media assets and analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this asset? This action cannot be undone.")) return;
    
    setDeletingId(id);
    try {
      await deleteAsset(id);
      toast.success("Asset deleted successfully");
      void load();
    } catch (err) {
      toast.error("Failed to delete asset");
    } finally {
      setDeletingId(null);
    }
  };

  const storagePercentage = useMemo(() => {
    if (!analytics) return 0;
    return (analytics.totalSize / analytics.storageTotal) * 100;
  }, [analytics]);

  const chartData = useMemo(() => {
    if (!analytics) return [];
    return Object.entries(analytics.sizeByType).map(([type, size]) => ({
      name: type.toUpperCase(),
      value: size as number,
    }));
  }, [analytics]);

  const columns: TableColumn<Asset>[] = [
    {
      key: "title",
      label: "Media Orchestration",
      sortable: true,
      render: (val, row) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ 
            width: 48, height: 48, borderRadius: "12px", 
            bgcolor: alpha(getTypeColor(row.resourceType), 0.1),
            color: getTypeColor(row.resourceType),
            display: "grid", placeItems: "center"
          }}>
            {getTypeIcon(row.resourceType)}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={900} noWrap sx={{ letterSpacing: "-0.01em" }}>{String(val || "Unnamed Asset")}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.5 }}>
              {row.mimeType} · #AST-{row.id.slice(-6).toUpperCase()}
            </Typography>
          </Box>
        </Stack>
      )
    },
    {
      key: "owner",
      label: "Origin / Owner",
      render: (_, row) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar 
            sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "var(--glass-gray)", fontSize: 12, fontWeight: 900 }}
          >
            {row.ownerName?.charAt(0) || 'S'}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={800}>{row.ownerName || "Platform System"}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.5, fontWeight: 700 }}>
              {row.ownerName ? `(#USR-${row.ownerId?.slice(-6).toUpperCase()})` : "Global Registry"}
            </Typography>
          </Box>
        </Stack>
      )
    },
    {
      key: "size",
      label: "Data Payload",
      sortable: true,
      render: (val) => (
        <Typography variant="body2" fontWeight={800} color="text.secondary">
          {formatFileSize(Number(val))}
        </Typography>
      )
    },
    {
      key: "resourceType",
      label: "Asset Class",
      render: (val) => (
        <Chip 
          label={String(val).toUpperCase()} 
          size="small" 
          sx={{ 
            fontWeight: 900, 
            borderRadius: '8px',
            height: 24,
            fontSize: 10,
            bgcolor: alpha(getTypeColor(String(val)), 0.1),
            color: getTypeColor(String(val)),
            border: `1px solid ${alpha(getTypeColor(String(val)), 0.2)}`
          }} 
        />
      )
    },
    {
      key: "id",
      label: "Operations",
      align: "right",
      render: (_, row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <IconButton 
            size="small" 
            onClick={() => setPreviewAsset(row)}
            sx={{ bgcolor: "var(--glass-gray)", borderRadius: "10px", "&:hover": { bgcolor: "var(--glass-gray-hover)" } }}
          >
            <VisibilityRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            component="a" href={row.downloadUrl || row.url} target="_blank" download
            sx={{ bgcolor: "var(--glass-gray)", borderRadius: "10px", "&:hover": { bgcolor: "var(--glass-gray-hover)" } }}
          >
            <DownloadRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleDelete(row.id)} 
            disabled={deletingId === row.id}
            sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main, borderRadius: "10px" }}
          >
            <DeleteRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      )
    }
  ];

  return (
    <Stack spacing={4}>
      <GlassCard
        sx={{
          color: "common.white",
          p: 1
        }}
        gradient
      >
        <CardContent>
          <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ lg: "center" }} spacing={3}>
            <Box>
              <Typography variant="overline" sx={{ letterSpacing: "0.2em", opacity: 0.8, fontWeight: 900, fontSize: 11 }}>
                MEDIA ORCHESTRATION & CDN
              </Typography>
              <Typography variant="h3" fontWeight={900} sx={{ lineHeight: 1, mt: 1, letterSpacing: "-0.04em" }}>
                Asset Intelligence Hub
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, opacity: 0.9, maxWidth: 840, fontWeight: 500, lineHeight: 1.6 }}>
                Unified management of platform media, streaming assets, and cloud storage. 
                Monitor ingest velocity, storage optimization, and global content delivery.
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outline"
                onClick={() => void load()}
                isLoading={loading}
                leftIcon={<RefreshRoundedIcon />}
                sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)", backdropFilter: "blur(10px)", height: 48, px: 3 }}
              >
                Sync Registry
              </Button>
              <Button 
                variant="primary" 
                onClick={() => setUploadOpen(true)} 
                leftIcon={<CloudUploadRoundedIcon />} 
                sx={{ bgcolor: "#fff", color: "var(--primary)", height: 48, px: 4, fontWeight: 900, "&:hover": { bgcolor: alpha("#fff", 0.95), transform: "scale(1.02)" } }}
              >
                Ingest Asset
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </GlassCard>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <GlassCard sx={{ height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ p: 1.5, borderRadius: "14px", bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', display: "grid", placeItems: "center" }}>
                    <StorageRoundedIcon />
                  </Box>
                  <Typography variant="h6" fontWeight={900}>Storage Telemetry</Typography>
                </Stack>
                
                <Box>
                  <Stack direction="row" justifyContent="space-between" mb={1.5}>
                    <Typography variant="body2" fontWeight={900} sx={{ letterSpacing: "-0.01em" }}>{formatFileSize(analytics?.totalSize || 0)} Utilized</Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={700}>of {formatFileSize(analytics?.storageTotal || 5368709120)}</Typography>
                  </Stack>
                  <LinearProgress 
                    variant="determinate" 
                    value={storagePercentage} 
                    sx={{ height: 12, borderRadius: 6, bgcolor: "var(--glass-gray)", "& .MuiLinearProgress-bar": { borderRadius: 6, bgcolor: "var(--primary)" } }}
                  />
                  <Typography variant="caption" sx={{ mt: 1.5, display: 'block', opacity: 0.6, fontWeight: 800 }}>
                    {storagePercentage.toFixed(2)}% of total platform allocation consumed.
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: "16px", bgcolor: "var(--glass-gray)", border: "1px solid var(--border)" }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={900} sx={{ textTransform: "uppercase", fontSize: 9 }}>Total Objects</Typography>
                      <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5 }}>{analytics?.totalCount || 0}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: "16px", bgcolor: "var(--glass-gray)", border: "1px solid var(--border)" }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={900} sx={{ textTransform: "uppercase", fontSize: 9 }}>Providers</Typography>
                      <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5 }}>Cloudinary</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </GlassCard>
        </Grid>

        <Grid item xs={12} md={8}>
          <GlassCard sx={{ height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ p: 1.5, borderRadius: "14px", bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', display: "grid", placeItems: "center" }}>
                    <PieChartRoundedIcon />
                  </Box>
                  <Typography variant="h6" fontWeight={900}>Payload Distribution</Typography>
                </Stack>
                
                <Box sx={{ height: 240, width: "100%" }}>
                  {chartData.length > 0 ? (
                    <NoSsrResponsiveContainer fallbackHeight={240}>
                      <ModernDonutChart 
                        data={chartData} 
                        height={240}
                        innerRadius={65}
                        outerRadius={95}
                      />
                    </NoSsrResponsiveContainer>
                  ) : (
                    <Stack height="100%" alignItems="center" justifyContent="center">
                      <Typography variant="body2" color="text.secondary" fontWeight={700}>Telemetry initializing...</Typography>
                    </Stack>
                  )}
                </Box>
              </Stack>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>

      <GlassCard>
        <CardContent sx={{ p: 4 }}>
          <DataTable
            title="Production Asset Registry"
            columns={columns}
            data={assets}
            rowKey="id"
            loading={loading}
            selectable
            searchable
            exportable
          />
        </CardContent>
      </GlassCard>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Upload New Asset</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Uploader 
              scope="CONTENT" 
              folder="admin-assets" 
              onUploaded={() => {
                setUploadOpen(false);
                void load();
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog 
        open={Boolean(previewAsset)} 
        onClose={() => setPreviewAsset(null)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden', bgcolor: '#000' } }}
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton 
            onClick={() => setPreviewAsset(null)}
            sx={{ position: 'absolute', right: 16, top: 16, zIndex: 1, bgcolor: 'rgba(255,255,255,0.1)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <RefreshRoundedIcon sx={{ transform: 'rotate(45deg)' }} />
          </IconButton>
          
          <Box sx={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
            {previewAsset?.resourceType === 'image' && (
              <Box component="img" src={previewAsset.url} sx={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} />
            )}
            {previewAsset?.resourceType === 'video' && (
              <Box component="video" controls src={previewAsset.url} sx={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '12px' }} />
            )}
            {previewAsset?.resourceType !== 'image' && previewAsset?.resourceType !== 'video' && (
              <Stack spacing={2} alignItems="center" color="#fff">
                <Box sx={{ p: 3, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }}>
                  <DescriptionRoundedIcon sx={{ fontSize: 64, opacity: 0.5 }} />
                </Box>
                <Typography variant="h6" fontWeight={700}>{previewAsset?.title || "No preview available"}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.6 }}>{previewAsset?.mimeType}</Typography>
                <Button variant="primary" component="a" href={previewAsset?.url} target="_blank">Open in new tab</Button>
              </Stack>
            )}
          </Box>
          
          <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="subtitle1" fontWeight={800} color="#fff">{previewAsset?.title || "Asset Preview"}</Typography>
                <Typography variant="caption" color="rgba(255,255,255,0.5)">{previewAsset?.id}</Typography>
              </Box>
              <Chip label={formatFileSize(previewAsset?.size || 0)} sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 800 }} />
            </Stack>
          </Box>
        </Box>
      </Dialog>
    </Stack>
  );
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'image': return <ImageRoundedIcon />;
    case 'video': return <VideoLibraryRoundedIcon />;
    case 'raw': return <DescriptionRoundedIcon />;
    default: return <FolderRoundedIcon />;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'image': return '#06B6D4';
    case 'video': return '#8B5CF6';
    case 'raw': return '#F59E0B';
    default: return '#94A3B8';
  }
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
