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
    role: decoded.role as string,
    sub: decoded.sub as string,
  };
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('auth_token');
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
