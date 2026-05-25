"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
  Avatar,
  useTheme,
  alpha,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import GppMaybeRoundedIcon from "@mui/icons-material/GppMaybeRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import PolicyRoundedIcon from "@mui/icons-material/PolicyRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import NoSsrResponsiveContainer from "@/components/charts/NoSsrResponsiveContainer";
import { GlassCard, GlassCardHeader } from "./GlassCard";
import { DataTable, type TableColumn } from "./DataTable";
import { Button } from "../ui";
import SoftTextField from "@/components/mui/SoftTextField";
import {
  type AdminIdentityPolicySummary,
  type AdminIdentityRoleDefinition,
  type AdminIdentityWorkspace,
  type AdminUpdateUserInput,
  type AppUser,
  adminApplyUserAccessControl,
  adminCreateRoleDefinition,
  adminCreateUser,
  adminDeleteUser,
  adminGrantUserRole,
  adminHandleMaliciousUser,
  adminIssueUserWarning,
  adminPatchUser,
  adminResetUserCredentials,
  adminResolveUserWarning,
  adminReviewUserIdentity,
  adminRevokeUserRole,
  adminUpdateIdentityPolicies,
  adminUpdateRoleDefinition,
  adminUsersWorkspace,
} from "@/lib/api";

type Notice = {
  tone: "success" | "error" | "info";
  message: string;
} | null;

type UserDialogMode = "create" | "edit" | null;
type RoleDialogMode = "create" | "edit" | null;

type UserFormState = {
  email: string;
  username: string;
  fullName: string;
  password: string;
  roles: string[];
  suspended: boolean;
  documentsVerified: boolean;
};

type RoleFormState = {
  key: string;
  label: string;
  description: string;
  inherits: string[];
  permissionsText: string;
};

type AccessFormState = {
  accessLevel: string;
  accessScope: string;
  permissions: string[];
  privilegeNote: string;
  elevatedUntil: string;
  mfaRequired: boolean;
  mfaEnabled: boolean;
  oauthEnabled: boolean;
  ssoEnabled: boolean;
  adaptiveAuthEnabled: boolean;
  forcePasswordReset: boolean;
  riskLevel: string;
  riskReason: string;
  failedLoginAttempts: number;
};

type VerificationFormState = {
  emailVerified: boolean;
  phoneVerified: boolean;
  documentVerified: boolean;
  status: string;
  reviewNote: string;
  kycMethod: string;
};

type CredentialFormState = {
  newPassword: string;
  forceReset: boolean;
  channel: string;
};

type WarningFormState = {
  severity: string;
  reason: string;
  note: string;
  suspendUser: boolean;
};

type MaliciousFormState = {
  action: string;
  reason: string;
  ipAddresses: string;
  deviceIds: string;
};

const emptyUserForm: UserFormState = {
  email: "",
  username: "",
  fullName: "",
  password: "",
  roles: ["ROLE_FREELANCER"],
  suspended: false,
  documentsVerified: false,
};

const emptyRoleForm: RoleFormState = {
  key: "",
  label: "",
  description: "",
  inherits: [],
  permissionsText: "",
};

const emptyAccessForm: AccessFormState = {
  accessLevel: "STANDARD",
  accessScope: "PLATFORM",
  permissions: [],
  privilegeNote: "",
  elevatedUntil: "",
  mfaRequired: false,
  mfaEnabled: false,
  oauthEnabled: true,
  ssoEnabled: false,
  adaptiveAuthEnabled: true,
  forcePasswordReset: false,
  riskLevel: "LOW",
  riskReason: "",
  failedLoginAttempts: 0,
};

const emptyVerificationForm: VerificationFormState = {
  emailVerified: false,
  phoneVerified: false,
  documentVerified: false,
  status: "UNVERIFIED",
  reviewNote: "",
  kycMethod: "MANUAL_REVIEW",
};

const emptyCredentialForm: CredentialFormState = {
  newPassword: "",
  forceReset: true,
  channel: "ADMIN_CONSOLE",
};

const emptyWarningForm: WarningFormState = {
  severity: "MEDIUM",
  reason: "",
  note: "",
  suspendUser: false,
};

const emptyMaliciousForm: MaliciousFormState = {
  action: "BAN",
  reason: "",
  ipAddresses: "",
  deviceIds: "",
};

const fallbackPolicies: AdminIdentityPolicySummary = {
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSymbol: true,
    expiryDays: 90,
    passwordReuseLimit: 5,
  },
  authenticationPolicy: {
    mfaRequiredForAdmins: true,
    oauthEnabled: true,
    ssoEnabled: false,
    adaptiveAuthEnabled: true,
    zeroTrustEnabled: true,
    abacEnabled: false,
    rateLimitPerMinute: 120,
    maxFailedLoginAttempts: 5,
    sessionTimeoutMinutes: 30,
  },
  governancePolicy: {
    leastPrivilegeEnforced: true,
    auditTrailEnabled: true,
    anomalyAlertsEnabled: true,
    automatedProvisioningEnabled: true,
  },
  updatedAt: undefined,
};

const toneColor: Record<string, string> = {
  critical: "#dc2626",
  warning: "#d97706",
  success: "#16a34a",
  info: "#0284c7",
  neutral: "#64748b",
};

const chartPalette = ["#0f766e", "#0284c7", "#22c55e", "#f59e0b", "#ef4444", "#7c3aed"];

const accessLevels = ["STANDARD", "PRIVILEGED", "RESTRICTED", "EMERGENCY"];
const riskLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const verificationStatuses = ["UNVERIFIED", "PENDING", "REVIEW", "VERIFIED", "REJECTED"];
const kycMethods = ["MANUAL_REVIEW", "EMAIL", "PHONE_OTP", "DOCUMENT", "GOVERNMENT_ID"];
const warningSeverities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const resetChannels = ["ADMIN_CONSOLE", "EMAIL_LINK", "SMS_OTP"];
const maliciousActions = ["BAN", "BLOCK", "UNBLOCK"];
const basePermissions = [
  "users.read",
  "users.write",
  "users.delete",
  "roles.manage",
  "permissions.manage",
  "verification.review",
  "warnings.manage",
  "activity.read",
  "security.audit",
  "iam.export",
];

