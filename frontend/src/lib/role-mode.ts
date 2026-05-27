export type WorkspaceRole = "EMPLOYER" | "FREELANCER";
export type AppRole = WorkspaceRole | "ADMIN";

export const ACTIVE_ROLE_STORAGE_KEY = "sabahub_active_role";

export function normalizeRole(value: unknown): AppRole | undefined {
  if (typeof value !== "string") return undefined;

  const normalized = value.trim().toUpperCase().replace(/^ROLE_/, "");
  if (!normalized) return undefined;

  if (
    normalized === "ADMIN" ||
    normalized === "SUPER_ADMIN" ||
    normalized === "SUPPORT_ADMIN" ||
    normalized === "FINANCE_ADMIN"
  ) {
    return "ADMIN";
  }

  if (normalized === "EMPLOYER" || normalized === "FREELANCER") {
    return normalized;
  }

  return undefined;
}

export function normalizeRoleList(values: unknown[] | undefined): AppRole[] {
  if (!Array.isArray(values)) return [];

  return values.reduce<AppRole[]>((acc, value) => {
    const normalized = normalizeRole(value);
    if (normalized && !acc.includes(normalized)) {
      acc.push(normalized);
    }
    return acc;
  }, []);
}

export function getWorkspaceRoles(roles: AppRole[] | undefined): WorkspaceRole[] {
  const hasEmployer = roles?.includes("EMPLOYER") ?? false;
  const hasFreelancer = roles?.includes("FREELANCER") ?? false;

  if (hasEmployer || hasFreelancer) {
    return ["EMPLOYER", "FREELANCER"];
  }

  return [];
}

export function readStoredActiveRole(): AppRole | undefined {
  if (typeof window === "undefined") return undefined;
  return normalizeRole(window.localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY));
}

export function persistActiveRole(role: AppRole | undefined) {
  if (typeof window === "undefined") return;
  if (!role) {
    window.localStorage.removeItem(ACTIVE_ROLE_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, role);
}

export function resolveActiveRole(roles: AppRole[], primaryRole?: AppRole): AppRole | undefined {
  if (!roles.length) return undefined;

  const workspaceRoles = getWorkspaceRoles(roles);
  const stored = readStoredActiveRole();

  if (stored) {
    if (stored === "ADMIN" && roles.includes("ADMIN")) return "ADMIN";
    if (workspaceRoles.includes(stored as WorkspaceRole)) return stored;
  }

  if (primaryRole && workspaceRoles.includes(primaryRole as WorkspaceRole)) {
    return primaryRole;
  }

  if (primaryRole === "ADMIN" && roles.includes("ADMIN")) {
    return "ADMIN";
  }

  if (workspaceRoles.length > 0) {
    return workspaceRoles[0];
  }

  return roles.includes("ADMIN") ? "ADMIN" : undefined;
}

export function isRoleAllowedOnPath(pathname: string, role: AppRole | undefined): boolean {
  if (!pathname || !role || role === "ADMIN") return true;

  if (pathname.startsWith("/employer")) {
    return role === "EMPLOYER";
  }

  if (pathname.startsWith("/freelancer")) {
    return role === "FREELANCER";
  }

  if (pathname === "/jobs/post" || pathname.startsWith("/jobs/post/")) {
    return role === "EMPLOYER";
  }

  return true;
}

export function getRoleFallbackRoute(role: AppRole | undefined): string {
  if (role === "ADMIN") return "/admin";
  if (role === "EMPLOYER") return "/jobs";
  if (role === "FREELANCER") return "/jobs";
  return "/jobs";
}
