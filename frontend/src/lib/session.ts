"use client";

import { create } from "zustand";
import { decodeToken } from "./auth";
import {
  type AppRole,
  getWorkspaceRoles,
  normalizeRole,
  normalizeRoleList,
  persistActiveRole,
  resolveActiveRole,
} from "./role-mode";

export type Role = AppRole | undefined;

type SessionState = {
  token?: string | null;
  email?: string;
  username?: string;
  fullName?: string;
  profilePictureUrl?: string;
  emailVerified?: boolean;
  roles?: string[];
  role?: Role;
  workspaceRoles: Array<"EMPLOYER" | "FREELANCER">;
  setToken: (token: string | null) => void;
  hydrateFromUser: (user: {
    email: string;
    username?: string;
    fullName?: string;
    profilePictureUrl?: string | null;
    roles: string[];
  }) => void;
  setRole: (role: Role) => void;
  setProfilePictureUrl: (url: string | null) => void;
  setEmailVerified: (verified: boolean | null) => void;
  clear: () => void;
};

export const useSession = create<SessionState>((set) => ({
  token: undefined,
  email: undefined,
  username: undefined,
  fullName: undefined,
  profilePictureUrl: typeof window !== "undefined" ? localStorage.getItem("profile_picture_url") ?? undefined : undefined,
  emailVerified: typeof window !== "undefined"
    ? localStorage.getItem("email_verified") === "true"
    : undefined,
  roles: undefined,
  role: undefined,
  workspaceRoles: [],
  setToken: (token) => {
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("auth_token", token);
      else localStorage.removeItem("auth_token");
    }
    let email: string | undefined;
    let username: string | undefined;
    let role: Role;
    let roles: string[] | undefined;
    try {
      if (token) {
        const payload = decodeToken(token) as any;
        email = payload?.sub ?? payload?.email;
        username = payload?.username;
        const extractedRoles = normalizeRoleList([
          ...((payload?.roles as unknown[]) || []),
          payload?.role,
          ...((payload?.authorities as unknown[]) || []),
          payload?.authority,
        ]);
        const primaryRole = normalizeRole(payload?.role);
        roles = extractedRoles;
        role = resolveActiveRole(extractedRoles, primaryRole);
        if (role === "EMPLOYER" || role === "FREELANCER" || role === "ADMIN") {
          persistActiveRole(role);
        }
      }
    } catch {}
    set({
      token,
      email,
      username,
      roles,
      role,
      workspaceRoles: getWorkspaceRoles((roles as AppRole[] | undefined) ?? []),
    });
  },
  hydrateFromUser: (user) => {
    const normalizedRoles = normalizeRoleList(user.roles ?? []);
    const primaryRole = normalizeRole(user.roles?.[0]);
    const role = resolveActiveRole(normalizedRoles, primaryRole);
    const profilePictureUrl = user.profilePictureUrl ?? undefined;

    if (typeof window !== "undefined") {
      if (profilePictureUrl) {
        localStorage.setItem("profile_picture_url", profilePictureUrl);
      } else {
        localStorage.removeItem("profile_picture_url");
      }
    }

    if (role === "EMPLOYER" || role === "FREELANCER" || role === "ADMIN") {
      persistActiveRole(role);
    }

    set({
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      profilePictureUrl,
      roles: normalizedRoles,
      role,
      workspaceRoles: getWorkspaceRoles(normalizedRoles),
    });
  },
  setRole: (nextRole) => {
    set((state) => {
      if (!nextRole) {
        persistActiveRole(undefined);
        return { role: undefined };
      }

      if (
        (nextRole === "EMPLOYER" || nextRole === "FREELANCER") &&
        !state.workspaceRoles.includes(nextRole)
      ) {
        return state;
      }

      if (nextRole === "ADMIN" && !state.roles?.includes("ADMIN")) {
        return state;
      }

      if (nextRole === "EMPLOYER" || nextRole === "FREELANCER" || nextRole === "ADMIN") {
        persistActiveRole(nextRole);
      }

      return { role: nextRole };
    });
  },
  setProfilePictureUrl: (url) => {
    if (typeof window !== "undefined") {
      if (url) localStorage.setItem("profile_picture_url", url);
      else localStorage.removeItem("profile_picture_url");
    }
    set({ profilePictureUrl: url ?? undefined });
  },
  setEmailVerified: (verified) => {
    if (typeof window !== "undefined") {
      if (verified === null || verified === undefined) {
        localStorage.removeItem("email_verified");
      } else {
        localStorage.setItem("email_verified", String(verified));
      }
    }
    set({ emailVerified: verified ?? undefined });
  },
  clear: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("profile_picture_url");
      localStorage.removeItem("email_verified");
    }
    persistActiveRole(undefined);
    set({
      token: null,
      email: undefined,
      username: undefined,
      fullName: undefined,
      roles: undefined,
      role: undefined,
      workspaceRoles: [],
      profilePictureUrl: undefined,
      emailVerified: undefined,
    });
  },
}));

export function bootstrapSession() {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("auth_token");
  if (token) {
    useSession.getState().setToken(token);
  }
}
