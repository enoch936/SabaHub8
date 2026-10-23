/**
 * Modern Data Table Component (Powered by TanStack Table & TanStack Virtual)
 * Production-grade table with virtualization, sorting, filtering, and bulk actions
 */

"use client";

import React, { ReactNode, useState, useMemo, useRef, useEffect } from "react";
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
  Collapse,
  Menu as MuiMenu,
  Tooltip,
  Popover,
  InputAdornment,
} from "@mui/material";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
  Row,
} from "@tanstack/react-table";
import { useVirtualizer, VirtualItem } from "@tanstack/react-virtual";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { GlassCard } from "./GlassCard";
import { Button } from "../ui";
import { motion, AnimatePresence } from "framer-motion";

const MotionTableRow = motion(TableRow);

export interface BulkAction<T> {
  label: string;
  value: string;
  icon?: ReactNode;
  color?: "primary" | "secondary" | "error" | "warning" | "info" | "success" | "danger";
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  align?: "left" | "center" | "right";
  width?: string | number;
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
  exportable?: boolean;
  onExport?: (format: "csv" | "pdf") => void;
  striped?: boolean;
  hoverHighlight?: boolean;
  expandableContent?: (row: T) => ReactNode;
  bulkActions?: BulkAction<T>[];
  onBulkAction?: (action: string, selected: T[]) => void;
  title?: string;
  maxHeight?: string | number;
  virtualized?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  columns: userColumns,
  data,
  rowKey,
  loading = false,
  selectable = false,
  onSelectionChange,
  onRowClick,
  pageSize = 10,
  searchable = true,
  exportable = true,
  onExport,
  striped = false,
  hoverHighlight = true,
  expandableContent,
  bulkActions = [],
  onBulkAction,
  title,
  maxHeight = 600,
  virtualized = false,
}: DataTableProps<T>) {
  const theme = useTheme();
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  const [expandedRows, setExpandedRows] = useState<Set<any>>(new Set());
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

  const tableColumns = useMemo<ColumnDef<T>[]>(() => {
    return userColumns.map((col, index) => ({
      id: `${String(col.key)}-${index}`,
      accessorKey: col.key as string,
      header: col.label,
      cell: (info) => {
        const value = info.getValue();
        const row = info.row.original;
        if (col.render) return col.render(value, row);
        if (col.badge) return (
            <Chip 
              size="small" 
              label={String(value)} 
              sx={{ 
                fontWeight: 800, 
                borderRadius: "6px",
                height: 20,
                fontSize: "10px",
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
              }} 
            />
        );
        return String(value ?? "");
      },
      enableSorting: col.sortable !== false,
      enableColumnFilter: col.filterable !== false,
      meta: {
          align: col.align || "left",
          width: col.width
      }
    }));
  }, [userColumns, theme.palette.primary.main]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: virtualized ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
        pagination: {
            pageSize: pageSize,
        }
    }
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 52, // Estimated row height
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
  const paddingBottom = virtualRows.length > 0 ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0) : 0;

  useEffect(() => {
    const selected = table.getSelectedRowModel().flatRows.map(r => r.original);
    onSelectionChange?.(selected);
  }, [rowSelection, onSelectionChange, table]);

  const toggleRowExpansion = (rowId: any) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <GlassCard sx={{ p: 0, overflow: "hidden", position: "relative" }}>
      {/* Toolbar */}
      <Box sx={{ p: 2.5, borderBottom: `1px solid var(--border)`, backdropFilter: "blur(10px)", bgcolor: alpha(theme.palette.background.paper, 0.4) }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
          {title && (
            <Typography variant="h6" fontWeight={800} sx={{ mr: 2 }}>
              {title}
            </Typography>
          )}
          
          {searchable && (
            <TextField
              placeholder="Global search..."
              size="small"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              InputProps={{
                startAdornment: <SearchRoundedIcon sx={{ mr: 1.5, color: "text.secondary", fontSize: 20 }} />,
              }}
              sx={{
                flex: 1,
                maxWidth: 400,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  backgroundColor: alpha(theme.palette.text.primary, 0.03),
                  "& fieldset": { borderColor: "transparent" },
                  "&:hover fieldset": { borderColor: alpha(theme.palette.divider, 0.2) },
                },
              }}
            />
          )}

          <Box flex={1} />

          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
            {table.getSelectedRowModel().flatRows.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Chip
                    label={`${table.getSelectedRowModel().flatRows.length} selected`}
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 800, borderRadius: "8px", mr: 1 }}
                  />
                  {bulkActions.map((action) => (
                    <Button
                      key={action.value}
                      size="sm"
                      variant={action.color === "danger" || action.color === "error" ? "danger" : "outline"}
                      leftIcon={action.icon}
                      onClick={() => onBulkAction?.(action.value, table.getSelectedRowModel().flatRows.map(r => r.original))}
                      sx={{ borderRadius: "10px", fontWeight: 700 }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </motion.div>
            )}
            
            <Tooltip title="Reset All Filters">
              <IconButton 
                size="small" 
                onClick={() => { table.resetColumnFilters(); table.resetGlobalFilter(); table.resetSorting(); }}
                sx={{ borderRadius: "10px", border: `1px solid var(--border)`, opacity: (columnFilters.length > 0 || globalFilter) ? 1 : 0.5 }}
              >
                <FilterListRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {exportable && (
              <>
                <IconButton 
                  size="small" 
                  onClick={(e) => setExportAnchor(e.currentTarget)} 
                  sx={{ borderRadius: "10px", border: `1px solid var(--border)` }}
                  title="Export Data"
                >
                  <FileDownloadRoundedIcon fontSize="small" />
                </IconButton>
                <MuiMenu
                  anchorEl={exportAnchor}
                  open={Boolean(exportAnchor)}
                  onClose={() => setExportAnchor(null)}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      borderRadius: "12px",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                      border: "1px solid var(--border)",
                      backdropFilter: "blur(20px)",
                      bgcolor: alpha(theme.palette.background.paper, 0.8),
                    }
                  }}
                >
                  <MenuItem onClick={() => { onExport?.("csv"); setExportAnchor(null); }}>Export as CSV</MenuItem>
                  <MenuItem onClick={() => { onExport?.("pdf"); setExportAnchor(null); }}>Export as PDF</MenuItem>
                </MuiMenu>
              </>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Table Content */}
      <TableContainer ref={tableContainerRef} sx={{ maxHeight, overflowX: "auto" }}>
        <Table stickyHeader size="medium">
          <TableHead>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {expandableContent && <TableCell sx={{ width: 40, bgcolor: alpha(theme.palette.background.paper, 0.9), backdropFilter: "blur(5px)" }} />}
                {selectable && (
                  <TableCell padding="checkbox" sx={{ bgcolor: alpha(theme.palette.background.paper, 0.9), backdropFilter: "blur(5px)" }}>
                    <Checkbox
                      checked={table.getIsAllPageRowsSelected()}
                      indeterminate={table.getIsSomePageRowsSelected()}
                      onChange={table.getToggleAllPageRowsSelectedHandler()}
                      size="small"
                    />
                  </TableCell>
                )}
                {headerGroup.headers.map((header, headerIndex) => {
                    const meta = header.column.columnDef.meta as any;
                    return (
                        <TableCell
                          key={`${headerGroup.id}-${header.id}-${headerIndex}`}
                          align={meta?.align || "left"}
                          width={meta?.width}
                          sx={{
                            bgcolor: alpha(theme.palette.background.paper, 0.9),
                            backdropFilter: "blur(5px)",
                            fontWeight: 800,
                            fontSize: "10px",
                            textTransform: "uppercase",
                            letterSpacing: "0.12em",
                            color: "text.secondary",
                            borderBottom: `2px solid var(--border)`,
                            py: 1.5,
                            cursor: header.column.getCanSort() ? "pointer" : "default",
                            userSelect: "none",
                            whiteSpace: "nowrap",
                            transition: "all 0.2s",
                            "&:hover": header.column.getCanSort() ? {
                              color: "primary.main",
                              bgcolor: alpha(theme.palette.primary.main, 0.02),
                            } : {},
                          }}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <Stack direction="row" alignItems="center" spacing={0.5} justifyContent={meta?.align === "center" ? "center" : meta?.align === "right" ? "flex-end" : "flex-start"}>
                            <Box>
                                {flexRender(header.column.columnDef.header, header.getContext())}
                            </Box>
                            {header.column.getCanSort() && (
                                <Box sx={{ color: "primary.main", display: "flex", alignItems: "center" }}>
                                  {{
                                    asc: <KeyboardArrowUpRoundedIcon sx={{ fontSize: 16 }} />,
                                    desc: <KeyboardArrowDownRoundedIcon sx={{ fontSize: 16 }} />,
                                  }[header.column.getIsSorted() as string] ?? null}
                                </Box>
                            )}
                          </Stack>
                        </TableCell>
                    );
                })}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {paddingTop > 0 && (
              <TableRow>
                <TableCell colSpan={99} style={{ height: `${paddingTop}px` }} />
              </TableRow>
            )}
            
            {(virtualized ? virtualRows : rows).map((item, idx) => {
              const row = (virtualized ? rows[(item as VirtualItem).index] : item) as Row<T>;
              const isExpanded = expandedRows.has(row.original[rowKey]);
              const isSelected = row.getIsSelected();
              
              return (
                <React.Fragment key={row.id}>
                  <MotionTableRow
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1, 
                      backgroundColor: isSelected 
                        ? alpha(theme.palette.primary.main, 0.08)
                        : striped && idx % 2 === 1
                        ? alpha(theme.palette.text.primary, 0.01)
                        : "transparent",
                    }}
                    onClick={() => onRowClick?.(row.original)}
                    sx={{
                      borderBottom: isExpanded ? "none" : `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                      cursor: onRowClick ? "pointer" : "default",
                      transition: "background-color 0.2s ease",
                      "&:hover": hoverHighlight ? {
                        backgroundColor: isSelected 
                          ? alpha(theme.palette.primary.main, 0.12)
                          : alpha(theme.palette.primary.main, 0.04),
                      } : {},
                    }}
                  >
                    {expandableContent && (
                      <TableCell padding="checkbox">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleRowExpansion(row.original[rowKey]); }}>
                          {isExpanded ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}
                        </IconButton>
                      </TableCell>
                    )}
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={row.getToggleSelectedHandler()}
                          onClick={(e) => e.stopPropagation()}
                          size="small"
                        />
                      </TableCell>
                    )}
                    {row.getVisibleCells().map(cell => {
                      const meta = cell.column.columnDef.meta as any;
                      return (
                        <TableCell
                          key={cell.id}
                          align={meta?.align || "left"}
                          sx={{
                            fontSize: "13.5px",
                            fontWeight: 500,
                            color: "text.primary",
                            py: 1.5,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </MotionTableRow>
                  
                  {expandableContent && (
                    <TableRow>
                      <TableCell sx={{ p: 0, borderBottom: isExpanded ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : "none" }} colSpan={table.getVisibleFlatColumns().length + (selectable ? 1 : 0) + 1}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 3, bgcolor: alpha(theme.palette.text.primary, 0.02), borderLeft: `4px solid ${theme.palette.primary.main}` }}>
                            {expandableContent(row.original)}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}

            {paddingBottom > 0 && (
              <TableRow>
                <TableCell colSpan={99} style={{ height: `${paddingBottom}px` }} />
              </TableRow>
            )}
            
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={99} sx={{ py: 12, textAlign: "center" }}>
                  <Stack spacing={1} alignItems="center">
                    <SearchRoundedIcon sx={{ fontSize: 48, opacity: 0.1 }} />
                    <Typography variant="body1" fontWeight={700} color="text.secondary">No matching records found</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.7 }}>Try adjusting your search or filters</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {!virtualized && (
        <Box sx={{ p: 2, borderTop: `1px solid var(--border)`, backdropFilter: "blur(10px)", bgcolor: alpha(theme.palette.background.paper, 0.4) }}>
            <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
            >
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", opacity: 0.8 }}>
                Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} records
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" color="text.secondary">Rows per page:</Typography>
                <Select
                    size="small"
                    value={table.getState().pagination.pageSize}
                    onChange={e => table.setPageSize(Number(e.target.value))}
                    sx={{ height: 28, fontSize: '12px', borderRadius: '8px' }}
                >
                    {[5, 10, 20, 30, 40, 50].map(size => (
                    <MenuItem key={size} value={size}>{size}</MenuItem>
                    ))}
                </Select>
                <Pagination
                    count={table.getPageCount()}
                    page={table.getState().pagination.pageIndex + 1}
                    onChange={(_, p) => table.setPageIndex(p - 1)}
                    size="small"
                    sx={{
                        "& .MuiPaginationItem-root": {
                            borderRadius: "8px",
                            fontWeight: 800,
                            fontSize: "12px",
                            "&.Mui-selected": {
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: "primary.main",
                                "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                            }
                        }
                    }}
                />
            </Stack>
            </Stack>
        </Box>
      )}
    </GlassCard>
  );
}