export function UserTableColumns(
  roleLookup: Map<string, string>,
  onEdit: (user: AppUser) => void,
  onSuspend: (user: AppUser) => void,
  onDelete: (user: AppUser) => void,
  busyAction: string | null
): TableColumn<AppUser>[] {
  return [
    {
      key: "fullName",
      label: "User",
      sortable: true,
      render: (_, user) => (
        <Stack spacing={0.35}>
          <Typography variant="subtitle2" fontWeight={800}>
            {user.fullName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {(user.accountType ?? "user").toUpperCase()} {user.companyName ? `· ${user.companyName}` : ""} {user.username ? `· @${user.username}` : ""}
          </Typography>
        </Stack>
      ),
    },
    {
      key: "identity",
      label: "Identity",
      render: (_, user) => (
        <Stack spacing={0.65}>
          <Chip label={user.identity?.status ?? "UNVERIFIED"} size="small" color={user.identity?.status === "VERIFIED" ? "success" : "default"} variant="outlined" />
          <Chip label={user.suspended ? "Suspended" : "Active"} size="small" color={user.suspended ? "warning" : "success"} variant="outlined" />
          <Chip 
            label={user.security?.banned ? "Banned" : user.security?.riskLevel ?? "LOW"} 
            size="small" 
            color={user.security?.riskLevel === "CRITICAL" ? "error" : user.security?.riskLevel === "HIGH" ? "warning" : "default"} 
            variant="outlined" 
          />
        </Stack>
      ),
    },
    {
      key: "access",
      label: "Access",
      render: (_, user) => (
        <Stack spacing={0.4}>
          <Typography variant="body2" fontWeight={700}>
            {user.access?.accessLevel ?? "STANDARD"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {(user.access?.permissions?.length ?? 0)} permissions · {user.access?.accessScope ?? "PLATFORM"}
          </Typography>
        </Stack>
      ),
    },
    {
      key: "roles",
      label: "Roles",
      render: (_, user) => (
        <Stack direction="row" spacing={0.6} useFlexGap flexWrap="wrap" sx={{ maxWidth: 200 }}>
          {user.roles.map((role) => (
            <Chip
              key={`${user.id}-${role}`}
              size="small"
              label={roleLookup.get(role) ?? role.replace(/^ROLE_/, "").replace(/_/g, " ")}
              color={role.includes("ADMIN") ? "primary" : "default"}
              variant="outlined"
            />
          ))}
        </Stack>
      ),
    },
    {
      key: "createdAt",
      label: "Activity",
      sortable: true,
      render: (_, user) => (
        <Stack spacing={0.35}>
          <Typography variant="caption" color="text.secondary">
            Created: {formatDateTime(user.createdAt)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Last seen: {formatDateTime(user.lastSeenAt)}
          </Typography>
        </Stack>
      ),
    },
    {
      key: "id",
      label: "Actions",
      align: "right",
      render: (_, user) => {
        const busy = busyAction?.includes(user.id);
        return (
          <Stack direction="row" spacing={0.8} justifyContent="flex-end">
            <Button variant="outline" size="sm" leftIcon={<EditRoundedIcon sx={{ fontSize: 16 }} />} onClick={(e) => { e.stopPropagation(); onEdit(user); }}>
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              color={user.suspended ? "success" : "warning"}
              isLoading={busy}
              leftIcon={user.suspended ? <LockOpenRoundedIcon sx={{ fontSize: 16 }} /> : <LockRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={(e) => { e.stopPropagation(); onSuspend(user); }}
            >
              {user.suspended ? "Reactivate" : "Suspend"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              color="danger"
              isLoading={busy}
              leftIcon={<DeleteRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={(e) => { e.stopPropagation(); onDelete(user); }}
            >
              Delete
            </Button>
          </Stack>
        );
      },
    },
  ];
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "--";
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }
  return new Date(timestamp).toLocaleString();
}

function toUserForm(user: AppUser): UserFormState {
  return {
    email: user.email,
    username: user.username ?? "",
    fullName: user.fullName,
    password: "",
    roles: user.roles ?? [],
    suspended: !!user.suspended,
    documentsVerified: !!user.documentsVerified,
  };
}

function toRoleForm(role: AdminIdentityRoleDefinition): RoleFormState {
  return {
    key: role.key,
    label: role.label,
    description: role.description ?? "",
    inherits: role.inherits ?? [],
    permissionsText: (role.permissions ?? []).join(", "),
  };
}

function toAccessForm(user: AppUser): AccessFormState {
  return {
    accessLevel: user.access?.accessLevel ?? "STANDARD",
    accessScope: user.access?.accessScope ?? "PLATFORM",
    permissions: user.access?.permissions ?? [],
    privilegeNote: user.access?.privilegeNote ?? "",
    elevatedUntil: user.access?.elevatedUntil ? user.access.elevatedUntil.slice(0, 16) : "",
    mfaRequired: !!user.security?.mfaRequired,
    mfaEnabled: !!user.security?.mfaEnabled,
    oauthEnabled: user.security?.oauthEnabled ?? true,
    ssoEnabled: !!user.security?.ssoEnabled,
    adaptiveAuthEnabled: user.security?.adaptiveAuthEnabled ?? true,
    forcePasswordReset: !!user.security?.forcePasswordReset,
    riskLevel: user.security?.riskLevel ?? "LOW",
    riskReason: user.security?.riskReason ?? "",
    failedLoginAttempts: user.security?.failedLoginAttempts ?? 0,
  };
}

function toVerificationForm(user: AppUser): VerificationFormState {
  return {
    emailVerified: !!user.identity?.emailVerified,
    phoneVerified: !!user.identity?.phoneVerified,
    documentVerified: !!user.identity?.documentVerified,
    status: user.identity?.status ?? "UNVERIFIED",
    reviewNote: user.identity?.reviewNote ?? "",
    kycMethod: user.identity?.kycMethod ?? "MANUAL_REVIEW",
  };
}

function normalizeCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function csvEscape(value: unknown) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) {
    return "";
  }
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  }
  return lines.join("\n");
}

function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function noticeSeverity(notice: Notice) {
  if (!notice) {
    return "info" as const;
  }
  return notice.tone === "error" ? "error" : notice.tone === "success" ? "success" : "info";
}

export default function AdminUserManagementWorkspace() {
  const [workspace, setWorkspace] = useState<AdminIdentityWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended" | "banned" | "risk">("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedGrantRole, setSelectedGrantRole] = useState("");
  const [userDialogMode, setUserDialogMode] = useState<UserDialogMode>(null);
  const [roleDialogMode, setRoleDialogMode] = useState<RoleDialogMode>(null);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editingRole, setEditingRole] = useState<AdminIdentityRoleDefinition | null>(null);
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);
  const [roleForm, setRoleForm] = useState<RoleFormState>(emptyRoleForm);
  const [accessForm, setAccessForm] = useState<AccessFormState>(emptyAccessForm);
  const [verificationForm, setVerificationForm] = useState<VerificationFormState>(emptyVerificationForm);
  const [credentialForm, setCredentialForm] = useState<CredentialFormState>(emptyCredentialForm);
  const [warningForm, setWarningForm] = useState<WarningFormState>(emptyWarningForm);
  const [maliciousForm, setMaliciousForm] = useState<MaliciousFormState>(emptyMaliciousForm);
  const [policyDraft, setPolicyDraft] = useState<AdminIdentityPolicySummary>(fallbackPolicies);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminUsersWorkspace();
      setWorkspace(result);
      setPolicyDraft(result.policies ?? fallbackPolicies);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to load identity workspace.";
      setError(message);
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const users = workspace?.users ?? [];
  const roles = workspace?.roles ?? [];
  const policies = workspace?.policies ?? fallbackPolicies;

  const roleLookup = useMemo(() => {
    return new Map(roles.map((role) => [role.key, role.label]));
  }, [roles]);

  const permissionCatalog = useMemo(() => {
    return Array.from(new Set([
      ...basePermissions,
      ...roles.flatMap((role) => role.permissions ?? []),
      ...users.flatMap((user) => user.access?.permissions ?? []),
    ])).sort();
  }, [roles, users]);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter((user) => {
      if (statusFilter === "active" && (user.suspended || user.security?.banned)) {
        return false;
      }
      if (statusFilter === "suspended" && !user.suspended) {
        return false;
      }
      if (statusFilter === "banned" && !user.security?.banned) {
        return false;
      }
      if (statusFilter === "risk") {
        const riskLevel = user.security?.riskLevel ?? "LOW";
        if (!["HIGH", "CRITICAL"].includes(riskLevel)) {
          return false;
        }
      }
      if (accountFilter !== "all" && (user.accountType ?? "user") !== accountFilter) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      return [user.fullName, user.email, user.username ?? "", user.id, user.companyName ?? "", user.identity?.status ?? ""]
        .some((value) => value.toLowerCase().includes(normalized));
    });
  }, [accountFilter, query, statusFilter, users]);

  const selectedUser = useMemo(() => {
    if (!selectedUserId) {
      return filteredUsers[0] ?? users[0] ?? null;
    }
    return users.find((user) => user.id === selectedUserId) ?? filteredUsers[0] ?? users[0] ?? null;
  }, [filteredUsers, selectedUserId, users]);

  useEffect(() => {
    if (selectedUser && selectedUser.id !== selectedUserId) {
      setSelectedUserId(selectedUser.id);
    }
    if (!selectedUser && selectedUserId) {
      setSelectedUserId(null);
    }
  }, [selectedUser, selectedUserId]);

  useEffect(() => {
    if (!selectedUser) {
      return;
    }
    setSelectedGrantRole("");
    setAccessForm(toAccessForm(selectedUser));
    setVerificationForm(toVerificationForm(selectedUser));
    setCredentialForm(emptyCredentialForm);
    setWarningForm(emptyWarningForm);
    setMaliciousForm(emptyMaliciousForm);
  }, [selectedUser]);

  const openCreateUser = () => {
    setUserDialogMode("create");
    setEditingUser(null);
    setUserForm({
      ...emptyUserForm,
      roles: roles.some((role) => role.key === "ROLE_FREELANCER") ? ["ROLE_FREELANCER"] : roles.slice(0, 1).map((role) => role.key),
    });
  };

  const openEditUser = (user: AppUser) => {
    setUserDialogMode("edit");
    setEditingUser(user);
    setUserForm(toUserForm(user));
  };

  const openCreateRole = () => {
    setRoleDialogMode("create");
    setEditingRole(null);
    setRoleForm(emptyRoleForm);
  };

  const openEditRole = (role: AdminIdentityRoleDefinition) => {
    setRoleDialogMode("edit");
    setEditingRole(role);
    setRoleForm(toRoleForm(role));
  };

  const runAction = useCallback(async (key: string, action: () => Promise<void>, successMessage?: string) => {
    setBusyAction(key);
    setNotice(null);
    try {
      await action();
      await load();
      if (successMessage) {
        setNotice({ tone: "success", message: successMessage });
      }
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Admin action failed.";
      setNotice({ tone: "error", message });
    } finally {
      setBusyAction(null);
    }
  }, [load]);

  const handleSaveUser = async () => {
    const payload: AdminCreateUserInput | AdminUpdateUserInput = {
      email: userForm.email.trim(),
      username: userForm.username.trim() || undefined,
      fullName: userForm.fullName.trim(),
      roles: userForm.roles,
      suspended: userForm.suspended,
      documentsVerified: userForm.documentsVerified,
      ...(userForm.password.trim() ? { password: userForm.password } : {}),
    };

    await runAction(
      userDialogMode === "create" ? "create-user" : `edit-user-${editingUser?.id ?? "unknown"}`,
      async () => {
        if (userDialogMode === "create") {
          await adminCreateUser(payload as AdminCreateUserInput);
        } else if (editingUser) {
          await adminPatchUser(editingUser.id, payload as AdminUpdateUserInput);
        }
        setUserDialogMode(null);
      },
      userDialogMode === "create" ? "User account created." : "User account updated.",
    );
  };

  const handleDeleteUser = async (user: AppUser) => {
    if (typeof window !== "undefined" && !window.confirm(`Delete ${user.fullName}? This cannot be undone.`)) {
      return;
    }
    await runAction(`delete-${user.id}`, async () => {
      await adminDeleteUser(user.id);
      if (selectedUserId === user.id) {
        setSelectedUserId(null);
      }
    }, `${user.fullName} deleted.`);
  };

  const handleToggleSuspend = async (user: AppUser) => {
    await runAction(
      `suspend-${user.id}`,
      async () => {
        await adminPatchUser(user.id, { suspended: !user.suspended });
      },
      `${user.fullName} ${user.suspended ? "reactivated" : "suspended"}.`,
    );
  };

  const handleGrantRole = async () => {
    if (!selectedUser || !selectedGrantRole) {
      return;
    }
    await runAction(
      `grant-role-${selectedUser.id}`,
      async () => {
        await adminGrantUserRole(selectedUser.id, selectedGrantRole);
        setSelectedGrantRole("");
      },
      `${roleLookup.get(selectedGrantRole) ?? selectedGrantRole} granted to ${selectedUser.fullName}.`,
    );
  };

  const handleRevokeRole = async (role: string) => {
    if (!selectedUser) {
      return;
    }
    await runAction(
      `revoke-role-${selectedUser.id}-${role}`,
      async () => {
        await adminRevokeUserRole(selectedUser.id, role);
      },
      `${roleLookup.get(role) ?? role} revoked from ${selectedUser.fullName}.`,
    );
  };

  const handleSaveRole = async () => {
    const permissionList = normalizeCommaList(roleForm.permissionsText.toLowerCase());
    await runAction(
      roleDialogMode === "create" ? "create-role" : `edit-role-${editingRole?.id ?? "unknown"}`,
      async () => {
        if (roleDialogMode === "create") {
          await adminCreateRoleDefinition({
            key: roleForm.key,
            label: roleForm.label,
            description: roleForm.description || undefined,
            inherits: roleForm.inherits,
            permissions: permissionList,
          });
        } else if (editingRole) {
          await adminUpdateRoleDefinition(editingRole.id, {
            label: roleForm.label,
            description: roleForm.description || undefined,
            inherits: roleForm.inherits,
            permissions: permissionList,
          });
        }
        setRoleDialogMode(null);
      },
      roleDialogMode === "create" ? "Role definition created." : "Role definition updated.",
    );
  };

  const handleApplyAccessControl = async () => {
    if (!selectedUser) {
      return;
    }
    await runAction(
      `access-${selectedUser.id}`,
      async () => {
        await adminApplyUserAccessControl(selectedUser.id, {
          accessLevel: accessForm.accessLevel,
          accessScope: accessForm.accessScope,
          permissions: accessForm.permissions,
          privilegeNote: accessForm.privilegeNote || undefined,
          elevatedUntil: accessForm.elevatedUntil ? new Date(accessForm.elevatedUntil).toISOString() : null,
          mfaRequired: accessForm.mfaRequired,
          mfaEnabled: accessForm.mfaEnabled,
          oauthEnabled: accessForm.oauthEnabled,
          ssoEnabled: accessForm.ssoEnabled,
          adaptiveAuthEnabled: accessForm.adaptiveAuthEnabled,
          forcePasswordReset: accessForm.forcePasswordReset,
          riskLevel: accessForm.riskLevel,
          riskReason: accessForm.riskReason || undefined,
          failedLoginAttempts: accessForm.failedLoginAttempts,
        });
      },
      `Access controls updated for ${selectedUser.fullName}.`,
    );
  };

  const handleReviewIdentity = async () => {
    if (!selectedUser) {
      return;
    }
    await runAction(
      `verify-${selectedUser.id}`,
      async () => {
        await adminReviewUserIdentity(selectedUser.id, {
          emailVerified: verificationForm.emailVerified,
          phoneVerified: verificationForm.phoneVerified,
          documentVerified: verificationForm.documentVerified,
          status: verificationForm.status,
          reviewNote: verificationForm.reviewNote || undefined,
          kycMethod: verificationForm.kycMethod,
        });
      },
      `Identity review updated for ${selectedUser.fullName}.`,
    );
  };

  const handleResetCredentials = async () => {
    if (!selectedUser) {
      return;
    }
    await runAction(
      `credential-${selectedUser.id}`,
      async () => {
        await adminResetUserCredentials(selectedUser.id, {
          newPassword: credentialForm.newPassword || undefined,
          forceReset: credentialForm.forceReset,
          channel: credentialForm.channel,
        });
        setCredentialForm(emptyCredentialForm);
      },
      `Credential reset workflow updated for ${selectedUser.fullName}.`,
    );
  };

  const handleIssueWarning = async () => {
    if (!selectedUser || !warningForm.reason.trim()) {
      return;
    }
    await runAction(
      `warning-${selectedUser.id}`,
      async () => {
        await adminIssueUserWarning(selectedUser.id, {
          severity: warningForm.severity,
          reason: warningForm.reason.trim(),
          note: warningForm.note.trim() || undefined,
          suspendUser: warningForm.suspendUser,
        });
        setWarningForm(emptyWarningForm);
      },
      `Warning issued for ${selectedUser.fullName}.`,
    );
  };

  const handleResolveWarning = async (warningId: string) => {
    if (!selectedUser) {
      return;
    }
    await runAction(
      `resolve-warning-${warningId}`,
      async () => {
        await adminResolveUserWarning(selectedUser.id, warningId, { note: "Resolved from IAM console" });
      },
      `Warning resolved for ${selectedUser.fullName}.`,
    );
  };

  const handleMaliciousControl = async () => {
    if (!selectedUser || !maliciousForm.reason.trim()) {
      return;
    }
    await runAction(
      `malicious-${selectedUser.id}`,
      async () => {
        await adminHandleMaliciousUser(selectedUser.id, {
          action: maliciousForm.action,
          reason: maliciousForm.reason.trim(),
          ipAddresses: normalizeCommaList(maliciousForm.ipAddresses),
          deviceIds: normalizeCommaList(maliciousForm.deviceIds),
        });
        setMaliciousForm(emptyMaliciousForm);
      },
      `${maliciousForm.action} action applied to ${selectedUser.fullName}.`,
    );
  };

  const handleSavePolicies = async () => {
    await runAction(
      "save-policies",
      async () => {
        const updated = await adminUpdateIdentityPolicies(policyDraft);
        setPolicyDraft(updated);
      },
      "Authentication and password policies updated.",
    );
  };

  const exportAuditJson = () => {
    if (!workspace) {
      return;
    }
    downloadTextFile("iam-audit-log.json", JSON.stringify(workspace.auditTrail, null, 2), "application/json");
    setNotice({ tone: "info", message: "Audit log exported as JSON." });
  };

  const exportAuditCsv = () => {
    if (!workspace) {
      return;
    }
    const csv = toCsv(workspace.auditTrail.map((entry) => ({
      id: entry.id,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      actorUserId: entry.actorUserId,
      createdAt: entry.createdAt,
      metadata: JSON.stringify(entry.metadata ?? {}),
    })));
    downloadTextFile("iam-audit-log.csv", csv, "text/csv;charset=utf-8");
    setNotice({ tone: "info", message: "Audit log exported as CSV." });
  };

  const exportActivityReport = () => {
    if (!workspace) {
      return;
    }
    const csv = toCsv(workspace.activityTrend.map((entry) => ({
      month: entry.month,
      newUsers: entry.newUsers,
      activeUsers: entry.activeUsers,
      credentialResets: entry.credentialResets,
      suspensions: entry.suspensions,
    })));
    downloadTextFile("iam-activity-report.csv", csv, "text/csv;charset=utf-8");
    setNotice({ tone: "info", message: "User activity report exported as CSV." });
  };

  const availableRolesForSelectedUser = useMemo(() => {
    if (!selectedUser) {
      return roles;
    }
    return roles.filter((role) => !selectedUser.roles.includes(role.key));
  }, [roles, selectedUser]);

  return (
    <Stack spacing={2.2}>
      <GlassCard
        sx={{
          color: "common.white",
        }}
        gradient
      >
        <CardContent>
          <Stack spacing={1.2}>
            <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ lg: "center" }} gap={1.2}>
              <Box>
                <Typography variant="overline" sx={{ letterSpacing: "0.14em", opacity: 0.76 }}>
                  IDENTITY & ACCESS MANAGEMENT
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.02 }}>
                  Enterprise user administration now runs as an IAM control plane
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.84, maxWidth: 920 }}>
                  Manage user lifecycle, roles, access controls, identity verification, credential resets, warnings, malicious-user response,
                  authentication policy, and auditable exports from one real admin workspace.
                </Typography>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  variant="outline"
                  onClick={() => void load()}
                  isLoading={loading}
                  leftIcon={<RefreshRoundedIcon />}
                  sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.45)" }}
                >
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  onClick={exportAuditJson}
                  disabled={!workspace}
                  leftIcon={<HistoryRoundedIcon />}
                  sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.45)" }}
                >
                  Export JSON
                </Button>
                <Button variant="primary" onClick={openCreateUser} leftIcon={<AddRoundedIcon />} sx={{ bgcolor: "#fff", color: "#111827", "&:hover": { bgcolor: alpha("#fff", 0.9) } }}>
                  Add User
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </GlassCard>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {notice ? <Alert severity={noticeSeverity(notice)}>{notice.message}</Alert> : null}

      <Grid container spacing={2}>
        {(workspace?.metrics ?? []).map((metric) => (
          <Grid key={metric.key} size={{ xs: 12, sm: 6, xl: 2 }}>
            <GlassCard sx={{ height: "100%" }} hover>
              <CardContent>
                <Stack spacing={0.7}>
                  <Typography variant="body2" color="text.secondary">
                    {metric.label}
                  </Typography>
                  <Typography variant="h4" fontWeight={900}>
                    {metric.value}
                  </Typography>
                  <Chip
                    label={metric.tone.toUpperCase()}
                    size="small"
                    sx={{
                      alignSelf: "flex-start",
                      bgcolor: `${toneColor[metric.tone] ?? toneColor.neutral}15`,
                      color: toneColor[metric.tone] ?? toneColor.neutral,
                      fontWeight: 700,
                    }}
                  />
                </Stack>
              </CardContent>
            </GlassCard>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="h6" fontWeight={800}>
                  Identity Activity Trend
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  New users, active access, credential resets, and suspension activity.
                </Typography>
                <Box sx={{ height: 290 }}>
                  <NoSsrResponsiveContainer fallbackHeight={290}>
                    <LineChart data={workspace?.activityTrend ?? []} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="newUsers" stroke="#0284c7" strokeWidth={2.2} dot={false} />
                      <Line type="monotone" dataKey="activeUsers" stroke="#16a34a" strokeWidth={2.2} dot={false} />
                      <Line type="monotone" dataKey="credentialResets" stroke="#f59e0b" strokeWidth={2.2} dot={false} />
                    </LineChart>
                  </NoSsrResponsiveContainer>
                </Box>
              </Stack>
            </CardContent>
          </GlassCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="h6" fontWeight={800}>
                      Role Coverage
                    </Typography>
                    <Box sx={{ height: 250 }}>
                      <NoSsrResponsiveContainer fallbackHeight={250}>
                        <BarChart data={workspace?.roleDistribution ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-18} height={55} interval={0} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {(workspace?.roleDistribution ?? []).map((entry) => (
                              <Cell key={entry.label} fill={toneColor[entry.tone] ?? toneColor.info} />
                            ))}
                          </Bar>
                        </BarChart>
                      </NoSsrResponsiveContainer>
                    </Box>
                  </Stack>
                </CardContent>
              </GlassCard>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="h6" fontWeight={800}>
                      Verification Coverage
                    </Typography>
                    <Box sx={{ height: 250 }}>
                      <NoSsrResponsiveContainer fallbackHeight={250}>
                        <PieChart>
                          <Pie
                            data={workspace?.verificationDistribution ?? []}
                            dataKey="value"
                            nameKey="label"
                            innerRadius={50}
                            outerRadius={82}
                            paddingAngle={3}
                          >
                            {(workspace?.verificationDistribution ?? []).map((entry, index) => (
                              <Cell key={entry.label} fill={toneColor[entry.tone] ?? chartPalette[index % chartPalette.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </NoSsrResponsiveContainer>
                    </Box>
                  </Stack>
                </CardContent>
              </GlassCard>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, xl: 7 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Stack spacing={1.2}>
                <Stack direction={{ xs: "column", lg: "row" }} gap={1.2}>
                  <SoftTextField
                    fullWidth
                    label="Search users"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Name, email, username, company, user ID"
                    InputProps={{ startAdornment: <SearchRoundedIcon sx={{ fontSize: 18, mr: 1, color: "text.secondary" }} /> }}
                  />
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel id="user-status-filter">Status</InputLabel>
                    <Select
                      labelId="user-status-filter"
                      value={statusFilter}
                      label="Status"
                      onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                    >
                      <MenuItem value="all">All states</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="suspended">Suspended</MenuItem>
                      <MenuItem value="banned">Banned</MenuItem>
                      <MenuItem value="risk">High Risk</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel id="user-account-filter">Account Type</InputLabel>
                    <Select
                      labelId="user-account-filter"
                      value={accountFilter}
                      label="Account Type"
                      onChange={(event) => setAccountFilter(event.target.value)}
                    >
                      <MenuItem value="all">All types</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="employer">Employer</MenuItem>
                      <MenuItem value="freelancer">Freelancer</MenuItem>
                      <MenuItem value="user">User</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>

                <DataTable
                  columns={UserTableColumns(roleLookup, openEditUser, handleToggleSuspend, handleDeleteUser, busyAction)}
                  data={filteredUsers}
                  rowKey="id"
                  loading={loading}
                  onRowClick={(user) => setSelectedUserId(user.id)}
                  searchable={false} // Already have custom search above
                  exportable={true}
                  onExport={(format) => format === 'csv' ? exportActivityReport() : undefined}
                />
              </Stack>
            </CardContent>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, xl: 5 }}>
          <Stack spacing={2}>
            <GlassCard sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                {selectedUser ? (
                  <Stack spacing={1.2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                      <Box>
                        <Typography variant="h6" fontWeight={800}>
                          {selectedUser.fullName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedUser.email} · {(selectedUser.accountType ?? "user").toUpperCase()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          User ID: {selectedUser.id}
                        </Typography>
                      </Box>
                      <Chip
                        label={selectedUser.security?.riskLevel ?? "LOW"}
                        size="small"
                        color={selectedUser.security?.riskLevel === "CRITICAL" ? "error" : selectedUser.security?.riskLevel === "HIGH" ? "warning" : "default"}
                        variant="outlined"
                      />
                    </Stack>

                    <Divider />

                    <Stack spacing={1}>
                      <Typography variant="subtitle2" fontWeight={800}>
                        Roles & Privileges
                      </Typography>
                      <Stack direction="row" spacing={0.6} useFlexGap flexWrap="wrap">
                        {selectedUser.roles.map((role) => (
                          <Chip
                            key={`${selectedUser.id}-selected-${role}`}
                            label={roleLookup.get(role) ?? role.replace(/^ROLE_/, "").replace(/_/g, " ")}
                            size="small"
                            onDelete={selectedUser.roles.length > 1 ? () => void handleRevokeRole(role) : undefined}
                            color={role.includes("ADMIN") ? "primary" : "default"}
                            disabled={!!busyAction}
                          />
                        ))}
                      </Stack>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="grant-role-select">Grant role</InputLabel>
                          <Select
                            labelId="grant-role-select"
                            label="Grant role"
                            value={selectedGrantRole}
                            onChange={(event) => setSelectedGrantRole(event.target.value)}
                          >
                            <MenuItem value="">Select role</MenuItem>
                            {availableRolesForSelectedUser.map((role) => (
                              <MenuItem key={role.id} value={role.key}>
                                {role.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Button variant="outlined" startIcon={<ManageAccountsRoundedIcon />} disabled={!selectedGrantRole || !!busyAction} onClick={() => void handleGrantRole()}>
                          Grant
                        </Button>
                      </Stack>
                    </Stack>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a user to open identity operations.
                  </Typography>
                )}
              </CardContent>
            </GlassCard>

            <GlassCard sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Stack spacing={1.2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <SecurityRoundedIcon fontSize="small" />
                    <Typography variant="h6" fontWeight={800}>
                      Access Control
                    </Typography>
                  </Stack>
                  <Grid container spacing={1.1}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="access-level">Access level</InputLabel>
                        <Select
                          labelId="access-level"
                          label="Access level"
                          value={accessForm.accessLevel}
                          onChange={(event) => setAccessForm((current) => ({ ...current, accessLevel: event.target.value }))}
                        >
                          {accessLevels.map((level) => (
                            <MenuItem key={level} value={level}>
                              {level}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <SoftTextField
                        fullWidth
                        label="Access scope"
                        value={accessForm.accessScope}
                        onChange={(event) => setAccessForm((current) => ({ ...current, accessScope: event.target.value }))}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="permission-select">Permissions</InputLabel>
                        <Select
                          multiple
                          labelId="permission-select"
                          label="Permissions"
                          value={accessForm.permissions}
                          onChange={(event) => setAccessForm((current) => ({ ...current, permissions: event.target.value as string[] }))}
                          renderValue={(selected) => (selected as string[]).join(", ")}
                        >
                          {permissionCatalog.map((permission) => (
                            <MenuItem key={permission} value={permission}>
                              {permission}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <SoftTextField
                        fullWidth
                        label="Privilege note"
                        value={accessForm.privilegeNote}
                        onChange={(event) => setAccessForm((current) => ({ ...current, privilegeNote: event.target.value }))}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <SoftTextField
                        fullWidth
                        type="datetime-local"
                        label="Elevated until"
                        value={accessForm.elevatedUntil}
                        onChange={(event) => setAccessForm((current) => ({ ...current, elevatedUntil: event.target.value }))}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <SoftTextField
                        fullWidth
                        type="number"
                        label="Failed login attempts"
                        value={accessForm.failedLoginAttempts}
                        onChange={(event) => setAccessForm((current) => ({ ...current, failedLoginAttempts: Number(event.target.value) || 0 }))}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="risk-level">Risk level</InputLabel>
                        <Select
                          labelId="risk-level"
                          label="Risk level"
                          value={accessForm.riskLevel}
                          onChange={(event) => setAccessForm((current) => ({ ...current, riskLevel: event.target.value }))}
                        >
                          {riskLevels.map((level) => (
                            <MenuItem key={level} value={level}>
                              {level}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <SoftTextField
                        fullWidth
                        label="Risk reason"
                        value={accessForm.riskReason}
                        onChange={(event) => setAccessForm((current) => ({ ...current, riskReason: event.target.value }))}
                      />
                    </Grid>
                  </Grid>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <FormControlLabel control={<Switch checked={accessForm.mfaRequired} onChange={(event) => setAccessForm((current) => ({ ...current, mfaRequired: event.target.checked }))} />} label="Require MFA" />
                    <FormControlLabel control={<Switch checked={accessForm.mfaEnabled} onChange={(event) => setAccessForm((current) => ({ ...current, mfaEnabled: event.target.checked }))} />} label="MFA Enabled" />
                    <FormControlLabel control={<Switch checked={accessForm.oauthEnabled} onChange={(event) => setAccessForm((current) => ({ ...current, oauthEnabled: event.target.checked }))} />} label="OAuth" />
                    <FormControlLabel control={<Switch checked={accessForm.ssoEnabled} onChange={(event) => setAccessForm((current) => ({ ...current, ssoEnabled: event.target.checked }))} />} label="SSO" />
                    <FormControlLabel control={<Switch checked={accessForm.adaptiveAuthEnabled} onChange={(event) => setAccessForm((current) => ({ ...current, adaptiveAuthEnabled: event.target.checked }))} />} label="Adaptive Auth" />
                    <FormControlLabel control={<Switch checked={accessForm.forcePasswordReset} onChange={(event) => setAccessForm((current) => ({ ...current, forcePasswordReset: event.target.checked }))} />} label="Force Reset" />
                  </Stack>
                  <Button variant="contained" startIcon={<SaveRoundedIcon />} disabled={!selectedUser || !!busyAction} onClick={() => void handleApplyAccessControl()}>
                    Apply Access Control
                  </Button>
                </Stack>
              </CardContent>
            </GlassCard>

            <GlassCard sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Stack spacing={1.2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <VerifiedUserRoundedIcon fontSize="small" />
                    <Typography variant="h6" fontWeight={800}>
                      Identity Review & Credentials
                    </Typography>
                  </Stack>
                  <Grid container spacing={1.1}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="verification-status">Verification status</InputLabel>
                        <Select
                          labelId="verification-status"
                          label="Verification status"
                          value={verificationForm.status}
                          onChange={(event) => setVerificationForm((current) => ({ ...current, status: event.target.value }))}
                        >
                          {verificationStatuses.map((status) => (
                            <MenuItem key={status} value={status}>
                              {status}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="kyc-method">KYC method</InputLabel>
                        <Select
                          labelId="kyc-method"
                          label="KYC method"
                          value={verificationForm.kycMethod}
                          onChange={(event) => setVerificationForm((current) => ({ ...current, kycMethod: event.target.value }))}
                        >
                          {kycMethods.map((method) => (
                            <MenuItem key={method} value={method}>
                              {method}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <SoftTextField
                        fullWidth
                        label="Review note"
                        value={verificationForm.reviewNote}
                        onChange={(event) => setVerificationForm((current) => ({ ...current, reviewNote: event.target.value }))}
                      />
                    </Grid>
                  </Grid>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <FormControlLabel control={<Switch checked={verificationForm.emailVerified} onChange={(event) => setVerificationForm((current) => ({ ...current, emailVerified: event.target.checked }))} />} label="Email Verified" />
                    <FormControlLabel control={<Switch checked={verificationForm.phoneVerified} onChange={(event) => setVerificationForm((current) => ({ ...current, phoneVerified: event.target.checked }))} />} label="Phone Verified" />
                    <FormControlLabel control={<Switch checked={verificationForm.documentVerified} onChange={(event) => setVerificationForm((current) => ({ ...current, documentVerified: event.target.checked }))} />} label="Document Verified" />
                  </Stack>
                  <Button variant="outlined" startIcon={<VerifiedUserRoundedIcon />} disabled={!selectedUser || !!busyAction} onClick={() => void handleReviewIdentity()}>
                    Save Identity Review
                  </Button>

                  <Divider />

                  <Grid container spacing={1.1}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <SoftTextField
                        fullWidth
                        type="password"
                        label="New password"
                        value={credentialForm.newPassword}
                        onChange={(event) => setCredentialForm((current) => ({ ...current, newPassword: event.target.value }))}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="reset-channel">Reset channel</InputLabel>
                        <Select
                          labelId="reset-channel"
                          label="Reset channel"
                          value={credentialForm.channel}
                          onChange={(event) => setCredentialForm((current) => ({ ...current, channel: event.target.value }))}
                        >
                          {resetChannels.map((channel) => (
                            <MenuItem key={channel} value={channel}>
                              {channel}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  <FormControlLabel control={<Checkbox checked={credentialForm.forceReset} onChange={(event) => setCredentialForm((current) => ({ ...current, forceReset: event.target.checked }))} />} label="Require reset on next login" />
                  <Button variant="outlined" startIcon={<LockResetRoundedIcon />} disabled={!selectedUser || !!busyAction} onClick={() => void handleResetCredentials()}>
                    Trigger Credential Reset
                  </Button>
                </Stack>
              </CardContent>
            </GlassCard>

            <GlassCard sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Stack spacing={1.2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ShieldRoundedIcon fontSize="small" />
                    <Typography variant="h6" fontWeight={800}>
                      Warnings & Malicious User Control
                    </Typography>
                  </Stack>
                  <Grid container spacing={1.1}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="warning-severity">Severity</InputLabel>
                        <Select
                          labelId="warning-severity"
                          label="Severity"
                          value={warningForm.severity}
                          onChange={(event) => setWarningForm((current) => ({ ...current, severity: event.target.value }))}
                        >
                          {warningSeverities.map((severity) => (
                            <MenuItem key={severity} value={severity}>
                              {severity}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <SoftTextField
                        fullWidth
                        label="Warning reason"
                        value={warningForm.reason}
                        onChange={(event) => setWarningForm((current) => ({ ...current, reason: event.target.value }))}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <SoftTextField
                        fullWidth
                        label="Warning note"
                        value={warningForm.note}
                        onChange={(event) => setWarningForm((current) => ({ ...current, note: event.target.value }))}
                      />
                    </Grid>
                  </Grid>
                  <FormControlLabel control={<Switch checked={warningForm.suspendUser} onChange={(event) => setWarningForm((current) => ({ ...current, suspendUser: event.target.checked }))} />} label="Suspend account with warning" />
                  <Button variant="outlined" startIcon={<ReportProblemRoundedIcon />} disabled={!selectedUser || !!busyAction || !warningForm.reason.trim()} onClick={() => void handleIssueWarning()}>
                    Issue Warning
                  </Button>

                  <Divider />

                  <Grid container spacing={1.1}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="malicious-action">Action</InputLabel>
                        <Select
                          labelId="malicious-action"
                          label="Action"
                          value={maliciousForm.action}
                          onChange={(event) => setMaliciousForm((current) => ({ ...current, action: event.target.value }))}
                        >
                          {maliciousActions.map((action) => (
                            <MenuItem key={action} value={action}>
                              {action}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <SoftTextField
                        fullWidth
                        label="Security reason"
                        value={maliciousForm.reason}
                        onChange={(event) => setMaliciousForm((current) => ({ ...current, reason: event.target.value }))}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <SoftTextField
                        fullWidth
                        label="Blacklisted IPs"
                        value={maliciousForm.ipAddresses}
                        onChange={(event) => setMaliciousForm((current) => ({ ...current, ipAddresses: event.target.value }))}
                        placeholder="192.168.1.14, 10.0.0.4"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <SoftTextField
                        fullWidth
                        label="Blacklisted devices"
                        value={maliciousForm.deviceIds}
                        onChange={(event) => setMaliciousForm((current) => ({ ...current, deviceIds: event.target.value }))}
                        placeholder="device-123, device-456"
                      />
                    </Grid>
                  </Grid>
                  <Button
                    variant="contained"
                    color={maliciousForm.action === "UNBLOCK" ? "info" : "error"}
                    startIcon={maliciousForm.action === "UNBLOCK" ? <LockOpenRoundedIcon /> : <BlockRoundedIcon />}
                    disabled={!selectedUser || !!busyAction || !maliciousForm.reason.trim()}
                    onClick={() => void handleMaliciousControl()}
                  >
                    Execute Malicious User Control
                  </Button>

                  {selectedUser?.warnings?.length ? (
                    <>
                      <Divider />
                      <Typography variant="subtitle2" fontWeight={800}>
                        Warning History
                      </Typography>
                      <Stack spacing={0.8}>
                        {selectedUser.warnings.map((warning) => (
                          <GlassCard key={warning.id} variant="outlined" sx={{ border: "1px solid", borderColor: "divider", boxShadow: "none" }}>
                            <CardContent sx={{ py: 1.2, "&:last-child": { pb: 1.2 } }}>
                              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight={800}>
                                    {warning.reason}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {warning.severity} · {warning.status} · {formatDateTime(warning.issuedAt)}
                                  </Typography>
                                  {warning.note ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                                      {warning.note}
                                    </Typography>
                                  ) : null}
                                </Box>
                                {warning.status === "OPEN" ? (
                                  <Button variant="outlined" size="small" disabled={!!busyAction} onClick={() => void handleResolveWarning(warning.id)}>
                                    Resolve
                                  </Button>
                                ) : null}
                              </Stack>
                            </CardContent>
                          </GlassCard>
                        ))}
                      </Stack>
                    </>
                  ) : null}
                </Stack>
              </CardContent>
            </GlassCard>
          </Stack>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, xl: 6 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Stack spacing={1.2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      Role Catalog
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Predefined and custom roles with inheritance and permission mapping.
                    </Typography>
                  </Box>
                  <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={openCreateRole}>
                    Create Role
                  </Button>
                </Stack>
                <DataTable
                  columns={[
                    {
                      key: "label",
                      label: "Role",
                      sortable: true,
                      render: (_, role) => (
                        <Stack spacing={0.35}>
                          <Typography variant="subtitle2" fontWeight={800}>
                            {role.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {role.key} · v{role.version} · {role.systemRole ? "System role" : "Custom role"}
                          </Typography>
                          {role.description ? (
                            <Typography variant="body2" color="text.secondary">
                              {role.description}
                            </Typography>
                          ) : null}
                        </Stack>
                      ),
                    },
                    {
                      key: "permissions",
                      label: "Permissions",
                      render: (_, role) => (
                        <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                          {role.permissions.slice(0, 4).map((permission) => (
                            <Chip key={`${role.id}-${permission}`} label={permission} size="small" variant="outlined" />
                          ))}
                          {role.permissions.length > 4 ? <Chip label={`+${role.permissions.length - 4} more`} size="small" variant="outlined" /> : null}
                        </Stack>
                      ),
                    },
                    { key: "assignedUsers", label: "Assignments", sortable: true },
                    {
                      key: "id",
                      label: "Action",
                      align: "right",
                      render: (_, role) => (
                        <Button variant="outline" size="sm" leftIcon={<EditRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => openEditRole(role)}>
                          Edit
                        </Button>
                      ),
                    },
                  ]}
                  data={roles}
                  rowKey="id"
                  loading={loading}
                  searchable={true}
                  pageSize={5}
                />
              </Stack>
            </CardContent>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, xl: 6 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Stack spacing={1.2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PolicyRoundedIcon fontSize="small" />
                  <Typography variant="h6" fontWeight={800}>
                    Authentication Policies
                  </Typography>
                </Stack>
                <Grid container spacing={1.1}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <SoftTextField
                      fullWidth
                      type="number"
                      label="Min password length"
                      value={policyDraft.passwordPolicy.minLength}
                      onChange={(event) => setPolicyDraft((current) => ({
                        ...current,
                        passwordPolicy: { ...current.passwordPolicy, minLength: Number(event.target.value) || 8 },
                      }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <SoftTextField
                      fullWidth
                      type="number"
                      label="Password expiry days"
                      value={policyDraft.passwordPolicy.expiryDays}
                      onChange={(event) => setPolicyDraft((current) => ({
                        ...current,
                        passwordPolicy: { ...current.passwordPolicy, expiryDays: Number(event.target.value) || 30 },
                      }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <SoftTextField
                      fullWidth
                      type="number"
                      label="Password reuse limit"
                      value={policyDraft.passwordPolicy.passwordReuseLimit}
                      onChange={(event) => setPolicyDraft((current) => ({
                        ...current,
                        passwordPolicy: { ...current.passwordPolicy, passwordReuseLimit: Number(event.target.value) || 1 },
                      }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <SoftTextField
                      fullWidth
                      type="number"
                      label="Rate limit per minute"
                      value={policyDraft.authenticationPolicy.rateLimitPerMinute}
                      onChange={(event) => setPolicyDraft((current) => ({
                        ...current,
                        authenticationPolicy: { ...current.authenticationPolicy, rateLimitPerMinute: Number(event.target.value) || 60 },
                      }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <SoftTextField
                      fullWidth
                      type="number"
                      label="Max failed logins"
                      value={policyDraft.authenticationPolicy.maxFailedLoginAttempts}
                      onChange={(event) => setPolicyDraft((current) => ({
                        ...current,
                        authenticationPolicy: { ...current.authenticationPolicy, maxFailedLoginAttempts: Number(event.target.value) || 3 },
                      }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <SoftTextField
                      fullWidth
                      type="number"
                      label="Session timeout (min)"
                      value={policyDraft.authenticationPolicy.sessionTimeoutMinutes}
                      onChange={(event) => setPolicyDraft((current) => ({
                        ...current,
                        authenticationPolicy: { ...current.authenticationPolicy, sessionTimeoutMinutes: Number(event.target.value) || 15 },
                      }))}
                    />
                  </Grid>
                </Grid>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <FormControlLabel control={<Switch checked={policyDraft.passwordPolicy.requireUppercase} onChange={(event) => setPolicyDraft((current) => ({ ...current, passwordPolicy: { ...current.passwordPolicy, requireUppercase: event.target.checked } }))} />} label="Uppercase" />
                  <FormControlLabel control={<Switch checked={policyDraft.passwordPolicy.requireLowercase} onChange={(event) => setPolicyDraft((current) => ({ ...current, passwordPolicy: { ...current.passwordPolicy, requireLowercase: event.target.checked } }))} />} label="Lowercase" />
                  <FormControlLabel control={<Switch checked={policyDraft.passwordPolicy.requireNumber} onChange={(event) => setPolicyDraft((current) => ({ ...current, passwordPolicy: { ...current.passwordPolicy, requireNumber: event.target.checked } }))} />} label="Number" />
                  <FormControlLabel control={<Switch checked={policyDraft.passwordPolicy.requireSymbol} onChange={(event) => setPolicyDraft((current) => ({ ...current, passwordPolicy: { ...current.passwordPolicy, requireSymbol: event.target.checked } }))} />} label="Symbol" />
                  <FormControlLabel control={<Switch checked={policyDraft.authenticationPolicy.mfaRequiredForAdmins} onChange={(event) => setPolicyDraft((current) => ({ ...current, authenticationPolicy: { ...current.authenticationPolicy, mfaRequiredForAdmins: event.target.checked } }))} />} label="Admin MFA" />
                  <FormControlLabel control={<Switch checked={policyDraft.authenticationPolicy.oauthEnabled} onChange={(event) => setPolicyDraft((current) => ({ ...current, authenticationPolicy: { ...current.authenticationPolicy, oauthEnabled: event.target.checked } }))} />} label="OAuth" />
                  <FormControlLabel control={<Switch checked={policyDraft.authenticationPolicy.ssoEnabled} onChange={(event) => setPolicyDraft((current) => ({ ...current, authenticationPolicy: { ...current.authenticationPolicy, ssoEnabled: event.target.checked } }))} />} label="SSO" />
                  <FormControlLabel control={<Switch checked={policyDraft.authenticationPolicy.adaptiveAuthEnabled} onChange={(event) => setPolicyDraft((current) => ({ ...current, authenticationPolicy: { ...current.authenticationPolicy, adaptiveAuthEnabled: event.target.checked } }))} />} label="Adaptive Auth" />
                  <FormControlLabel control={<Switch checked={policyDraft.authenticationPolicy.zeroTrustEnabled} onChange={(event) => setPolicyDraft((current) => ({ ...current, authenticationPolicy: { ...current.authenticationPolicy, zeroTrustEnabled: event.target.checked } }))} />} label="Zero Trust" />
                  <FormControlLabel control={<Switch checked={policyDraft.authenticationPolicy.abacEnabled} onChange={(event) => setPolicyDraft((current) => ({ ...current, authenticationPolicy: { ...current.authenticationPolicy, abacEnabled: event.target.checked } }))} />} label="ABAC" />
                  <FormControlLabel control={<Switch checked={policyDraft.governancePolicy.leastPrivilegeEnforced} onChange={(event) => setPolicyDraft((current) => ({ ...current, governancePolicy: { ...current.governancePolicy, leastPrivilegeEnforced: event.target.checked } }))} />} label="Least Privilege" />
                  <FormControlLabel control={<Switch checked={policyDraft.governancePolicy.auditTrailEnabled} onChange={(event) => setPolicyDraft((current) => ({ ...current, governancePolicy: { ...current.governancePolicy, auditTrailEnabled: event.target.checked } }))} />} label="Audit Trail" />
                  <FormControlLabel control={<Switch checked={policyDraft.governancePolicy.anomalyAlertsEnabled} onChange={(event) => setPolicyDraft((current) => ({ ...current, governancePolicy: { ...current.governancePolicy, anomalyAlertsEnabled: event.target.checked } }))} />} label="Alerts" />
                  <FormControlLabel control={<Switch checked={policyDraft.governancePolicy.automatedProvisioningEnabled} onChange={(event) => setPolicyDraft((current) => ({ ...current, governancePolicy: { ...current.governancePolicy, automatedProvisioningEnabled: event.target.checked } }))} />} label="Auto Provisioning" />
                </Stack>
                <Button variant="contained" startIcon={<SaveRoundedIcon />} disabled={!!busyAction} onClick={() => void handleSavePolicies()}>
                  Save Policies
                </Button>
              </Stack>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack spacing={1.2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <GppMaybeRoundedIcon fontSize="small" />
                  <Typography variant="h6" fontWeight={800}>
                    Security Alerts
                  </Typography>
                </Stack>
                <Stack spacing={0.9}>
                  {(workspace?.alerts ?? []).length ? (
                    (workspace?.alerts ?? []).map((alert) => (
                      <GlassCard key={alert.key} variant="outlined" sx={{ border: "1px solid", borderColor: "divider", boxShadow: "none" }}>
                        <CardContent sx={{ py: 1.1, "&:last-child": { pb: 1.1 } }}>
                          <Stack spacing={0.35}>
                            <Stack direction="row" justifyContent="space-between" gap={1}>
                              <Typography variant="subtitle2" fontWeight={800}>
                                {alert.title}
                              </Typography>
                              <Chip
                                label={alert.severity.toUpperCase()}
                                size="small"
                                sx={{
                                  bgcolor: `${toneColor[alert.severity] ?? toneColor.neutral}15`,
                                  color: toneColor[alert.severity] ?? toneColor.neutral,
                                  fontWeight: 700,
                                }}
                              />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              {alert.detail}
                            </Typography>
                            {alert.userId ? (
                              <Button
                                variant="text"
                                size="small"
                                sx={{ alignSelf: "flex-start", px: 0 }}
                                onClick={() => setSelectedUserId(alert.userId ?? null)}
                              >
                                {alert.actionHint ?? "Open user"}
                              </Button>
                            ) : null}
                          </Stack>
                        </CardContent>
                      </GlassCard>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No active identity alerts.
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </GlassCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack spacing={1.2}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1}>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      Audit Trail & Reports
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Export audit logs and user activity reports directly from the live IAM dataset.
                    </Typography>
                  </Box>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button variant="outlined" startIcon={<HistoryRoundedIcon />} onClick={exportAuditCsv} disabled={!workspace}>
                      Audit CSV
                    </Button>
                    <Button variant="outlined" startIcon={<HistoryRoundedIcon />} onClick={exportAuditJson} disabled={!workspace}>
                      Audit JSON
                    </Button>
                    <Button variant="outlined" startIcon={<KeyRoundedIcon />} onClick={exportActivityReport} disabled={!workspace}>
                      Activity Report
                    </Button>
                  </Stack>
                </Stack>
                <DataTable
                  columns={[
                    {
                      key: "action",
                      label: "Action",
                      sortable: true,
                      render: (val, entry) => (
                        <Stack spacing={0.25}>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {String(val)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {entry.entityType} / {entry.entityId}
                          </Typography>
                        </Stack>
                      ),
                    },
                    { key: "actorUserId", label: "Actor", sortable: true },
                    {
                      key: "createdAt",
                      label: "Created",
                      sortable: true,
                      render: (val) => formatDateTime(val as string),
                    },
                  ]}
                  data={workspace?.auditTrail ?? []}
                  rowKey="id"
                  loading={loading}
                  pageSize={5}
                  searchable={true}
                  expandableContent={(entry) => (
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: "rgba(15, 23, 42, 0.6)",
                        color: "#dbeafe",
                        fontSize: 12,
                        overflowX: "auto",
                      }}
                    >
                      {JSON.stringify(entry.metadata ?? {}, null, 2)}
                    </Box>
                  )}
                />
              </Stack>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>

      <Dialog open={userDialogMode !== null} onClose={() => setUserDialogMode(null)} fullWidth maxWidth="sm">
        <DialogTitle>{userDialogMode === "create" ? "Create User" : `Edit ${editingUser?.fullName ?? "User"}`}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.2} sx={{ mt: 0.4 }}>
            <SoftTextField
              fullWidth
              label="Full name"
              value={userForm.fullName}
              onChange={(event) => setUserForm((current) => ({ ...current, fullName: event.target.value }))}
            />
            <SoftTextField
              fullWidth
              type="email"
              label="Email"
              value={userForm.email}
              onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
            />
            <SoftTextField
              fullWidth
              label="Username"
              value={userForm.username}
              onChange={(event) => setUserForm((current) => ({ ...current, username: event.target.value }))}
            />
            <SoftTextField
              fullWidth
              type="password"
              label={userDialogMode === "create" ? "Password" : "New password"}
              value={userForm.password}
              onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))}
              helperText={userDialogMode === "edit" ? "Leave blank to keep the current password." : "Minimum 8 characters."}
            />
            <FormControl fullWidth size="small">
              <InputLabel id="user-role-select">Roles</InputLabel>
              <Select
                multiple
                labelId="user-role-select"
                label="Roles"
                value={userForm.roles}
                onChange={(event) => setUserForm((current) => ({ ...current, roles: event.target.value as string[] }))}
                renderValue={(selected) => (selected as string[]).map((role) => roleLookup.get(role) ?? role).join(", ")}
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.key}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel control={<Checkbox checked={userForm.suspended} onChange={(event) => setUserForm((current) => ({ ...current, suspended: event.target.checked }))} />} label="Suspended" />
            <FormControlLabel control={<Checkbox checked={userForm.documentsVerified} onChange={(event) => setUserForm((current) => ({ ...current, documentsVerified: event.target.checked }))} />} label="Documents verified" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setUserDialogMode(null)} disabled={!!busyAction}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSaveUser()}
            disabled={!!busyAction || !userForm.fullName.trim() || !userForm.email.trim() || userForm.roles.length === 0 || (userDialogMode === "create" && userForm.password.trim().length < 8)}
          >
            {userDialogMode === "create" ? "Create" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={roleDialogMode !== null} onClose={() => setRoleDialogMode(null)} fullWidth maxWidth="sm">
        <DialogTitle>{roleDialogMode === "create" ? "Create Role" : `Edit ${editingRole?.label ?? "Role"}`}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.2} sx={{ mt: 0.4 }}>
            <SoftTextField
              fullWidth
              label="Role key"
              value={roleForm.key}
              onChange={(event) => setRoleForm((current) => ({ ...current, key: event.target.value }))}
              helperText="Example: ROLE_COMPLIANCE_ADMIN"
              disabled={roleDialogMode === "edit"}
            />
            <SoftTextField
              fullWidth
              label="Role label"
              value={roleForm.label}
              onChange={(event) => setRoleForm((current) => ({ ...current, label: event.target.value }))}
            />
            <SoftTextField
              fullWidth
              label="Description"
              value={roleForm.description}
              onChange={(event) => setRoleForm((current) => ({ ...current, description: event.target.value }))}
            />
            <FormControl fullWidth size="small">
              <InputLabel id="inherit-role-select">Inherited roles</InputLabel>
              <Select
                multiple
                labelId="inherit-role-select"
                label="Inherited roles"
                value={roleForm.inherits}
                onChange={(event) => setRoleForm((current) => ({ ...current, inherits: event.target.value as string[] }))}
                renderValue={(selected) => (selected as string[]).map((role) => roleLookup.get(role) ?? role).join(", ")}
              >
                {roles.map((role) => (
                  <MenuItem key={`inherit-${role.id}`} value={role.key}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <SoftTextField
              fullWidth
              label="Permissions"
              value={roleForm.permissionsText}
              onChange={(event) => setRoleForm((current) => ({ ...current, permissionsText: event.target.value }))}
              helperText="Comma-separated permission keys."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setRoleDialogMode(null)} disabled={!!busyAction}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSaveRole()}
            disabled={!!busyAction || !roleForm.label.trim() || !roleForm.key.trim()}
          >
            {roleDialogMode === "create" ? "Create Role" : "Save Role"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
