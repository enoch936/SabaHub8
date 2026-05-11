import type { AppRole, WorkspaceRole } from "../types/models";

export function normalizeRole(value: unknown): AppRole | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim().toUpperCase().replace(/^ROLE_/, "");
  if (!normalized) {
    return undefined;
  }
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
  if (!Array.isArray(values)) {
    return [];
  }
  const unique = new Set<AppRole>();
  values.forEach((value) => {
    const role = normalizeRole(value);
    if (role) {
      unique.add(role);
    }
  });
  return [...unique];
}

export function workspaceRoles(roles: AppRole[]): WorkspaceRole[] {
  const hasEmployer = roles.includes("EMPLOYER");
  const hasFreelancer = roles.includes("FREELANCER");
  if (!hasEmployer && !hasFreelancer) {
    return [];
  }
  return ["EMPLOYER", "FREELANCER"];
}

export function resolveActiveRole(roles: AppRole[], preferred?: WorkspaceRole | AppRole): AppRole | undefined {
  if (!roles.length) {
    return undefined;
  }

  if (preferred === "EMPLOYER" || preferred === "FREELANCER") {
    if (roles.includes(preferred)) {
      return preferred;
    }
  }

  if (preferred === "ADMIN" && roles.includes("ADMIN")) {
    return "ADMIN";
  }

  const workspace = workspaceRoles(roles);
  if (workspace.length > 0) {
    return workspace[0];
  }

  if (roles.includes("ADMIN")) {
    return "ADMIN";
  }

  return undefined;
}
