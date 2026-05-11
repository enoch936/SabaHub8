import type { TeamRole } from './types';

export const ROLE_HIERARCHY: Record<TeamRole, number> = { ADMIN: 3, RECRUITER: 2, VIEWER: 1 };

export function canAccess(userRole: TeamRole, requiredRole: TeamRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export const PERMISSIONS = {
  POST_JOBS: ['ADMIN', 'RECRUITER'] as TeamRole[],
  MANAGE_CONTRACTS: ['ADMIN', 'RECRUITER'] as TeamRole[],
  VIEW_ANALYTICS: ['ADMIN', 'RECRUITER', 'VIEWER'] as TeamRole[],
  MANAGE_TEAM: ['ADMIN'] as TeamRole[],
  INVITE_MEMBERS: ['ADMIN'] as TeamRole[],
} as const;

export function hasPermission(userRole: TeamRole, permission: keyof typeof PERMISSIONS): boolean {
  return (PERMISSIONS[permission] as readonly TeamRole[]).includes(userRole);
}
