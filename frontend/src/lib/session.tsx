"use client";

import { Fragment, ReactNode } from "react";
import clsx from "clsx";
import { 
  Avatar as MuiAvatar, Box, Chip, CircularProgress, Dialog, DialogActions, 
  DialogContent, DialogTitle, FormControl, LinearProgress, MenuItem, Paper, 
  Select as MuiSelect, Skeleton as MuiSkeleton, Tab, Tabs as MuiTabs, 
  Table as MuiTable, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  type TextFieldProps, Typography,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/lib/session";
import SoftButton from "@/components/mui/SoftButton";
import SoftCard from "@/components/mui/SoftCard";
import SoftTextField from "@/components/mui/SoftTextField";

export function cn(...args: any[]) { 
  return clsx(args);
}

export function GlassPanel({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass p-6 rounded-[32px] border border-white/10 shadow-glass", className)} {...props}>
      {children}
    </div>
  );
}

export function GlassCard({ children, className, hover = true, ...props }: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <motion.div
      whileHover={hover ? { y: -8, scale: 1.02, borderColor: "rgba(255,255,255,0.2)" } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn("glass-card p-6 border border-white/5", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Card({ children, className, variant = "default", hover = false, ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "bordered" | "elevated"; hover?: boolean; }) {
  return (
    <SoftCard 
      className={cn("glass transition-all duration-300", className)} 
      sx={{ 
        borderRadius: "24px",
        border: variant === "bordered" ? "2px solid" : "1px solid", 
        borderColor: "divider",
        ...(hover ? { 
          cursor: "pointer", 
          "&:hover": { 
            transform: "translateY(-4px)", 
            borderColor: "primary.main",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)" 
          }, 
        } : {}), 
      }} 
      {...props} 
    >
      {children}
    </SoftCard>
  );
}

export function Badge({ children, variant = "default", size = "md", className }: { children: ReactNode; className?: string; variant?: "default" | "outline" | "success" | "warning" | "danger" | "info" | "purple"; size?: "sm" | "md" | "lg"; }) {
  const colorMap: Record<string, "default" | "success" | "warning" | "error" | "info" | "secondary" | "primary"> = {
    default: "default", outline: "default", success: "success", warning: "warning", danger: "error", info: "info", purple: "secondary",
  };
  const chipColor = (colorMap[variant] ?? "default") as any;
  return (
    <Chip 
      label={children as any} 
      size={size === "lg" ? "medium" : "small"} 
      color={chipColor} 
      variant={variant === "outline" ? "outlined" : "filled"} 
      className={cn("backdrop-blur-md border-white/10", className)}
      sx={{ borderRadius: "10px", fontWeight: 600 }}
    />
  );
}

export function Button({ children, variant = "primary", size = "md", className, isLoading, leftIcon, rightIcon, ...props }: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> & { variant?: "primary" | "secondary" | "outline" | "danger"; size?: "sm" | "md" | "lg"; isLoading?: boolean; leftIcon?: ReactNode; rightIcon?: ReactNode; }) {
  const muiVariant: "outlined" | "contained" = variant === "outline" ? "outlined" : "contained";
  const muiColor: "error" | "secondary" | "primary" = variant === "danger" ? "error" : variant === "secondary" ? "secondary" : "primary";

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <SoftButton 
        variant={muiVariant} 
        color={muiColor} 
        size={size === "lg" ? "large" : size === "sm" ? "small" : "medium"} 
        className={cn("glass-button", className)} 
        disabled={Boolean(props.disabled || isLoading)} 
        startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : leftIcon} 
        endIcon={!isLoading ? rightIcon : undefined} 
        {...props as any}
      >
        {isLoading ? "Loading..." : children}
      </SoftButton>
    </motion.div>
  );
}

export function Input(props: TextFieldProps) {
  return <SoftTextField fullWidth size="small" variant="outlined" className="glass-input" {...props} />;
}

export function Modal({ open, onClose, title, children, actions }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; actions?: ReactNode; }) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      PaperProps={{
        sx: {
          bgcolor: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "32px",
        }
      }}
    >
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
            {title ? <DialogTitle sx={{ fontWeight: 800, fontSize: "1.5rem" }}>{title}</DialogTitle> : null}
            <DialogContent dividers sx={{ borderColor: "white/5" }}>{children}</DialogContent>
            {actions ? <DialogActions sx={{ p: 3 }}>{actions}</DialogActions> : null}
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
 export function Tabs({ tabs, value, onChange,
}: { tabs: { key: string; label: string }[]; value: string; onChange: (key: string) => void;
}) { const index = Math.max(0, tabs.findIndex((t) => t.key === value)); return ( <MuiTabs value={index} onChange={(_, i) => onChange(tabs[i]?.key ?? value)} variant="scrollable" scrollButtons="auto"> {tabs.map((tab) => ( <Tab key={tab.key} label={tab.label} /> ))} </MuiTabs> );
} export function Table({ columns, rows,
}: { columns: { key: string; header: string; render?: (row: any) => ReactNode }[]; rows: any[];
}) { return ( <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}> <MuiTable size="small"> <TableHead> <TableRow> {columns.map((c) => ( <TableCell key={c.key} sx={{ fontWeight: 700 }}>{c.header}</TableCell> ))} </TableRow> </TableHead> <TableBody> {rows.map((r, i) => ( <TableRow key={i} hover> {columns.map((c) => ( <TableCell key={c.key}>{c.render ? c.render(r) : r[c.key]}</TableCell> ))} </TableRow> ))} {rows.length === 0 ? ( <TableRow> <TableCell align="center" colSpan={columns.length}>No data</TableCell> </TableRow> ) : null} </TableBody> </MuiTable> </TableContainer> );
} export function EmptyState({ title = "Nothing here", hint }: { title?: string; hint?: string }) { return ( <Paper variant="outlined" sx={{ p: 3, textAlign: "center", borderRadius: 2 }}> <Typography variant="subtitle1" fontWeight={700}>{title}</Typography> {hint ? <Typography variant="body2" color="text.secondary">{hint}</Typography> : null} </Paper> );
} export function LoadingState({ label = "Loading" }: { label?: string }) { return ( <Paper variant="outlined" sx={{ p: 3, textAlign: "center", borderRadius: 2 }}> <Typography variant="body2" color="text.secondary">{label}...</Typography> </Paper> );
} export function ErrorState({ message = "Something went wrong" }: { message?: string }) { return ( <Paper variant="outlined" sx={{ p: 3, textAlign: "center", borderRadius: 2, borderColor: "error.light", bgcolor: "error.50" }}> <Typography variant="subtitle2" color="error.main">{message}</Typography> </Paper> );
} export function RoleGate({ allow, children }: { allow: ("ADMIN" | "EMPLOYER" | "FREELANCER")[]; children: ReactNode }) { const role = useSession((s) => s.role); if (!role || !allow.includes(role)) return null; return <Fragment>{children}</Fragment>;
}
