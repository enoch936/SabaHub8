"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, X } from "lucide-react";
import { Badge, Box, Drawer, IconButton, Tooltip, useMediaQuery, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import {
  getWorkspaceSections,
  isWorkspaceNavItemActive,
} from "@/components/workspace/navigation/workspace-nav";
import {
  WORKSPACE_HEADER_HEIGHT,
  WORKSPACE_MOBILE_SIDEBAR_WIDTH,
  WORKSPACE_SIDEBAR_WIDTH,
} from "@/components/workspace-shell";
import { useChatInbox } from "@/lib/chatInbox";
import { useNotifications } from "@/lib/notifications";
import { countUnreadProposalNotifications } from "@/lib/proposalNotifications";
import { useSession } from "@/lib/session";

type WorkspaceRole = "EMPLOYER" | "FREELANCER";

export default function WorkspaceSidebar({
  isOpen,
  onClose,
  onToggle,
}: {
  isOpen: boolean;
  onClose: () => void;
  onToggle?: () => void;
}) {
  const pathname = usePathname();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const role = (useSession((s) => s.role) || "FREELANCER") as WorkspaceRole;
  const fullName = useSession((s) => s.fullName);
  const unreadMessages = useChatInbox((s) => s.unreadMessages);
  const notifications = useNotifications((s) => s.items);
  const unreadProposalUpdates = countUnreadProposalNotifications(notifications, role);
  const desktopWidth = isDesktop && isOpen ? WORKSPACE_SIDEBAR_WIDTH : 0;
  const sections = getWorkspaceSections(role);
  const toggleTooltip = "Hide sidebar";
  const toggleIcon = isDesktop ? (
    <ChevronLeft size={18} />
  ) : (
    <X size={18} />
  );

  const content = (
    <Box
      sx={{
        width: isDesktop ? desktopWidth : WORKSPACE_MOBILE_SIDEBAR_WIDTH,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
        transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <Box sx={{ px: 2, pt: 2, pb: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 1.5,
            borderRadius: "24px",
            px: 1.5,
            py: 1.5,
            border: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
          }}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: "14px",
              background: "linear-gradient(135deg, #60a5fa 0%, #c084fc 100%)",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
              fontSize: 14,
              fontWeight: 900,
              boxShadow: "0 0 15px rgba(96, 165, 250, 0.5)",
            }}
          >
            SH
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: "0.875rem", color: "white" }} noWrap>
              {role === "EMPLOYER" ? "Employer" : "Freelancer"}
            </Typography>
            <Typography sx={{ fontSize: "0.625rem", textTransform: "uppercase", tracking: "0.15em", color: "rgba(255,255,255,0.4)", fontWeight: 700 }} noWrap>
              {fullName || "Workspace"}
            </Typography>
          </Box>
          <Tooltip title={toggleTooltip} placement="right">
            <IconButton
              onClick={onToggle}
              size="small"
              sx={{
                width: 32,
                height: 32,
                borderRadius: "10px",
                bgcolor: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.6)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)", color: "white" },
              }}
            >
              {toggleIcon}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 2, pb: 2 }}>
        {sections.map((section) => (
          <Box key={section.id} sx={{ mb: 3 }}>
            <Typography sx={{ px: 2, mb: 1, fontSize: "0.625rem", fontWeight: 800, textTransform: "uppercase", tracking: "0.2em", color: "rgba(255,255,255,0.3)" }}>
              {section.label}
            </Typography>
            <Box className="space-y-1">
              {section.items.map((item) => {
                const active = isWorkspaceNavItemActive(pathname, item.href);
                return (
                  <Box key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (!isDesktop) onClose();
                      }}
                      className={`group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all duration-300 ${
                        active
                          ? "bg-white/10 text-white shadow-glass border border-white/10"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="active-nav-glow"
                          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 -z-10"
                        />
                      )}
                      <span className={`transition-transform duration-300 group-hover:scale-110 ${active ? "text-blue-400" : "text-white/40"}`}>
                        {item.icon}
                      </span>
                      <span className="flex-1 font-semibold">{item.label}</span>
                      {item.id === "messages" && unreadMessages > 0 && (
                        <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-neon-blue">
                          {unreadMessages > 99 ? "99+" : unreadMessages}
                        </span>
                      )}
                      {item.id === "proposals" && unreadProposalUpdates > 0 && (
                        <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                          {unreadProposalUpdates > 99 ? "99+" : unreadProposalUpdates}
                        </span>
                      )}
                    </Link>
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}

        <Box
          sx={{
            mt: 4,
            borderRadius: "24px",
            p: 2.5,
            border: "1px solid rgba(255, 255, 255, 0.08)",
            background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
            color: "white",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full" />
          <p className="text-sm font-bold">Premium Workspace</p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/50">
            AI-powered hiring and delivery management in one futuristic shell.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="rounded-lg bg-white/5 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-blue-400 border border-blue-400/20">
              {role === "EMPLOYER" ? "Hiring Live" : "Delivery Live"}
            </span>
          </div>
        </Box>
      </Box>
    </Box>
  );

  if (isDesktop) {
    return (
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: desktopWidth,
          overflow: "hidden",
          pointerEvents: isOpen ? "auto" : "none",
          transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: "transparent",
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      variant="temporary"
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: WORKSPACE_MOBILE_SIDEBAR_WIDTH,
          height: "100%",
          border: "none",
          bgcolor: "transparent",
          backgroundImage: "none",
          boxShadow: "none",
        },
      }}
    >
      {content}
    </Drawer>
  );
}
