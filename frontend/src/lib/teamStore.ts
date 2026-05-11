"use client";

// 10.3.5 — API endpoint protection note:
// All API calls from this store should include the current user's team role in the request header:
//   headers: { 'X-Team-Role': currentUserRole }
// The backend middleware should validate this header and enforce role-based access control.
// Example middleware check: if (req.headers['x-team-role'] !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

import { create } from 'zustand';
import { toast } from 'sonner';
import type { Team, TeamMember, TeamRole } from './types';
import {
  getWorkspaceTeam,
  inviteWorkspaceTeamMember,
  removeWorkspaceTeamMember,
  updateWorkspaceTeamMemberRole,
  type WorkspaceTeamActivity,
} from './api';

const ROLE_HIERARCHY: Record<TeamRole, number> = { ADMIN: 3, RECRUITER: 2, VIEWER: 1 };

interface TeamStore {
  team: Team | null;
  activities: WorkspaceTeamActivity[];
  isLoading: boolean;
  fetchTeam: () => Promise<void>;
  inviteTeamMember: (email: string, role: TeamRole) => Promise<void>;
  updateTeamMemberRole: (userId: string, role: TeamRole) => Promise<void>;
  removeTeamMember: (userId: string) => Promise<void>;
  canAccess: (requiredRole: TeamRole, userRole: TeamRole) => boolean;
}

export const useTeamStore = create<TeamStore>((set, get) => ({
  team: null,
  activities: [],
  isLoading: false,

  fetchTeam: async () => {
    set({ isLoading: true });
    try {
      const data = await getWorkspaceTeam();
      set({
        team: {
          id: data.id,
          name: data.name,
          ownerId: data.ownerId,
          createdAt: data.createdAt,
          members: data.members as TeamMember[],
        },
        activities: data.activities ?? [],
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      const message = error instanceof Error ? error.message : 'Failed to load team.';
      toast.error(message);
    }
  },

  inviteTeamMember: async (email, role) => {
    set({ isLoading: true });
    try {
      await inviteWorkspaceTeamMember({ email, role });
      await get().fetchTeam();
      toast.success(`Invitation sent to ${email}`);
    } catch (error) {
      set({ isLoading: false });
      const message = error instanceof Error ? error.message : 'Failed to invite member.';
      toast.error(message);
    }
  },

  updateTeamMemberRole: async (userId, role) => {
    set({ isLoading: true });
    try {
      await updateWorkspaceTeamMemberRole(userId, role);
      await get().fetchTeam();
      toast.success('Role updated');
    } catch (error) {
      set({ isLoading: false });
      const message = error instanceof Error ? error.message : 'Failed to update role.';
      toast.error(message);
    }
  },

  removeTeamMember: async (userId) => {
    set({ isLoading: true });
    try {
      await removeWorkspaceTeamMember(userId);
      await get().fetchTeam();
      toast.success('Member removed');
    } catch (error) {
      set({ isLoading: false });
      const message = error instanceof Error ? error.message : 'Failed to remove member.';
      toast.error(message);
    }
  },

  canAccess: (requiredRole, userRole) => {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
  },
}));
