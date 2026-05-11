"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { UserPlus, Users, Search } from 'lucide-react';
import { useTeamStore } from '@/lib/teamStore';
import { useDebounce } from '@/lib/useDebounce';
import { TeamMemberCard } from '@/components/team/TeamMemberCard';
import { TeamActivityLog } from '@/components/team/TeamActivityLog';
import { RolePermissionGuard } from '@/components/team/RolePermissionGuard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { me } from '@/lib/api';
import type { TeamRole } from '@/lib/types';

export default function TeamPage() {
  const { team, isLoading, fetchTeam, inviteTeamMember, updateTeamMemberRole, removeTeamMember } = useTeamStore();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('VIEWER');
  const [isInviting, setIsInviting] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<TeamRole | 'ALL'>('ALL');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    void fetchTeam();
  }, [fetchTeam]);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await me();
        setCurrentUserId(user.id);
      } catch {
        setCurrentUserId(null);
      }
    };

    void loadCurrentUser();
  }, []);

  const currentUserRole = useMemo<TeamRole>(() => {
    if (!team || !currentUserId) return 'VIEWER';
    if (team.ownerId === currentUserId) return 'ADMIN';
    const member = team.members.find((m) => m.userId === currentUserId);
    return member?.teamRole ?? 'VIEWER';
  }, [team, currentUserId]);

  const debouncedSearch = useDebounce(search, 300);
  const filteredMembers = useMemo(() => {
    if (!team) return [];
    return team.members.filter((member) => {
      const query = debouncedSearch.toLowerCase();
      const matchesSearch =
        debouncedSearch.trim() === '' ||
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query);
      const matchesRole = roleFilter === 'ALL' || member.teamRole === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [team, debouncedSearch, roleFilter]);

  const handleInvite = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!inviteEmail.trim()) return;
      setIsInviting(true);
      await inviteTeamMember(inviteEmail.trim(), inviteRole);
      setIsInviting(false);
      setShowInvite(false);
      setInviteEmail('');
    },
    [inviteEmail, inviteRole, inviteTeamMember],
  );

  const handleUpdateRole = useCallback(
    (userId: string, role: TeamRole) => {
      void updateTeamMemberRole(userId, role);
    },
    [updateTeamMemberRole],
  );

  const handleRemoveMember = useCallback(
    (userId: string) => {
      void removeTeamMember(userId);
    },
    [removeTeamMember],
  );

  if (isLoading) {
    return (
      <div className="sheet-shell min-h-screen">
        <div className="sheet-container">
          <LoadingSkeleton rows={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="sheet-shell min-h-screen">
      <div className="sheet-container">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">{team?.name ?? 'Team Management'}</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {team?.members.length ?? 0} members
            </p>
          </div>

          <RolePermissionGuard requiredRole="ADMIN" userRole={currentUserRole}>
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </button>
          </RolePermissionGuard>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { role: 'ADMIN', desc: 'Full access to all features', color: 'bg-purple-100 text-purple-700' },
            { role: 'RECRUITER', desc: 'Post jobs, manage contracts', color: 'bg-blue-100 text-blue-700' },
            { role: 'VIEWER', desc: 'Read-only access', color: 'bg-gray-100 text-gray-600' },
          ].map((roleInfo) => (
            <div key={roleInfo.role} className="sheet-panel p-4">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleInfo.color}`}>{roleInfo.role}</span>
              <p className="text-xs text-muted-foreground mt-2">{roleInfo.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as TeamRole | 'ALL')}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="RECRUITER">Recruiter</option>
            <option value="VIEWER">Viewer</option>
          </select>
        </div>

        <div className="space-y-3 mb-8">
          {filteredMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No members match your search.</p>
          ) : (
            filteredMembers.map((member) => (
              <TeamMemberCard
                key={member.userId}
                member={member}
                isOwner={member.userId === team?.ownerId}
                onUpdateRole={handleUpdateRole}
                onRemove={handleRemoveMember}
              />
            ))
          )}
        </div>

        <TeamActivityLog />
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45">
          <div className="sheet-panel w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <h2 className="font-semibold">Invite Team Member</h2>
              <button onClick={() => setShowInvite(false)} className="p-1.5 rounded-lg">
                x
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email Address *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as TeamRole)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="RECRUITER">Recruiter</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowInvite(false)} className="flex-1 py-2 rounded-lg border border-[var(--border)] text-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="flex-1 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm disabled:opacity-50"
                >
                  {isInviting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
