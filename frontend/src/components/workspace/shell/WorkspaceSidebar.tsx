"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, X } from "lucide-react";
import { Badge, Box, Drawer, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
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
        background: "linear-gradient(145deg, var(--glass-strong), var(--glass-subtle))",
        borderRight: "1px solid var(--glass-border)",
        boxShadow: "var(--shadow-soft)",
        backdropFilter: "blur(28px) saturate(1.35)",
        transition: "width 220ms ease",
      }}
    >
      <Box sx={{ px: 1.5, pt: 1.5, pb: 1.25 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 1.25,
            borderRadius: "22px",
            px: 1.25,
            py: 1.15,
            border: "1px solid var(--glass-border)",
            background: "linear-gradient(145deg, var(--glass-strong), var(--glass-subtle))",
            boxShadow: "var(--shadow-soft)",
            backdropFilter: "blur(18px)",
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "15px",
              background: "linear-gradient(135deg, var(--neon-blue), var(--neon-violet))",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.08em",
            }}
          >
            SH
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <p className="truncate text-sm font-semibold text-gray-900">
              {role === "EMPLOYER" ? "Employer" : "Freelancer"}
            </p>
            <p className="truncate text-[11px] uppercase tracking-[0.16em] text-gray-400">
              {fullName || "Workspace"}
            </p>
          </Box>
          <Tooltip title={toggleTooltip} placement="right">
            <IconButton
              onClick={onToggle}
              className="soft-click"
              aria-label={toggleTooltip}
              sx={{
                width: 36,
                height: 36,
                borderRadius: "12px",
                bgcolor: "var(--glass)",
                border: "1px solid var(--glass-border)",
                boxShadow: "var(--shadow-soft)",
              }}
            >
              {toggleIcon}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 1.25, pb: 1.25 }}>
        {sections.map((section) => (
          <Box key={section.id} sx={{ mb: 2.5 }}>
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              {section.label}
            </p>
            <div className="space-y-1.5">
              {section.items.map((item) => {
                const active = isWorkspaceNavItemActive(pathname, item.href);
                const label = (
                  <span className="flex items-center justify-between gap-3">
                    <span>{item.label}</span>
                    {item.id === "messages" && unreadMessages > 0 ? (
                      <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {unreadMessages > 99 ? "99+" : unreadMessages}
                      </span>
                    ) : item.id === "proposals" && unreadProposalUpdates > 0 ? (
                      <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {unreadProposalUpdates > 99 ? "99+" : unreadProposalUpdates}
                      </span>
                    ) : null}
                  </span>
                );
                const icon = (
                  <span className={active ? "text-white" : "text-gray-500"}>
                    {item.icon}
                  </span>
                );
                return (
                  <Box key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (!isDesktop) onClose();
                      }}
                      aria-label={item.label}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition ${
                        active
                          ? "bg-[linear-gradient(135deg,rgba(56,189,248,0.35),rgba(139,92,246,0.28))] text-white shadow-[0_18px_44px_rgba(56,189,248,0.2)] ring-1 ring-white/20"
                          : "text-gray-600 hover:bg-white/10 hover:text-gray-900 hover:shadow-md"
                      }`}
                    >
                      {icon}
                      <span className="min-w-0 flex-1 font-medium">{label}</span>
                    </Link>
                  </Box>
                );
              })}
            </div>
          </Box>
        ))}

        <Box
          sx={{
            mt: 2,
            borderRadius: "22px",
            p: 2,
            border: "1px solid var(--glass-border)",
            background: "linear-gradient(145deg, var(--glass-strong), var(--glass-subtle))",
            color: "var(--foreground)",
            boxShadow: "var(--shadow-soft)",
            backdropFilter: "blur(18px)",
          }}
        >
          <p className="text-sm font-semibold">Live</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Jobs, talent, chat, and contracts in one place.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700">
              {role === "EMPLOYER" ? "Hiring Live" : "Delivery Live"}
            </span>
            <Badge
              badgeContent={unreadMessages > 99 ? "99+" : unreadMessages}
              color="error"
              sx={{ "& .MuiBadge-badge": { fontSize: "10px", minWidth: 18, height: 18 } }}
            >
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                Messages
              </span>
            </Badge>
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
          top: WORKSPACE_HEADER_HEIGHT,
          left: 0,
          bottom: 0,
          width: desktopWidth,
          overflow: "hidden",
          pointerEvents: isOpen ? "auto" : "none",
          transition: "width 220ms ease",
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
          top: WORKSPACE_HEADER_HEIGHT,
          height: `calc(100% - ${WORKSPACE_HEADER_HEIGHT}px)`,
          border: "none",
          boxShadow: "var(--shadow-soft-lg)",
          bgcolor: "transparent",
          background: "linear-gradient(145deg, var(--glass-strong), var(--glass-subtle))",
          backdropFilter: "blur(28px) saturate(1.35)",
        },
      }}
    >
      {content}
    </Drawer>
  );
}
