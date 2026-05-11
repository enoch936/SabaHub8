"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";
import { useSession } from "@/lib/session";
import {
  getRoleFallbackRoute,
  getWorkspaceRoles,
  isRoleAllowedOnPath,
  type WorkspaceRole,
} from "@/lib/role-mode";

const ROLE_META: Record<WorkspaceRole, { label: string; icon: ReactNode }> = {
  EMPLOYER: { label: "Employer", icon: <BusinessCenterRoundedIcon fontSize="small" /> },
  FREELANCER: { label: "Freelancer", icon: <TrackChangesRoundedIcon fontSize="small" /> },
};

export default function RoleModeSwitch({ variant = "pill" }: { variant?: "pill" | "button" }) {
  const router = useRouter();
  const pathname = usePathname();
  const role = useSession((state) => state.role);
  const roles = useSession((state) => state.roles);
  const setRole = useSession((state) => state.setRole);

  const availableRoles = useMemo(
    () => getWorkspaceRoles((roles as Array<"ADMIN" | WorkspaceRole> | undefined) ?? []),
    [roles]
  );

  if (!availableRoles.length || role === "ADMIN") {
    return null;
  }

  const activeRole = role === "EMPLOYER" || role === "FREELANCER" ? role : availableRoles[0];

  const switchToRole = (nextRole: WorkspaceRole) => {
    if (!availableRoles.includes(nextRole) || nextRole === activeRole) return;
    setRole(nextRole);
    const nextRoute = getRoleFallbackRoute(nextRole);
    if (!isRoleAllowedOnPath(pathname, nextRole) || pathname !== nextRoute) {
      router.push(nextRoute);
    }
  };

  if (variant === "button") {
    const nextRole = activeRole === "EMPLOYER" ? "FREELANCER" : "EMPLOYER";

    return (
      <ButtonBase
        onClick={() => switchToRole(nextRole)}
        sx={{
          px: 2,
          py: 1,
          borderRadius: "12px",
          bgcolor: "#f9fafb",
          color: "text.primary",
          transition: "background-color 180ms ease, transform 180ms ease",
          "&:hover": {
            bgcolor: "#f3f4f6",
            transform: "translateY(-1px)",
          },
        }}
      >
        <Stack direction="row" spacing={0.85} alignItems="center">
          <Typography variant="caption" fontWeight={700} sx={{ letterSpacing: "0.01em" }}>
            Switch to {nextRole === "EMPLOYER" ? "Employer" : "Freelancer"}
          </Typography>
        </Stack>
      </ButtonBase>
    );
  }

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        p: 0.5,
        borderRadius: 999,
        border: "none",
        bgcolor: "#f9fafb",
        transition: "all 220ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {(["EMPLOYER", "FREELANCER"] as WorkspaceRole[]).map((item) => {
        const enabled = availableRoles.includes(item);
        const active = activeRole === item;
        const meta = ROLE_META[item];

        return (
          <ButtonBase
            key={item}
            disabled={!enabled}
            onClick={() => switchToRole(item)}
            sx={{
              px: 1.15,
              py: 0.8,
              borderRadius: 999,
              minWidth: { xs: 116, sm: 132 },
              color: active ? "#111111" : "#6b7280",
              bgcolor: active ? "#ffffff" : "transparent",
              border: "none",
              transform: active ? "translateY(-1px)" : "none",
              transition: "all 220ms cubic-bezier(0.22, 1, 0.36, 1)",
              opacity: enabled ? 1 : 0.45,
              "&:hover": {
                bgcolor: active ? "#ffffff" : "#f3f4f6",
              },
            }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center">
              {meta.icon}
              <Typography variant="caption" fontWeight={800} sx={{ letterSpacing: "0.02em" }}>
                {meta.label}
              </Typography>
            </Stack>
          </ButtonBase>
        );
      })}
    </Box>
  );
}
