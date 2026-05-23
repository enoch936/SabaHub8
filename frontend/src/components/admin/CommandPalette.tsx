"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Dialog, 
  TextField, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  ListItemIcon, 
  InputAdornment, 
  Box, 
  Typography,
  alpha,
  useTheme,
  Divider
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import MonitorHeartRoundedIcon from "@mui/icons-material/MonitorHeartRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import { useHotkeys } from "react-hotkeys-hook";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Command {
  id: string;
  label: string;
  group: string;
  href: string;
  icon: React.ReactNode;
  shortcut?: string;
}

const commands: Command[] = [
  { id: "dashboard", label: "Admin Dashboard", group: "General", href: "/admin", icon: <DashboardRoundedIcon fontSize="small" />, shortcut: "G D" },
  { id: "users", label: "User Management", group: "Management", href: "/admin?section=users", icon: <PeopleAltRoundedIcon fontSize="small" />, shortcut: "G U" },
  { id: "monitoring", label: "System Monitoring", group: "Infrastructure", href: "/admin?section=system-monitoring", icon: <MonitorHeartRoundedIcon fontSize="small" />, shortcut: "G M" },
  { id: "data", label: "Data Management", group: "Infrastructure", href: "/admin?section=data-management", icon: <StorageRoundedIcon fontSize="small" />, shortcut: "G A" },
  { id: "security", label: "Security & Compliance", group: "Management", href: "/admin?section=security-governance", icon: <SecurityRoundedIcon fontSize="small" />, shortcut: "G S" },
  { id: "settings", label: "System Settings", group: "General", href: "/admin?section=platform-control", icon: <SettingsRoundedIcon fontSize="small" /> },
  { id: "help", label: "Platform Help", group: "Support", href: "/help", icon: <HelpOutlineRoundedIcon fontSize="small" />, shortcut: "?" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const theme = useTheme();

  useHotkeys("meta+k, ctrl+k", () => setOpen(true), { preventDefault: true });
  useHotkeys("esc", () => setOpen(false), { enabled: open });

  const filtered = useMemo(() => {
    return commands.filter((c) => 
        c.label.toLowerCase().includes(query.toLowerCase()) || 
        c.group.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      e.preventDefault();
    } else if (e.key === "Enter") {
      const cmd = filtered[selectedIndex];
      if (cmd) {
        router.push(cmd.href);
        setOpen(false);
      }
    }
  };

  const groups = Array.from(new Set(filtered.map(c => c.group)));

  return (
    <AnimatePresence>
      {open && (
        <Dialog 
            open={open} 
            onClose={() => setOpen(false)} 
            maxWidth="sm" 
            fullWidth
            slotProps={{
                backdrop: {
                    sx: { backdropFilter: "blur(4px)", bgcolor: alpha("#000", 0.4) }
                }
            }}
            PaperProps={{
                component: motion.div,
                // @ts-ignore
                initial: { opacity: 0, scale: 0.9, y: -20 },
                animate: { opacity: 1, scale: 1, y: 0 },
                exit: { opacity: 0, scale: 0.9, y: -20 },
                transition: { duration: 0.2, ease: "easeOut" },
                sx: {
                    bgcolor: "background.paper",
                    borderRadius: "16px",
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
                    overflow: "hidden"
                }
            }}
        >
          <Box sx={{ p: 0 }} onKeyDown={handleKeyDown}>
            <TextField
              autoFocus
              fullWidth
              placeholder="Search commands (e.g. 'users', 'monitoring')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                    borderRadius: 0,
                    border: "none",
                    "& fieldset": { border: "none" },
                    p: 2,
                    fontSize: "1.1rem"
                }
              }}
              InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchRoundedIcon color="primary" />
                    </InputAdornment>
                ),
                endAdornment: (
                    <InputAdornment position="end">
                        <Box sx={{ 
                            px: 1, py: 0.5, borderRadius: "6px", border: "1px solid", borderColor: "divider", bgcolor: "background.default",
                            fontSize: "10px", fontWeight: 700, opacity: 0.5
                        }}>
                            ESC
                        </Box>
                    </InputAdornment>
                )
              }}
            />
            <Divider />
            <Box sx={{ maxHeight: 400, overflowY: 'auto', p: 1 }}>
              {groups.map((group) => (
                <Box key={group} sx={{ mb: 1 }}>
                  <Typography sx={{ px: 2, py: 1, fontSize: "10px", fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {group}
                  </Typography>
                  <List sx={{ p: 0 }}>
                    {filtered.filter(c => c.group === group).map((cmd) => {
                      const absoluteIndex = filtered.indexOf(cmd);
                      const active = selectedIndex === absoluteIndex;
                      return (
                        <ListItem key={cmd.id} disablePadding sx={{ mb: 0.5 }}>
                          <ListItemButton 
                            selected={active}
                            onClick={() => { router.push(cmd.href); setOpen(false); }}
                            sx={{
                                borderRadius: "10px",
                                mx: 0.5,
                                transition: "all 0.15s",
                                "&.Mui-selected": {
                                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                                    "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.18) }
                                }
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 40, color: active ? 'primary.main' : 'inherit' }}>
                              {cmd.icon}
                            </ListItemIcon>
                            <ListItemText 
                                primary={cmd.label} 
                                primaryTypographyProps={{ fontSize: "14px", fontWeight: 600 }}
                            />
                            {cmd.shortcut && (
                                <Typography sx={{ fontSize: "10px", fontWeight: 700, opacity: 0.4 }}>
                                    {cmd.shortcut}
                                </Typography>
                            )}
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              ))}
              {filtered.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center', opacity: 0.5 }}>
                    <Typography variant="body2">No commands found for "{query}"</Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ p: 1.5, borderTop: "1px solid", borderColor: "divider", display: 'flex', gap: 2, opacity: 0.5 }}>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box component="span" sx={{ px: 0.5, border: "1px solid", borderColor: "divider", borderRadius: "4px" }}>↵</Box> to select
                </Typography>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box component="span" sx={{ px: 0.5, border: "1px solid", borderColor: "divider", borderRadius: "4px" }}>↑↓</Box> to navigate
                </Typography>
            </Box>
          </Box>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
