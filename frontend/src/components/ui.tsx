"use client"; import { Fragment, ReactNode } from "react";
import clsx from "clsx";
import { Avatar as MuiAvatar, Box, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, LinearProgress, MenuItem, Paper, Select as MuiSelect, Skeleton as MuiSkeleton, Tab, Tabs as MuiTabs, Table as MuiTable, TableBody, TableCell, TableContainer, TableHead, TableRow, type TextFieldProps, Typography, SxProps, Theme,
} from "@mui/material";
import { useSession } from "@/lib/session";
import SoftButton from "@/components/mui/SoftButton";
import SoftCard from "@/components/mui/SoftCard";
import SoftTextField from "@/components/mui/SoftTextField"; export function cn(...args: any[]) { return clsx(args);
} export function Card({ children, className, variant = "default", hover = false, ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "bordered" | "elevated"; hover?: boolean; sx?: SxProps<Theme>;
}) { return ( <SoftCard className={clsx(className, hover && "hover-fb")} sx={{ border: variant === "bordered" ? "2px solid" : "1px solid", borderColor: "divider", boxShadow: variant === "elevated" ? 5 : 2, transition: "background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease", ...(hover ? { cursor: "pointer", "&:hover": { transform: "none", boxShadow: 10, backgroundColor: "var(--glass-gray-hover)" }, } : {}), ...(props.sx || {}), }} {...props} > {children} </SoftCard> );
} export function Badge({ children, variant = "default", size = "md", className,
}: { children: ReactNode; className?: string; variant?: "default" | "outline" | "success" | "warning" | "danger" | "info" | "purple"; size?: "sm" | "md" | "lg";
}) { const colorMap: Record<string, "default" | "success" | "warning" | "error" | "info" | "secondary" | "primary"> = { default: "default", outline: "default", success: "success", warning: "warning", danger: "error", info: "info", purple: "secondary", }; const chipColor = (colorMap[variant] ?? "default") as "default" | "success" | "warning" | "error" | "info" | "secondary" | "primary"; return ( <Chip label={children as any} size={size === "lg" ? "medium" : "small"} color={chipColor} variant={variant === "outline" ? "outlined" : "filled"} className={className} /> );
} export function Avatar({ src, alt = "User", size = "md", fallback, className,
}: { src?: string; alt?: string; className?: string; size?: "xs" | "sm" | "md" | "lg" | "xl"; fallback?: string;
}) { const px = size === "xs" ? 24 : size === "sm" ? 32 : size === "md" ? 40 : size === "lg" ? 48 : 64; const fallbackText = fallback?.trim(); const display = fallbackText && fallbackText.length > 0 ? fallbackText.split(" ")[0] : alt.charAt(0).toUpperCase(); return ( <MuiAvatar src={src} alt={alt} className={className} sx={{ width: px, height: px, fontSize: px * 0.4 }}> {display} </MuiAvatar> );
} export function Skeleton({ className, variant = "rectangular", ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "rectangular" | "circular" | "text";
}) { return ( <MuiSkeleton variant={variant === "rectangular" ? "rounded" : variant} className={className} {...props} /> );
} export function Progress({ value = 0, max = 100, variant = "default", size = "md", label, className, ...props
}: React.HTMLAttributes<HTMLDivElement> & { value?: number; max?: number; variant?: "default" | "success" | "warning" | "danger"; size?: "sm" | "md" | "lg"; label?: string;
}) { const pct = Math.min(100, Math.max(0, (value / max) * 100)); const colorMap: Record<string, "primary" | "success" | "warning" | "error"> = { default: "primary", success: "success", warning: "warning", danger: "error", }; return ( <Box className={className} {...props}> {label ? ( <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}> <Typography variant="caption" fontWeight={600}>{label}</Typography> <Typography variant="caption">{Math.round(pct)}%</Typography> </Box> ) : null} <LinearProgress variant="determinate" value={pct} color={colorMap[variant] ?? "primary"} sx={{ height: size === "sm" ? 4 : size === "lg" ? 10 : 7, borderRadius: 999 }} /> </Box> );
} export function Button({ children, variant = "primary", size = "md", className, isLoading, leftIcon, rightIcon, fullWidth, sx, component, ...props
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> & { variant?: "primary" | "secondary" | "outline" | "danger" | "text" | "contained" | "outlined"; size?: "sm" | "md" | "lg" | "small" | "medium" | "large"; isLoading?: boolean; leftIcon?: ReactNode; rightIcon?: ReactNode; fullWidth?: boolean; sx?: SxProps<Theme>; component?: React.ElementType; href?: string; target?: string;
}) { const muiVariant: "outlined" | "contained" | "text" = variant === "outline" || variant === "outlined" ? "outlined" : variant === "text" ? "text" : "contained"; const muiColor: "error" | "secondary" | "primary" = variant === "danger" ? "error" : variant === "secondary" ? "secondary" : "primary"; return ( <SoftButton component={component as any} variant={muiVariant} color={muiColor as "error" | "secondary" | "primary"} size={size === "lg" || size === "large" ? "large" : size === "sm" || size === "small" ? "small" : "medium"} className={className} disabled={Boolean(props.disabled || isLoading)} startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : leftIcon} endIcon={!isLoading ? rightIcon : undefined} fullWidth={fullWidth} sx={sx} {...props} > {isLoading ? "Loading..." : children} </SoftButton> );
} export function Input(props: TextFieldProps) { return <SoftTextField fullWidth size="small" variant="outlined" {...props} />;
} export function Textarea(props: TextFieldProps) { return <SoftTextField fullWidth size="small" multiline minRows={4} variant="outlined" {...props} />;
} export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) { return ( <FormControl fullWidth size="small"> <MuiSelect native value={props.value as any} onChange={props.onChange as any} inputProps={{ name: props.name, id: props.id, }} > {children} </MuiSelect> </FormControl> );
} export function Modal({ open, onClose, title, children, actions,
}: { open: boolean; onClose: () => void; title?: string; children: ReactNode; actions?: ReactNode;
}) { return ( <Dialog open={open} onClose={onClose} fullWidth maxWidth="md"> {title ? <DialogTitle>{title}</DialogTitle> : null} <DialogContent dividers>{children}</DialogContent> {actions ? <DialogActions>{actions}</DialogActions> : null} </Dialog> );
} export function Tabs({ tabs, value, onChange,
}: { tabs: { key: string; label: string }[]; value: string; onChange: (key: string) => void;
}) { const index = Math.max(0, tabs.findIndex((t) => t.key === value)); return ( <MuiTabs value={index} onChange={(_, i) => onChange(tabs[i]?.key ?? value)} variant="scrollable" scrollButtons="auto"> {tabs.map((tab) => ( <Tab key={tab.key} label={tab.label} /> ))} </MuiTabs> );
} export function Table<T = any>({
  columns,
  rows,
}: {
  columns: { key: string; header: string; render?: (row: T, index: number) => ReactNode }[];
  rows: T[];
}) {
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <MuiTable size="small">
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell key={c.key} sx={{ fontWeight: 700 }}>
                {c.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i} hover>
              {columns.map((c) => (
                <TableCell key={c.key}>
                  {c.render ? c.render(r, i) : (r as any)[c.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell align="center" colSpan={columns.length}>
                No data
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
}
 export function EmptyState({ title = "Nothing here", hint, icon, action,
 }: { title?: string; hint?: string; icon?: ReactNode; action?: { label: string; onClick: () => void };
 }) { return ( <Paper variant="outlined" sx={{ p: 12, textAlign: "center", borderRadius: "48px", borderStyle: "dashed", borderLevel: 2, bgcolor: "var(--background)", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, }}> <Box sx={{ p: 3, borderRadius: "50%", bgcolor: "rgba(99, 102, 241, 0.1)", color: "#6366f1", fontSize: "40px" }}> {icon || "✨"} </Box> <Box> <Typography variant="h5" fontWeight={900} sx={{ tracking: "tighter", textTransform: "uppercase" }}>{title}</Typography> {hint ? <Typography variant="body2" sx={{ color: "text.secondary", mt: 1, fontWeight: 500 }}>{hint}</Typography> : null} </Box> {action ? ( <SoftButton variant="contained" onClick={action.onClick} sx={{ mt: 2, px: 6, py: 1.5, borderRadius: "20px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}> {action.label} </SoftButton> ) : null} </Paper> );
 }
 export function LoadingState({ label = "Loading" }: { label?: string }) { return ( <Paper variant="outlined" sx={{ p: 3, textAlign: "center", borderRadius: 2 }}> <Typography variant="body2" color="text.secondary">{label}...</Typography> </Paper> );
} export function ErrorState({ message = "Something went wrong" }: { message?: string }) { return ( <Paper variant="outlined" sx={{ p: 3, textAlign: "center", borderRadius: 2, borderColor: "error.light", bgcolor: "error.50" }}> <Typography variant="subtitle2" color="error.main">{message}</Typography> </Paper> );
} export function RoleGate({ allow, children }: { allow: ("ADMIN" | "EMPLOYER" | "FREELANCER")[]; children: ReactNode }) { const role = useSession((s) => s.role); if (!role || !allow.includes(role)) return null; return <Fragment>{children}</Fragment>;
} export { Typography };
