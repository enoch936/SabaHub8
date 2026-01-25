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
        // Derive normalized role for UI
        let derived: Role = undefined;
        if (Array.isArray(roles)) {
          if (roles.includes("ROLE_ADMIN") || roles.includes("ADMIN")) derived = "ADMIN";
          else if (roles.includes("EMPLOYER")) derived = "EMPLOYER";
          else if (roles.includes("FREELANCER")) derived = "FREELANCER";
        }
        const single = (payload?.role as string | undefined) || undefined;
        if (!derived && (single === "ADMIN" || single === "EMPLOYER" || single === "FREELANCER")) {
          derived = single as Role;
        }
        role = derived;
      }
    } catch {}
    set({ token, email, roles, role });
  },
  clear: () => set({ token: null, email: undefined, roles: undefined, role: undefined }),
}));

export function bootstrapSession() {
  if (typeof window === "undefined") return;
  let token = localStorage.getItem("auth_token");
  
  // Development mode: create mock token if none exists
  // Check for development environment (localhost or explicitly set)
  const isDev = process.env.NODE_ENV === "development" || 
                window.location.hostname === "localhost" ||
                window.location.hostname.includes("github.dev");
  
  if (!token && isDev) {
    token = createDevelopmentToken();
    localStorage.setItem("auth_token", token);
    console.log("🔧 Development mode: Created mock authentication token");
    console.log("Token preview:", token.substring(0, 50) + "...");
  }
  
  if (token) {
    useSession.getState().setToken(token);
    console.log("✅ Session initialized with token");
  } else {
    console.warn("⚠️ No authentication token available");
  }
}

/**
 * Creates a mock JWT token for development/testing
 * This allows testing protected endpoints without a real auth flow
 */
function createDevelopmentToken(): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({
    sub: "dev-user@sabahub.com",
    email: "dev-user@sabahub.com",
    name: "Development User",
    roles: ["FREELANCER", "EMPLOYER"],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year
  }));
  // Important: This signature must contain the magic string that backend recognizes
  const signature = "mock-signature-for-development";
  return `${header}.${payload}.${signature}`;
}
