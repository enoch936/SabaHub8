import type { AppRole, TeamRole } from './types';

export type EnterpriseRole = AppRole | TeamRole | 'SUPER_ADMIN' | 'MODERATOR' | 'FINANCE_ADMIN' | 'SUPPORT_AGENT';

export const ROLE_HIERARCHY: Record<EnterpriseRole, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  FINANCE_ADMIN: 70,
  MODERATOR: 60,
  RECRUITER: 40,
  SUPPORT_AGENT: 30,
  EMPLOYER: 20,
  FREELANCER: 10,
  VIEWER: 5,
};

export const PERMISSIONS = {
  // System Governance
  MANAGE_SYSTEM_SETTINGS: ['SUPER_ADMIN'] as EnterpriseRole[],
  VIEW_AUDIT_LOGS: ['SUPER_ADMIN', 'ADMIN'] as EnterpriseRole[],
  MANAGE_INFRASTRUCTURE: ['SUPER_ADMIN'] as EnterpriseRole[],
  
  // User Management
  VIEW_USERS: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT_AGENT'] as EnterpriseRole[],
  MANAGE_USERS: ['SUPER_ADMIN', 'ADMIN'] as EnterpriseRole[],
  SUSPEND_USERS: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'] as EnterpriseRole[],
  
  // Content & Moderation
  MODERATE_CONTENT: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'] as EnterpriseRole[],
  DELETE_CONTENT: ['SUPER_ADMIN', 'ADMIN'] as EnterpriseRole[],
  VIEW_REPORTS: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT_AGENT'] as EnterpriseRole[],
  
  // Job & Marketplace
  POST_JOBS: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYER', 'RECRUITER'] as EnterpriseRole[],
  MANAGE_JOBS: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'] as EnterpriseRole[],
  VIEW_ANALYTICS: ['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN', 'VIEWER'] as EnterpriseRole[],
  
  // Financial Operations
  VIEW_TRANSACTIONS: ['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN'] as EnterpriseRole[],
  MANAGE_PAYMENTS: ['SUPER_ADMIN', 'FINANCE_ADMIN'] as EnterpriseRole[],
  RESOLVE_DISPUTES: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'FINANCE_ADMIN'] as EnterpriseRole[],
  
  // Communication
  MANAGE_CHANNELS: ['SUPER_ADMIN', 'ADMIN'] as EnterpriseRole[],
  MODERATE_CHATS: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'] as EnterpriseRole[],
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

export function hasPermission(userRole: EnterpriseRole | EnterpriseRole[], permission: PermissionKey): boolean {
  const roles = Array.isArray(userRole) ? userRole : [userRole];
  const allowedRoles = PERMISSIONS[permission] as readonly EnterpriseRole[];
  
  return roles.some(role => {
    // Check direct permission
    if (allowedRoles.includes(role)) return true;
    
    // Check hierarchy (Super Admin has all permissions)
    if (role === 'SUPER_ADMIN') return true;
    
    // Optional: Add inheritance logic if needed
    // return allowedRoles.some(allowedRole => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[allowedRole]);
    return false;
  });
}

export function canAccess(userRole: EnterpriseRole, requiredRole: EnterpriseRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
