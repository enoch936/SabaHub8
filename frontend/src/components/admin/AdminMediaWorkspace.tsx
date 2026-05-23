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
      label: "File Name",
      sortable: true,
      filterable: true,
      render: (val, row) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ 
            p: 1, 
            borderRadius: "10px", 
            bgcolor: alpha(getTypeColor(row.resourceType), 0.1),
            color: getTypeColor(row.resourceType)
          }}>
            {getTypeIcon(row.resourceType)}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={800} noWrap>{String(val || "Untitled")}</Typography>
            <Typography variant="caption" color="text.secondary">{row.mimeType}</Typography>
          </Box>
        </Stack>
      )
    },
    {
      key: "scope",
      label: "Scope",
      sortable: true,
      filterable: true,
      badge: true,
    },
    {
      key: "size",
      label: "Size",
      sortable: true,
      render: (val) => formatFileSize(Number(val))
    },
    {
      key: "resourceType",
      label: "Type",
      sortable: true,
      render: (val) => (
        <Chip 
          label={String(val).toUpperCase()} 
          size="small" 
          sx={{ 
            fontWeight: 800, 
            borderRadius: '6px',
            bgcolor: alpha(getTypeColor(String(val)), 0.1),
            color: getTypeColor(String(val))
          }} 
        />
      )
    },
    {
      key: "id",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Preview">
            <IconButton size="small" onClick={() => setPreviewAsset(row)}>
              <VisibilityRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton size="small" component="a" href={row.downloadUrl || row.url} target="_blank" download>
              <DownloadRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton 
              size="small" 
              onClick={() => handleDelete(row.id)} 
              disabled={deletingId === row.id}
              sx={{ color: theme.palette.error.main }}
            >
              <DeleteRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  return (
    <Stack spacing={3}>
      <GlassCard sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={900}>Media Hub</Typography>
            <Typography variant="body2" color="text.secondary">Global asset management and cloud storage intelligence.</Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outline" leftIcon={<RefreshRoundedIcon />} onClick={load}>Sync</Button>
            <Button variant="primary" leftIcon={<CloudUploadRoundedIcon />} onClick={() => setUploadOpen(true)}>Upload Asset</Button>
          </Stack>
        </Stack>
      </GlassCard>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <GlassCard sx={{ p: 3, height: '100%' }}>
            <Stack spacing={3}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}>
                  <StorageRoundedIcon />
                </Box>
                <Typography variant="h6" fontWeight={800}>Storage Usage</Typography>
              </Stack>
              
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" fontWeight={700}>{formatFileSize(analytics?.totalSize || 0)}</Typography>
                  <Typography variant="body2" color="text.secondary">of {formatFileSize(analytics?.storageTotal || 5368709120)}</Typography>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={storagePercentage} 
                  sx={{ height: 10, borderRadius: 5, bgcolor: alpha(theme.palette.divider, 0.1) }}
                />
                <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.6 }}>
                  {storagePercentage.toFixed(2)}% storage capacity utilized.
                </Typography>
              </Box>

              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>Total Assets</Typography>
                  <Typography variant="h5" fontWeight={900}>{analytics?.totalCount || 0}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>Providers</Typography>
                  <Typography variant="h5" fontWeight={900}>Cloudinary</Typography>
                </Box>
              </Stack>
            </Stack>
          </GlassCard>
        </Grid>

        <Grid item xs={12} md={8}>
          <GlassCard sx={{ p: 3, height: '100%' }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main' }}>
                  <PieChartRoundedIcon />
                </Box>
                <Typography variant="h6" fontWeight={800}>File Type Distribution</Typography>
              </Stack>
              
              <Box sx={{ height: 220 }}>
                {chartData.length > 0 ? (
                  <ModernDonutChart 
                    data={chartData} 
                    height={220}
                    innerRadius={60}
                    outerRadius={90}
                  />
                ) : (
                  <Stack height="100%" alignItems="center" justifyContent="center">
                    <Typography variant="body2" color="text.secondary">No distribution data available.</Typography>
                  </Stack>
                )}
              </Box>
            </Stack>
          </GlassCard>
        </Grid>
      </Grid>

      <DataTable
        title="Asset Library"
        columns={columns}
        data={assets}
        rowKey="id"
        loading={loading}
        selectable
        searchable
        exportable
      />

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
