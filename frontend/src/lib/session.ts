"use client";

import { create } from "zustand";
import { decodeToken } from "./auth";

export type Role = "ADMIN" | "EMPLOYER" | "FREELANCER" | undefined;

type SessionState = {
  token?: string | null;
  email?: string;
  fullName?: string;
  roles?: string[];
  role?: Role;
  setToken: (token: string | null) => void;
  clear: () => void;
};

export const useSession = create<SessionState>((set) => ({
  token: undefined,
  email: undefined,
  fullName: undefined,
  roles: undefined,
  role: undefined,
  setToken: (token) => {
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("auth_token", token);
      else localStorage.removeItem("auth_token");
    }
    let email: string | undefined;
    let role: Role;
    let roles: string[] | undefined;
    try {
      if (token) {
        const payload = decodeToken(token) as any;
        email = payload?.sub ?? payload?.email;
        roles = (payload?.roles as string[]) || (payload?.role ? [payload.role] : undefined);
        role = (roles?.[0] as Role) || undefined;
      }
    } catch {}
    set({ token, email, roles, role });
  },
  clear: () => set({ token: null, email: undefined, roles: undefined, role: undefined }),
}));

export function bootstrapSession() {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("auth_token");
  if (token) useSession.getState().setToken(token);
}
