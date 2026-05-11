"use client";

import { canAccess } from '@/lib/permissions';
import type { TeamRole } from '@/lib/types';

interface RolePermissionGuardProps {
  requiredRole: TeamRole;
  userRole: TeamRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RolePermissionGuard({ requiredRole, userRole, children, fallback = null }: RolePermissionGuardProps) {
  if (!canAccess(userRole, requiredRole)) return <>{fallback}</>;
  return <>{children}</>;
}
