"use client";

import { useState, useEffect } from "react";
import { Dialog, TextField, List, ListItem, ListItemButton, ListItemText, ListItemIcon, InputAdornment, Box } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useHotkeys } from "react-hotkeys-hook";
import { useRouter } from "next/navigation";

const commands = [
  { label: "Dashboard", href: "/admin" },
  { label: "User Management", href: "/admin?section=users" },
  { label: "System Monitoring", href: "/admin?section=system-monitoring" },
  { label: "Data Management", href: "/admin?section=data-management" },
  { label: "Media Manager", href: "/admin?section=media-manager" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useHotkeys("meta+k, ctrl+k", () => setOpen(true), { preventDefault: true });

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
      <Box sx={{ p: 1 }}>
        <TextField
          autoFocus
          fullWidth
          placeholder="Search commands..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment>,
          }}
        />
        <List>
          {filtered.map((cmd) => (
            <ListItem key={cmd.href} disablePadding>
              <ListItemButton 
                onClick={() => { router.push(cmd.href); setOpen(false); }}
              >
                <ListItemText primary={cmd.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Dialog>
  );
}
