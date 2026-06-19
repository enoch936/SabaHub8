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
  IconButton,
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
  type AdminCreateUserInput,
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
      label: "Identity & Profile",
      sortable: true,
      render: (_, user) => (
        <Stack direction="row" spacing={2.5} alignItems="center">
          <Avatar 
            src={user.avatarUrl || undefined} 
            sx={{ 
              width: 48, height: 48, borderRadius: "16px", 
              bgcolor: "var(--primary)",
              color: "#fff",
              fontWeight: 900,
              fontSize: 18,
              boxShadow: "0 6px 16px var(--primary-glow)"
            }}
          >
            {user.fullName?.charAt(0)}
          </Avatar>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" fontWeight={900} sx={{ letterSpacing: "-0.02em", color: "text.primary", fontSize: 15 }}>
              {user.fullName} <span style={{ opacity: 0.5, fontWeight: 600, fontSize: "0.8em" }}>(#USR-{user.id.slice(-6).toUpperCase()})</span>
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ opacity: 0.7 }}>
              {user.email}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <Chip 
                label={(user.accountType ?? "user").toUpperCase()} 
                size="small" 
                sx={{ height: 18, fontSize: "10px", fontWeight: 900, borderRadius: "6px", bgcolor: "var(--glass-gray)", border: "1px solid var(--border)" }}
              />
              {user.companyName && (
                <Typography variant="caption" fontWeight={700} color="primary.main">
                  · {user.companyName}
                </Typography>
              )}
            </Stack>
          </Stack>
        </Stack>
      ),
    },
    {
      key: "identity",
      label: "Trust & Safety",
      render: (_, user) => (
        <Stack spacing={1} sx={{ py: 1 }}>
          <Stack direction="row" spacing={1}>
            <Chip 
              label={user.identity?.status ?? "UNVERIFIED"} 
              size="small" 
              color={user.identity?.status === "VERIFIED" ? "success" : "default"} 
              variant="filled"
              sx={{ fontWeight: 800, fontSize: "10px", borderRadius: "10px", height: 20 }}
            />
            {user.suspended && (
              <Chip label="SUSPENDED" size="small" color="error" sx={{ fontWeight: 900, fontSize: "10px", borderRadius: "10px", height: 20 }} />
            )}
          </Stack>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box 
              sx={{ 
                width: 8, height: 8, borderRadius: "50%", 
                bgcolor: user.security?.riskLevel === "CRITICAL" ? "error.main" : user.security?.riskLevel === "HIGH" ? "warning.main" : "success.main" 
              }} 
            />
            <Typography variant="caption" fontWeight={800} sx={{ opacity: 0.8 }}>
              {user.security?.banned ? "BANNED" : `RISK: ${user.security?.riskLevel ?? "LOW"}`}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      key: "access",
      label: "IAM Permissions",
      render: (_, user) => (
        <Stack spacing={0.8}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <ShieldRoundedIcon sx={{ fontSize: 18, color: "var(--primary)", opacity: 0.8 }} />
            <Typography variant="body2" fontWeight={800} color="text.primary" sx={{ letterSpacing: "0.02em" }}>
              {user.access?.accessLevel ?? "STANDARD"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              {(user.access?.permissions?.length ?? 0)} Active Policies
            </Typography>
            <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "text.disabled" }} />
            <Typography variant="caption" sx={{ color: "var(--primary)", fontWeight: 800, textTransform: "uppercase", fontSize: "9px" }}>
              {user.access?.accessScope ?? "PLATFORM"}
            </Typography>
          </Stack>
        </Stack>
      ),
    },
    {
      key: "roles",
      label: "Role Mapping",
      render: (_, user) => (
        <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ maxWidth: 240 }}>
          {user.roles.map((role) => (
            <Chip
              key={`${user.id}-${role}`}
              size="small"
              label={roleLookup.get(role) ?? role.replace(/^ROLE_/, "").replace(/_/g, " ")}
              sx={{ 
                fontWeight: 800, 
                fontSize: "10px", 
                borderRadius: "10px",
                height: 22,
                bgcolor: role.includes("ADMIN") ? alpha(toneColor.critical, 0.1) : "var(--glass-gray)",
                color: role.includes("ADMIN") ? toneColor.critical : "text.primary",
                border: `1px solid ${role.includes("ADMIN") ? alpha(toneColor.critical, 0.2) : "var(--border)"}`
              }}
            />
          ))}
        </Stack>
      ),
    },
    {
      key: "createdAt",
      label: "Telemetry",
      sortable: true,
      render: (_, user) => (
        <Stack spacing={1}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, opacity: 0.7 }}>
            <HistoryRoundedIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption" fontWeight={700}>
              {new Date(user.createdAt || "").toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ 
              width: 10, height: 10, borderRadius: "50%", 
              bgcolor: user.online ? "#10B981" : "transparent",
              border: user.online ? "none" : "2px solid var(--border)",
              boxShadow: user.online ? "0 0 10px rgba(16, 185, 129, 0.5)" : "none"
            }} />
            <Typography variant="caption" color={user.online ? "success.main" : "text.secondary"} fontWeight={900}>
              {user.online ? "ONLINE" : `LAST: ${formatDateTime(user.lastSeenAt)}`}
            </Typography>
          </Box>
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
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <IconButton 
              size="small" 
              onClick={(e) => { e.stopPropagation(); onEdit(user); }}
              sx={{ bgcolor: "var(--glass-gray)", borderRadius: "10px", "&:hover": { bgcolor: "var(--glass-gray-hover)" } }}
            >
              <EditRoundedIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              color={user.suspended ? "success" : "warning"}
              disabled={busy}
              onClick={(e) => { e.stopPropagation(); onSuspend(user); }}
              sx={{ bgcolor: alpha(user.suspended ? "#10B981" : "#F59E0B", 0.1), borderRadius: "10px" }}
            >
              {user.suspended ? <LockOpenRoundedIcon fontSize="small" /> : <LockRoundedIcon fontSize="small" />}
            </IconButton>
            <IconButton 
              size="small" 
              color="error"
              disabled={busy}
              onClick={(e) => { e.stopPropagation(); onDelete(user); }}
              sx={{ bgcolor: alpha("#EF4444", 0.1), borderRadius: "10px" }}
            >
              <DeleteRoundedIcon fontSize="small" />
            </IconButton>
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
  const users = workspace?.users ?? [];
  const roles = workspace?.roles ?? [];
  const policies = workspace?.policies ?? fallbackPolicies;

  const getUserDisplay = (userId?: string | null) => {
    if (!userId) return "System Environment";
    const found = users.find(u => u.id === userId);
    if (!found) return `Service Principal (#${userId.slice(-6).toUpperCase()})`;
    return `${found.fullName} (#USR-${userId.slice(-6).toUpperCase()})`;
  };

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
    <Stack spacing={4}>
      <GlassCard
        sx={{
          color: "common.white",
          p: 1
        }}
        gradient
      >
        <CardContent>
          <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ lg: "center" }} spacing={3}>
            <Box>
              <Typography variant="overline" sx={{ letterSpacing: "0.2em", opacity: 0.8, fontWeight: 900, fontSize: 11 }}>
                IDENTITY & ACCESS MANAGEMENT
              </Typography>
              <Typography variant="h3" fontWeight={900} sx={{ lineHeight: 1, mt: 1, letterSpacing: "-0.04em" }}>
                Enterprise Orchestration
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, opacity: 0.9, maxWidth: 840, fontWeight: 500, lineHeight: 1.6 }}>
                The SabaHub IAM control plane provides unified governance over user lifecycles, role-based access, 
                and security policies with real-time telemetry and advanced malicious response tools.
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="outline"
                onClick={() => void load()}
                isLoading={loading}
                leftIcon={<RefreshRoundedIcon />}
                sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)", backdropFilter: "blur(10px)", height: 48, px: 3 }}
              >
                Sync Data
              </Button>
              <Button variant="primary" onClick={openCreateUser} leftIcon={<AddRoundedIcon />} sx={{ bgcolor: "#fff", color: "var(--primary)", height: 48, px: 4, fontWeight: 900, "&:hover": { bgcolor: alpha("#fff", 0.95), transform: "scale(1.02)" } }}>
                Provision User
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </GlassCard>

      {error ? <Alert severity="error" sx={{ borderRadius: "16px" }}>{error}</Alert> : null}
      {notice ? <Alert severity={noticeSeverity(notice)} sx={{ borderRadius: "16px" }}>{notice.message}</Alert> : null}

      <Grid container spacing={3}>
        {(workspace?.metrics ?? []).map((metric) => (
          <Grid key={metric.key} size={{ xs: 12, sm: 6, xl: 2 }}>
            <GlassCard sx={{ height: "100%" }} hover>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={1.5}>
                  <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {metric.label}
                  </Typography>
                  <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: "-0.04em" }}>
                    {metric.value}
                  </Typography>
                  <Box 
                    sx={{ 
                      alignSelf: "flex-start", px: 1.5, py: 0.5, borderRadius: "8px",
                      bgcolor: alpha(toneColor[metric.tone] || toneColor.neutral, 0.1),
                      color: toneColor[metric.tone] || toneColor.neutral,
                      fontSize: 10, fontWeight: 900, border: `1px solid ${alpha(toneColor[metric.tone] || toneColor.neutral, 0.2)}`
                    }}
                  >
                    {metric.tone.toUpperCase()}
                  </Box>
                </Stack>
              </CardContent>
            </GlassCard>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <GlassCard sx={{ height: "100%" }}>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: "-0.02em" }}>
                    IAM Telemetry Trend
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 1 }}>
                    Tracking onboarding velocity, authentication resets, and security interventions.
                  </Typography>
                </Box>
                <Box sx={{ height: 320, width: "100%", mt: 2 }}>
                  <NoSsrResponsiveContainer fallbackHeight={320}>
                    <LineChart data={workspace?.activityTrend ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: "var(--foreground-muted)" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: "var(--foreground-muted)" }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: "16px", border: "1px solid var(--border)", backdropFilter: "blur(20px)", background: "var(--surface)" }}
                      />
                      <Line type="monotone" dataKey="newUsers" stroke="var(--primary)" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="activeUsers" stroke="var(--success)" strokeWidth={4} dot={false} />
                      <Line type="monotone" dataKey="credentialResets" stroke="var(--warning)" strokeWidth={4} dot={false} strokeDasharray="5 5" />
                    </LineChart>
                  </NoSsrResponsiveContainer>
                </Box>
              </Stack>
            </CardContent>
          </GlassCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Grid container spacing={3} sx={{ height: "100%" }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <GlassCard sx={{ height: "100%" }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: "-0.01em", mb: 3 }}>
                    Privilege Map
                  </Typography>
                  <Box sx={{ height: 280 }}>
                    <NoSsrResponsiveContainer fallbackHeight={280}>
                      <BarChart data={workspace?.roleDistribution ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 800 }} angle={-25} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={32}>
                          {(workspace?.roleDistribution ?? []).map((entry) => (
                            <Cell key={entry.label} fill={toneColor[entry.tone] || "var(--primary)"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </NoSsrResponsiveContainer>
                  </Box>
                </CardContent>
              </GlassCard>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <GlassCard sx={{ height: "100%" }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: "-0.01em", mb: 3 }}>
                    Verification Pipeline
                  </Typography>
                  <Box sx={{ height: 280 }}>
                    <NoSsrResponsiveContainer fallbackHeight={280}>
                      <PieChart>
                        <Pie
                          data={workspace?.verificationDistribution ?? []}
                          dataKey="value"
                          nameKey="label"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={6}
                        >
                          {(workspace?.verificationDistribution ?? []).map((entry, index) => (
                            <Cell key={entry.label} fill={toneColor[entry.tone] || chartPalette[index % chartPalette.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </NoSsrResponsiveContainer>
                  </Box>
                </CardContent>
              </GlassCard>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 7 }}>
          <GlassCard>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3}>
                <Stack direction={{ xs: "column", lg: "row" }} gap={2}>
                  <SoftTextField
                    fullWidth
                    label="Search IAM Records"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="ID, Name, Email, or Organization..."
                    InputProps={{ 
                      startAdornment: <SearchRoundedIcon sx={{ fontSize: 20, mr: 1.5, color: "var(--primary)" }} />,
                      sx: { borderRadius: "16px", height: 48, bgcolor: "var(--glass-gray)" }
                    }}
                  />
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="user-status-filter">Policy State</InputLabel>
                    <Select
                      labelId="user-status-filter"
                      value={statusFilter}
                      label="Policy State"
                      onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                      sx={{ borderRadius: "16px", height: 48, bgcolor: "var(--glass-gray)" }}
                    >
                      <MenuItem value="all">All States</MenuItem>
                      <MenuItem value="active">Active Access</MenuItem>
                      <MenuItem value="suspended">Suspended</MenuItem>
                      <MenuItem value="banned">Terminated/Banned</MenuItem>
                      <MenuItem value="risk">Elevated Risk</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>

                <DataTable
                  columns={UserTableColumns(roleLookup, openEditUser, handleToggleSuspend, handleDeleteUser, busyAction)}
                  data={filteredUsers}
                  rowKey="id"
                  loading={loading}
                  onRowClick={(user) => setSelectedUserId(user.id)}
                  searchable={false}
                  exportable={true}
                  onExport={(format) => format === 'csv' ? exportActivityReport() : undefined}
                />
              </Stack>
            </CardContent>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, xl: 5 }}>
          <Stack spacing={3}>
            {selectedUser && (
              <GlassCard sx={{ border: "1px solid", borderColor: "var(--primary)", boxShadow: "0 0 30px var(--primary-glow)" }}>
                <CardContent sx={{ p: 4 }}>
                  <Stack spacing={3}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={2.5} alignItems="center">
                        <Avatar 
                          src={selectedUser.avatarUrl || undefined} 
                          sx={{ width: 64, height: 64, borderRadius: "20px", bgcolor: "var(--primary)", fontWeight: 900, fontSize: 24 }}
                        >
                          {selectedUser.fullName?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: "-0.02em" }}>
                            {selectedUser.fullName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mt: 0.5 }}>
                            {selectedUser.email} <span style={{ opacity: 0.5 }}>(#USR-{selectedUser.id.slice(-6).toUpperCase()})</span>
                          </Typography>
                        </Box>
                      </Stack>
                      <Box sx={{ textAlign: "right" }}>
                        <Chip
                          label={(selectedUser.security?.riskLevel || "LOW").toUpperCase()}
                          size="small"
                          sx={{ 
                            fontWeight: 900, fontSize: 10, borderRadius: "8px", height: 24,
                            bgcolor: selectedUser.security?.riskLevel === "CRITICAL" ? alpha(toneColor.critical, 0.1) : "var(--glass-gray)",
                            color: selectedUser.security?.riskLevel === "CRITICAL" ? toneColor.critical : "text.primary"
                          }}
                        />
                        <Typography variant="caption" sx={{ display: "block", mt: 1, fontWeight: 800, opacity: 0.5 }}>
                          ID: {selectedUser.id}
                        </Typography>
                      </Box>
                    </Stack>

                    <Divider sx={{ opacity: 0.05 }} />

                    <Stack spacing={2}>
                      <Typography variant="subtitle2" fontWeight={900} sx={{ textTransform: "uppercase", letterSpacing: "0.1em", fontSize: 11, opacity: 0.6 }}>
                        Roles & Authorization Mapping
                      </Typography>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        {selectedUser.roles.map((role) => (
                          <Chip
                            key={`${selectedUser.id}-selected-${role}`}
                            label={roleLookup.get(role) ?? role}
                            size="small"
                            onDelete={selectedUser.roles.length > 1 ? () => void handleRevokeRole(role) : undefined}
                            sx={{ fontWeight: 800, borderRadius: "10px", px: 1 }}
                          />
                        ))}
                      </Stack>
                      <Stack direction="row" spacing={2}>
                        <FormControl fullWidth size="small">
                          <Select
                            value={selectedGrantRole}
                            onChange={(event) => setSelectedGrantRole(event.target.value)}
                            displayEmpty
                            sx={{ borderRadius: "12px", bgcolor: "var(--glass-gray)" }}
                          >
                            <MenuItem value="" disabled>Grant Additional Role...</MenuItem>
                            {availableRolesForSelectedUser.map((role) => (
                              <MenuItem key={role.id} value={role.key}>{role.label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Button variant="primary" size="sm" disabled={!selectedGrantRole || !!busyAction} onClick={() => void handleGrantRole()}>
                          Grant
                        </Button>
                      </Stack>
                    </Stack>
                  </Stack>
                </CardContent>
              </GlassCard>
            )}
          </Stack>
        </Grid>
      </Grid>


      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 6 }}>
          <GlassCard sx={{ height: "100%" }}>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: "-0.01em" }}>
                      Authority & Role Catalog
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Defines inheritance hierarchies and granular permission mapping.
                    </Typography>
                  </Box>
                  <Button variant="outline" leftIcon={<AddRoundedIcon />} onClick={openCreateRole} sx={{ borderRadius: "12px" }}>
                    New Role
                  </Button>
                </Stack>
                <DataTable
                  columns={[
                    {
                      key: "label",
                      label: "Authority Level",
                      sortable: true,
                      render: (_, role) => (
                        <Stack spacing={0.5}>
                          <Typography variant="subtitle2" fontWeight={900} sx={{ color: "var(--primary)" }}>
                            {role.label}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.5 }}>
                            {role.key} · v{role.version}
                          </Typography>
                        </Stack>
                      ),
                    },
                    {
                      key: "permissions",
                      label: "Active Policies",
                      render: (_, role) => (
                        <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                          {role.permissions.slice(0, 3).map((p) => (
                            <Chip key={p} label={p} size="small" sx={{ fontSize: 9, fontWeight: 900, borderRadius: "6px", height: 18 }} />
                          ))}
                          {role.permissions.length > 3 && <Chip label={`+${role.permissions.length - 3}`} size="small" sx={{ fontSize: 9, fontWeight: 900, borderRadius: "6px", height: 18 }} />}
                        </Stack>
                      ),
                    },
                    { 
                      key: "assignedUsers", 
                      label: "Assignments", 
                      sortable: true,
                      render: (val) => <Typography variant="body2" fontWeight={900}>{val}</Typography>
                    },
                    {
                      key: "id",
                      label: "Action",
                      align: "right",
                      render: (_, role) => (
                        <IconButton size="small" onClick={() => openEditRole(role)} sx={{ bgcolor: "var(--glass-gray)" }}>
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
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
          <GlassCard sx={{ height: "100%" }}>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <PolicyRoundedIcon sx={{ color: "var(--warning)" }} />
                  <Typography variant="h6" fontWeight={900}>
                    Global Security Policies
                  </Typography>
                </Stack>
                <Grid container spacing={2}>
                  {[
                    { label: "Min Length", val: policyDraft.passwordPolicy.minLength, key: 'minLength', parent: 'passwordPolicy' },
                    { label: "Expiry (Days)", val: policyDraft.passwordPolicy.expiryDays, key: 'expiryDays', parent: 'passwordPolicy' },
                    { label: "Rate Limit (Req/M)", val: policyDraft.authenticationPolicy.rateLimitPerMinute, key: 'rateLimitPerMinute', parent: 'authenticationPolicy' },
                    { label: "Max Attempts", val: policyDraft.authenticationPolicy.maxFailedLoginAttempts, key: 'maxFailedLoginAttempts', parent: 'authenticationPolicy' },
                    { label: "Session (Min)", val: policyDraft.authenticationPolicy.sessionTimeoutMinutes, key: 'sessionTimeoutMinutes', parent: 'authenticationPolicy' },
                  ].map((p) => (
                    <Grid key={p.label} size={{ xs: 12, sm: 4 }}>
                      <SoftTextField
                        fullWidth
                        type="number"
                        label={p.label}
                        value={p.val}
                        onChange={(e) => setPolicyDraft((current: any) => ({
                          ...current,
                          [p.parent]: { ...current[p.parent], [p.key]: Number(e.target.value) || 0 },
                        }))}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                      />
                    </Grid>
                  ))}
                </Grid>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {[
                    { label: "Zero Trust", checked: policyDraft.authenticationPolicy.zeroTrustEnabled, p: 'authenticationPolicy', k: 'zeroTrustEnabled' },
                    { label: "ABAC Enforced", checked: policyDraft.authenticationPolicy.abacEnabled, p: 'authenticationPolicy', k: 'abacEnabled' },
                    { label: "Least Privilege", checked: policyDraft.governancePolicy.leastPrivilegeEnforced, p: 'governancePolicy', k: 'leastPrivilegeEnforced' },
                    { label: "Audit Logging", checked: policyDraft.governancePolicy.auditTrailEnabled, p: 'governancePolicy', k: 'auditTrailEnabled' },
                    { label: "Anomaly Alerts", checked: policyDraft.governancePolicy.anomalyAlertsEnabled, p: 'governancePolicy', k: 'anomalyAlertsEnabled' },
                  ].map((opt) => (
                    <Chip
                      key={opt.label}
                      label={opt.label}
                      onClick={() => setPolicyDraft((current: any) => ({
                        ...current,
                        [opt.p]: { ...current[opt.p], [opt.k]: !opt.checked }
                      }))}
                      sx={{ 
                        fontWeight: 800, borderRadius: "10px", 
                        bgcolor: opt.checked ? alpha(toneColor.warning, 0.1) : "var(--glass-gray)",
                        color: opt.checked ? toneColor.warning : "text.secondary",
                        border: `1px solid ${opt.checked ? alpha(toneColor.warning, 0.3) : "var(--border)"}`,
                      }}
                    />
                  ))}
                </Stack>
                <Button variant="primary" leftIcon={<SaveRoundedIcon />} disabled={!!busyAction} onClick={() => void handleSavePolicies()} fullWidth sx={{ height: 44 }}>
                  Commit Policy Updates
                </Button>
              </Stack>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <GlassCard sx={{ height: "100%" }}>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <GppMaybeRoundedIcon sx={{ color: "var(--error)" }} />
                  <Typography variant="h6" fontWeight={900}>
                    Security Intelligence Alerts
                  </Typography>
                </Stack>
                <Stack spacing={1.5}>
                  {(workspace?.alerts ?? []).length ? (
                    (workspace?.alerts ?? []).map((alert) => (
                      <Box key={alert.key} sx={{ 
                        p: 2, borderRadius: "18px", bgcolor: "var(--glass-gray)",
                        border: `1px solid ${alpha(toneColor[alert.severity] || toneColor.neutral, 0.2)}`,
                        borderLeft: `4px solid ${toneColor[alert.severity] || toneColor.neutral}`
                      }}>
                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle2" fontWeight={900}>{alert.title}</Typography>
                            <Chip label={alert.severity} size="small" sx={{ fontSize: 9, fontWeight: 900, borderRadius: "6px" }} />
                          </Stack>
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>{alert.detail}</Typography>
                          {alert.userId && (
                            <Button 
                              variant="text" size="sm" 
                              onClick={() => setSelectedUserId(alert.userId ?? null)}
                              sx={{ alignSelf: "flex-start", p: 0, fontWeight: 800, textTransform: "none", fontSize: 12, color: "var(--primary)" }}
                            >
                              {alert.actionHint || "Investigate"}: {getUserDisplay(alert.userId)}
                            </Button>
                          )}
                        </Stack>
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ py: 6, textAlign: "center", opacity: 0.5 }}>
                      <VerifiedUserRoundedIcon sx={{ fontSize: 48, mb: 2, opacity: 0.2 }} />
                      <Typography variant="body2" fontWeight={700}>No active identity threats detected.</Typography>
                    </Box>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <GlassCard sx={{ height: "100%" }}>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2}>
                  <Box>
                    <Typography variant="h6" fontWeight={900}>
                      Immutable Audit Trail
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Cryptographically signed orchestration events and operator logs.
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1.5}>
                    <Button variant="outline" size="sm" leftIcon={<HistoryRoundedIcon />} onClick={exportAuditCsv} disabled={!workspace}>CSV</Button>
                    <Button variant="outline" size="sm" leftIcon={<KeyRoundedIcon />} onClick={exportActivityReport} disabled={!workspace}>Report</Button>
                  </Stack>
                </Stack>
                <DataTable
                  columns={[
                    {
                      key: "action",
                      label: "Orchestration Event",
                      sortable: true,
                      render: (val, entry) => (
                        <Stack spacing={0.5}>
                          <Typography variant="subtitle2" fontWeight={900}>{String(val)}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.6 }}>
                            {entry.entityType}: {entry.entityId ? (entry.entityType === 'USER' ? getUserDisplay(entry.entityId) : entry.entityId) : "Global System"}
                          </Typography>
                        </Stack>
                      ),
                    },
                    { 
                      key: "actorUserId", 
                      label: "Operator", 
                      render: (val) => <Typography variant="body2" fontWeight={800} color="var(--primary)">{getUserDisplay(val as string)}</Typography>
                    },
                    {
                      key: "createdAt",
                      label: "Telemetry",
                      render: (val) => <Typography variant="caption" fontWeight={700} sx={{ opacity: 0.5 }}>{formatDateTime(val as string)}</Typography>
                    },
                  ]}
                  data={workspace?.auditTrail ?? []}
                  rowKey="id"
                  loading={loading}
                  pageSize={5}
                  searchable={true}
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
