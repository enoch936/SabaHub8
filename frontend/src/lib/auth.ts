import { normalizeRole, normalizeRoleList } from "./role-mode";

/**
 * Decode JWT token to extract claims (role, etc.)
 * Note: This is for reading non-sensitive data only; the token is still validated server-side
 */
export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch {
    return null;
  }
}

function readTokenExpSeconds(decoded: Record<string, unknown> | null): number | null {
  if (!decoded) return null;
  const exp = decoded.exp;
  if (typeof exp === "number" && Number.isFinite(exp)) {
    return exp;
  }
  if (typeof exp === "string") {
    const parsed = Number(exp);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function isTokenUsable(token: string | null | undefined): boolean {
  if (!token || !token.trim()) return false;
  const decoded = decodeToken(token);
  if (!decoded) return false;

  const expSeconds = readTokenExpSeconds(decoded);
  if (expSeconds == null) {
    // Treat tokens without exp as usable to avoid breaking legacy sessions.
    return true;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  return expSeconds > nowSeconds;
}

function claimToRoleList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => {
        if (typeof entry === "string") return [entry];
        if (entry && typeof entry === "object" && "authority" in entry) {
          const authority = (entry as { authority?: unknown }).authority;
          return typeof authority === "string" ? [authority] : [];
        }
        return [];
      })
      .filter(Boolean);
  }
  if (typeof value === "string") return [value];
  return [];
}

export function extractNormalizedRolesFromToken(token: string | null | undefined): string[] {
  if (!token) return [];
  const decoded = decodeToken(token);
  if (!decoded) return [];

  return normalizeRoleList([
    ...claimToRoleList(decoded.roles),
    ...claimToRoleList(decoded.role),
    ...claimToRoleList(decoded.authorities),
    ...claimToRoleList(decoded.authority),
  ]);
}

export function resolveWorkspaceRouteFromToken(token: string | null | undefined): string {
  const normalizedRoles = extractNormalizedRolesFromToken(token);

  if (normalizedRoles.includes("ADMIN")) {
    return "/admin";
  }
  if (normalizedRoles.includes("EMPLOYER") || normalizedRoles.includes("FREELANCER")) return "/jobs";
  return "/jobs";
}

/**
 * Get user info from localStorage token
 */
export function getUserFromToken(): { email?: string; role?: string; sub?: string } | null {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('auth_token');
  if (!token) return null;
  
  const decoded = decodeToken(token);
  if (!decoded) return null;
  
  return {
    email: decoded.sub as string,
    role: normalizeRole(decoded.role),
    sub: decoded.sub as string,
  };
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return isTokenUsable(localStorage.getItem('auth_token'));
}

/**
 * Clear auth token (logout)
 */
import { logoutApi } from "./api";

export function logout(): void {
  if (typeof window !== 'undefined') {
    // Fire-and-forget backend logout for audit
    logoutApi().finally(() => {
      localStorage.removeItem('auth_token');
      // Clear any other persisted state keys if needed in future
    });
  }
}
