"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FeedRoundedIcon from "@mui/icons-material/FeedRounded";
import PublishRoundedIcon from "@mui/icons-material/PublishRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SoftButton from "@/components/mui/SoftButton";
import SoftCard from "@/components/mui/SoftCard";
import SoftTextField from "@/components/mui/SoftTextField";
import {
  type ContentItem,
  adminCreateContent,
  adminListContent,
  adminUpdateContent,
} from "@/lib/api";

const contentTypes = ["FAQ", "PAGE", "BLOG", "CATEGORY", "ANNOUNCEMENT"] as const;
const contentStatuses = ["DRAFT", "PUBLISHED"] as const;

type ContentFormState = {
  type: string;
  slug: string;
  title: string;
  body: string;
  status: string;
};

const emptyForm: ContentFormState = {
  type: "FAQ",
  slug: "",
  title: "",
  body: "",
  status: "DRAFT",
};

function formatDateTime(value?: string) {
  if (!value) {
    return "Not recorded";
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Date(parsed).toLocaleString();
}

function toFormState(item: ContentItem): ContentFormState {
  return {
    type: item.type ?? "FAQ",
    slug: item.slug ?? "",
    title: item.title ?? "",
    body: item.body ?? "",
    status: item.status ?? "DRAFT",
  };
}

export default function AdminContentGovernanceWorkspace() {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [form, setForm] = useState<ContentFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [busyContentId, setBusyContentId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminListContent();
      setContentItems(result);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to load content governance.";
      setError(message);
      setContentItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo(() => {
    const drafts = contentItems.filter((item) => (item.status ?? "").toUpperCase() === "DRAFT").length;
    const published = contentItems.filter((item) => (item.status ?? "").toUpperCase() === "PUBLISHED").length;
    const faq = contentItems.filter((item) => (item.type ?? "").toUpperCase() === "FAQ").length;
    const announcements = contentItems.filter((item) => (item.type ?? "").toUpperCase() === "ANNOUNCEMENT").length;
    return { total: contentItems.length, drafts, published, faq, announcements };
  }, [contentItems]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return contentItems.filter((item) => {
      const type = (item.type ?? "").toUpperCase();
      const status = (item.status ?? "").toUpperCase();
      if (typeFilter !== "all" && type !== typeFilter) {
        return false;
      }
      if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      return [
        item.id,
        item.title ?? "",
        item.slug ?? "",
        item.body ?? "",
      ].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [contentItems, query, statusFilter, typeFilter]);

  const openCreate = () => {
    setDialogMode("create");
    setEditingItem(null);
    setForm(emptyForm);
    setActionStatus(null);
  };

  const openEdit = (item: ContentItem) => {
    setDialogMode("edit");
    setEditingItem(item);
    setForm(toFormState(item));
    setActionStatus(null);
  };

  const closeDialog = () => {
    if (submitting) {
      return;
    }
    setDialogMode(null);
    setEditingItem(null);
    setForm(emptyForm);
  };

  const patchLocalItem = (updated: ContentItem) => {
    setContentItems((current) => {
      const exists = current.some((item) => item.id === updated.id);
      if (!exists) {
        return [updated, ...current];
      }
      return current.map((item) => (item.id === updated.id ? updated : item));
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setActionStatus(null);
    try {
      if (dialogMode === "create") {
        const created = await adminCreateContent({
          type: form.type,
          slug: form.slug.trim() || undefined,
          title: form.title.trim(),
          body: form.body.trim(),
          status: form.status,
        });
        patchLocalItem(created);
        setActionStatus(`Content ${created.title} created.`);
      } else if (dialogMode === "edit" && editingItem) {
        const updated = await adminUpdateContent(editingItem.id, {
          type: form.type,
          slug: form.slug.trim() || undefined,
          title: form.title.trim(),
          body: form.body.trim(),
          status: form.status,
        });
        patchLocalItem(updated);
        setActionStatus(`Content ${updated.title} updated.`);
      }
      closeDialog();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to save content item.";
      setActionStatus(message);
    } finally {
      setSubmitting(false);
    }
  };

  const togglePublish = async (item: ContentItem, publish: boolean) => {
    setBusyContentId(item.id);
    setActionStatus(null);
    try {
      const updated = await adminUpdateContent(item.id, { status: publish ? "PUBLISHED" : "DRAFT" });
      patchLocalItem(updated);
      setActionStatus(`${updated.title} ${publish ? "published" : "moved to draft"}.`);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to update content status.";
      setActionStatus(message);
    } finally {
      setBusyContentId(null);
    }
  };

  return (
    <Stack spacing={2.2}>
      <SoftCard
        sx={{
          border: "1px solid",
          borderColor: "rgba(24,40,59,0.16)",
          background: "linear-gradient(135deg, #16222f 0%, #28434b 55%, #586858 100%)",
          color: "common.white",
        }}
      >
        <CardContent>
          <Stack spacing={1.2}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={1}>
              <Box>
                <Typography variant="overline" sx={{ letterSpacing: "0.14em", opacity: 0.82 }}>
                  PLATFORM GOVERNANCE
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.02 }}>
                  Content governance is now a real workspace
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.4, opacity: 0.9, maxWidth: 780 }}>
                  Create policy and marketplace content, edit governance documents, and publish or unpublish platform
                  communications from a real admin console.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <SoftButton
                  variant="outlined"
                  onClick={() => void load()}
                  disabled={loading}
                  startIcon={<RefreshRoundedIcon />}
                  sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.55)" }}
                >
                  Refresh
                </SoftButton>
                <SoftButton variant="contained" color="info" startIcon={<AddRoundedIcon />} onClick={openCreate}>
                  New Content
                </SoftButton>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </SoftCard>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {actionStatus ? <Alert severity="info">{actionStatus}</Alert> : null}

      <Grid container spacing={2}>
        {[
          { label: "Total Items", value: metrics.total, icon: <DescriptionRoundedIcon fontSize="small" /> },
          { label: "Drafts", value: metrics.drafts, icon: <EditRoundedIcon fontSize="small" /> },
          { label: "Published", value: metrics.published, icon: <PublishRoundedIcon fontSize="small" /> },
          { label: "FAQ", value: metrics.faq, icon: <FeedRoundedIcon fontSize="small" /> },
          { label: "Announcements", value: metrics.announcements, icon: <CampaignRoundedIcon fontSize="small" /> },
        ].map((metric) => (
          <Grid key={metric.label} size={{ xs: 12, sm: 6, lg: 4, xl: 2.4 }}>
            <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
              <CardContent>
                <Stack spacing={0.8}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      {metric.label}
                    </Typography>
                    {metric.icon}
                  </Stack>
                  <Typography variant="h4" fontWeight={900}>
                    {metric.value}
                  </Typography>
                </Stack>
              </CardContent>
            </SoftCard>
          </Grid>
        ))}
      </Grid>

      <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Grid container spacing={1.2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <SoftTextField
                fullWidth
                label="Search content"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Title, slug, body"
                InputProps={{ startAdornment: <SearchRoundedIcon sx={{ fontSize: 18, mr: 1, color: "text.secondary" }} /> }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="content-type-filter">Content Type</InputLabel>
                <Select
                  labelId="content-type-filter"
                  value={typeFilter}
                  label="Content Type"
                  onChange={(event) => setTypeFilter(event.target.value)}
                >
                  <MenuItem value="all">All types</MenuItem>
                  {contentTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="content-status-filter">Status</InputLabel>
                <Select
                  labelId="content-status-filter"
                  value={statusFilter}
                  label="Status"
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <MenuItem value="all">All statuses</MenuItem>
                  {contentStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </SoftCard>

      <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, pb: 1 }}>
            <Typography variant="h6" fontWeight={800}>
              Governance Content Library
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Edit governance content, monitor draft backlog, and control publishing state directly from the admin area.
            </Typography>
          </Box>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Content</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.map((item) => {
                  const busy = busyContentId === item.id;
                  const published = (item.status ?? "").toUpperCase() === "PUBLISHED";
                  return (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ minWidth: 300 }}>
                        <Stack spacing={0.25}>
                          <Typography variant="subtitle2" fontWeight={800}>
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.slug || item.id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(item.body || "No content body").slice(0, 120)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{item.type || "FAQ"}</TableCell>
                      <TableCell>{item.status || "DRAFT"}</TableCell>
                      <TableCell>{formatDateTime(item.updatedAt || item.createdAt)}</TableCell>
                      <TableCell align="right" sx={{ minWidth: 260 }}>
                        <Stack direction="row" spacing={0.8} justifyContent="flex-end">
                          <SoftButton variant="outlined" size="small" startIcon={<EditRoundedIcon />} onClick={() => openEdit(item)} disabled={busy}>
                            Edit
                          </SoftButton>
                          <SoftButton
                            variant="outlined"
                            size="small"
                            color={published ? "warning" : "success"}
                            startIcon={<PublishRoundedIcon />}
                            onClick={() => void togglePublish(item, !published)}
                            disabled={busy}
                          >
                            {published ? "Draft" : "Publish"}
                          </SoftButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!loading && filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      No content items match the current filters.
                    </TableCell>
                  </TableRow>
                ) : null}
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      Loading governance content...
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </SoftCard>

      <Dialog open={dialogMode !== null} onClose={closeDialog} fullWidth maxWidth="md">
        <DialogTitle>{dialogMode === "create" ? "Create Governance Content" : "Edit Governance Content"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.4} sx={{ mt: 0.5 }}>
            <Grid container spacing={1.2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="content-form-type">Type</InputLabel>
                  <Select
                    labelId="content-form-type"
                    value={form.type}
                    label="Type"
                    onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                  >
                    {contentTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="content-form-status">Status</InputLabel>
                  <Select
                    labelId="content-form-status"
                    value={form.status}
                    label="Status"
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                  >
                    {contentStatuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <SoftTextField
                  fullWidth
                  label="Slug"
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                  placeholder="policy-updates"
                />
              </Grid>
            </Grid>
            <SoftTextField
              fullWidth
              label="Title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
            <SoftTextField
              fullWidth
              label="Body"
              value={form.body}
              onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
              multiline
              minRows={10}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <SoftButton variant="outlined" onClick={closeDialog}>
            Cancel
          </SoftButton>
          <SoftButton
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={submitting || !form.title.trim() || !form.body.trim()}
          >
            {dialogMode === "create" ? "Create" : "Save"}
          </SoftButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
