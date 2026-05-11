import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import type { AppRole, SessionUser, WorkspaceRole } from "../types/models";
import { mobileStorage, storageKeys } from "../storage/mmkv";
import { normalizeRoleList, resolveActiveRole, workspaceRoles } from "../utils/role-mode";

type JwtPayload = {
  sub?: string;
  email?: string;
  username?: string;
  role?: string;
  roles?: string[];
  authorities?: string[];
  authority?: string;
  exp?: number;
};

type SessionState = {
  initialized: boolean;
  token: string | null;
  user: SessionUser | null;
  roles: AppRole[];
  activeRole?: AppRole;
  workspaceRoleOptions: WorkspaceRole[];
  setToken: (token: string | null) => void;
  setUser: (user: SessionUser | null) => void;
  setActiveRole: (role: WorkspaceRole | undefined) => void;
  bootstrapToken: () => void;
  clear: () => void;
};

function decodeRoles(token: string): AppRole[] {
  try {
    const payload = jwtDecode<JwtPayload>(token);
    return normalizeRoleList([
      ...(payload.roles ?? []),
      ...(payload.authorities ?? []),
      payload.role,
      payload.authority,
    ]);
  } catch {
    return [];
  }
}

function readStoredActiveRole(): WorkspaceRole | undefined {
  const value = mobileStorage.getString(storageKeys.activeRole);
  return value === "EMPLOYER" || value === "FREELANCER" ? value : undefined;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  initialized: false,
  token: null,
  user: null,
  roles: [],
  activeRole: undefined,
  workspaceRoleOptions: [],

  setToken: (token) => {
    if (token) {
      mobileStorage.set(storageKeys.token, token);
    } else {
      mobileStorage.remove(storageKeys.token);
    }

    const roles = token ? decodeRoles(token) : [];
    const preferred = readStoredActiveRole();
    const activeRole = resolveActiveRole(roles, preferred);
    const options = workspaceRoles(roles);

    set({
      token,
      roles,
      activeRole,
      workspaceRoleOptions: options,
    });
  },

  setUser: (user) => {
    const current = get();
    const rawRoles = user?.roles ?? current.roles;
    const roles = normalizeRoleList(rawRoles);
    const preferred = readStoredActiveRole();
    const activeRole = resolveActiveRole(roles, preferred);
    set({
      user,
      roles,
      activeRole,
      workspaceRoleOptions: workspaceRoles(roles),
    });
  },

  setActiveRole: (role) => {
    const current = get();
    if (!role) {
      mobileStorage.remove(storageKeys.activeRole);
      set({ activeRole: resolveActiveRole(current.roles) });
      return;
    }
    if (!current.workspaceRoleOptions.includes(role)) {
      return;
    }
    mobileStorage.set(storageKeys.activeRole, role);
    set({ activeRole: role });
  },

  bootstrapToken: () => {
    const token = mobileStorage.getString(storageKeys.token) ?? null;
    get().setToken(token);
    set({ initialized: true });
  },

  clear: () => {
    mobileStorage.remove(storageKeys.token);
    mobileStorage.remove(storageKeys.activeRole);
    set({
      initialized: true,
      token: null,
      user: null,
      roles: [],
      activeRole: undefined,
      workspaceRoleOptions: [],
    });
  },
}));
