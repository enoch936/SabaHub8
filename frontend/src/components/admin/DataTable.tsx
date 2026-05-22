/**
 * Modern Data Table Component
 * Supports pagination, sorting, filtering, search, bulk actions, and more
 */

"use client";

import { ReactNode, useState, useMemo } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Stack,
  TextField,
  IconButton,
  Chip,
  Typography,
  useTheme,
  alpha,
  Pagination,
  MenuItem,
  Select,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import { GlassCard } from "./GlassCard";
import { motion } from "framer-motion";

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  width?: string | number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  render?: (value: any, row: T) => ReactNode;
  badge?: boolean;
}

export interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: keyof T;
  loading?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  searchable?: boolean;
  filterableColumns?: (keyof T)[];
  exportable?: boolean;
  onExport?: () => void;
  striped?: boolean;
  hoverHighlight?: boolean;
}

type SortDirection = "asc" | "desc" | null;

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  loading = false,
  selectable = false,
  onSelectionChange,
  onRowClick,
  pageSize = 10,
  searchable = true,
  filterableColumns = [],
  exportable = true,
  onExport,
  striped = true,
  hoverHighlight = true,
}: DataTableProps<T>) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [selectedRows, setSelectedRows] = useState<Set<any>>(new Set());

  // Filtering and searching
  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) =>
        filterableColumns.length > 0
          ? filterableColumns.some((col) =>
              String(row[col]).toLowerCase().includes(query)
            )
          : Object.values(row).some((val) =>
              String(val).toLowerCase().includes(query)
            )
      );
    }

    return result;
  }, [data, searchQuery, filterableColumns]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDir]);

  // Pagination
  const paginatedData = useMemo(() => {
    const start = page * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Selection handling
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = new Set(paginatedData.map((row) => row[rowKey]));
      setSelectedRows(allKeys);
      onSelectionChange?.(paginatedData);
    } else {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (row: T, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    const key = row[rowKey];

    if (checked) {
      newSelected.add(key);
    } else {
      newSelected.delete(key);
    }

    setSelectedRows(newSelected);
    const selectedData = paginatedData.filter((r) =>
      newSelected.has(r[rowKey])
    );
    onSelectionChange?.(selectedData);
  };

  const allSelected = paginatedData.length > 0 &&
    paginatedData.every((row) => selectedRows.has(row[rowKey]));

  return (
    <GlassCard>
      {/* Toolbar */}
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        {searchable && (
          <TextField
            placeholder="Search..."
            size="small"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: <SearchRoundedIcon sx={{ mr: 1, color: "text.secondary" }} />,
            }}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                backgroundColor: alpha(theme.palette.background.default, 0.5),
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              },
            }}
          />
        )}

        {selectedRows.size > 0 && (
          <Chip
            label={`${selectedRows.size} selected`}
            color="primary"
            variant="outlined"
          />
        )}

        <Box flex={1} />

        {exportable && onExport && (
          <IconButton size="small" onClick={onExport} title="Export">
            <FileDownloadRoundedIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>

      {/* Table */}
      <Box
        sx={{
          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  borderBottom: `2px solid ${alpha(theme.palette.divider, 0.5)}`,
                }}
              >
                {selectable && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      size="small"
                    />
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell
                    key={String(col.key)}
                    align={col.align || "left"}
                    width={col.width}
                    sx={{
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: col.sortable ? "pointer" : "default",
                      userSelect: "none",
                      "&:hover": col.sortable ? {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      } : {},
                    }}
                    onClick={() => {
                      if (col.sortable) {
                        if (sortKey === col.key) {
                          setSortDir(
                            sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc"
                          );
                        } else {
                          setSortKey(col.key);
                          setSortDir("asc");
                        }
                      }
                    }}
                  >
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <Typography
                        component="span"
                        sx={{ ml: 0.5, fontSize: "10px" }}
                      >
                        {sortDir === "asc" ? "▲" : "▼"}
                      </Typography>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((row, idx) => (
                <motion.tr
                  key={String(row[rowKey])}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                  as={TableRow}
                  onClick={() => onRowClick?.(row)}
                  sx={{
                    backgroundColor: striped && idx % 2 === 1
                      ? alpha(theme.palette.primary.main, 0.03)
                      : "transparent",
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                    cursor: onRowClick ? "pointer" : "default",
                    transition: "background-color 200ms ease",
                    "&:hover": hoverHighlight ? {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    } : {},
                  }}
                >
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedRows.has(row[rowKey])}
                        onChange={(e) => handleSelectRow(row, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        size="small"
                      />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell
                      key={String(col.key)}
                      align={col.align || "left"}
                      sx={{
                        fontSize: "13px",
                        color: theme.palette.text.primary,
                      }}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : col.badge
                        ? <Chip size="small" label={String(row[col.key])} />
                        : String(row[col.key])}
                    </TableCell>
                  ))}
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Pagination */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mt={2}
      >
        <Typography variant="body2" color="text.secondary">
          Showing {paginatedData.length > 0 ? page * pageSize + 1 : 0}-
          {Math.min((page + 1) * pageSize, sortedData.length)} of {sortedData.length}
        </Typography>
        {totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={(_, newPage) => setPage(newPage - 1)}
            size="small"
          />
        )}
      </Stack>
    </GlassCard>
  );
}

// Export CSV utility
export function exportTableToCSV<T>(
  data: T[],
  columns: TableColumn<T>[],
  filename: string = "export.csv"
) {
  const headers = columns.map((col) => col.label).join(",");
  const rows = data
    .map((row) =>
      columns
        .map((col) => {
          const val = row[col.key];
          const str = String(val);
          return str.includes(",") ? `"${str}"` : str;
        })
        .join(",")
    )
    .join("\n");

  const csv = `${headers}\n${rows}`;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}
