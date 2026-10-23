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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import CloudSyncRoundedIcon from "@mui/icons-material/CloudSyncRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import PublishedWithChangesRoundedIcon from "@mui/icons-material/PublishedWithChangesRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import SettingsEthernetRoundedIcon from "@mui/icons-material/SettingsEthernetRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { GlassCard, GlassCardHeader } from "./GlassCard";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import NoSsrResponsiveContainer from "@/components/charts/NoSsrResponsiveContainer";
import SoftButton from "@/components/mui/SoftButton";
import SoftCard from "@/components/mui/SoftCard";
import SoftTextField from "@/components/mui/SoftTextField";
import {
  type AdminCreateTenantInput,
  type AdminTenantOperationsWorkspace,
  type AdminTenantSummary,
  type AdminUpdateTenantInput,
  adminChangeTenantLifecycle,
  adminConfigureTenantLimits,
  adminCreateTenant,
  adminDeleteTenant,
  adminMigrateTenant,
  adminPatchTenant,
  adminProvisionTenantEnvironment,
  adminRefreshTenantUsage,
  adminTenantWorkspace,
  adminUpdateTenantIsolation,
  adminUpdateTenantPermissions,
} from "@/lib/api";

type Notice = {
  tone: "success" | "error" | "info";
  message: string;
} | null;

type DialogMode = "create" | "edit" | null;

type CoreFormState = {
  ownerFullName: string;
  ownerEmail: string;
  ownerUsername: string;
  ownerPassword: string;
  companyName: string;
  companyWebsite: string;
  industry: string;
  country: string;
  employeeCount: string;
  tier: string;
};

type BillingFormState = {
  plan: string;
  billingStatus: string;
  billingModel: string;
  billingEmail: string;
  billingCurrency: string;
  billingProvider: string;
  billingAccountId: string;
  renewalDate: string;
  maxActiveProjects: string;
  maxTeamMembers: string;
  storageLimitGb: string;
  apiRateLimitPerMinute: string;
  businessVerified: boolean;
  paymentVerified: boolean;
  kycStatus: string;
  verificationNote: string;
};

type EnvironmentFormState = {
  deploymentMode: string;
  namespace: string;
  cluster: string;
  region: string;
  infrastructureProvider: string;
  computeProfile: string;
  storageProfile: string;
  networkSegment: string;
  environmentTemplate: string;
  autoScalingEnabled: boolean;
  selfServiceOnboardingEnabled: boolean;
};

type LimitFormState = {
  softCpuCores: string;
  hardCpuCores: string;
  softMemoryGb: string;
  hardMemoryGb: string;
  softStorageGb: string;
  hardStorageGb: string;
  softBandwidthMbps: string;
  hardBandwidthMbps: string;
  throttlingEnabled: boolean;
  autoScaleEnabled: boolean;
};

type PermissionFormState = {
  accessModel: string;
  adminRolesText: string;
  permissionsText: string;
  isolationEnforced: boolean;
};

type IsolationFormState = {
  databaseIsolationMode: string;
  networkPolicy: string;
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  crossTenantViolationCount: string;
  securityPolicy: string;
};

type LifecycleFormState = {
  action: string;
  reason: string;
  note: string;
};

type MigrationFormState = {
  targetRegion: string;
  note: string;
};

const tierCatalog = ["STARTER", "PROFESSIONAL", "ENTERPRISE"] as const;
const planCatalog = ["STARTER", "GROWTH", "ENTERPRISE", "CUSTOM"] as const;
const billingStatusCatalog = ["ACTIVE", "TRIAL", "PAST_DUE", "PAUSED"] as const;
const billingModelCatalog = ["SUBSCRIPTION", "USAGE", "HYBRID"] as const;
const kycStatusCatalog = ["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED"] as const;
const deploymentModeCatalog = ["SHARED", "DEDICATED"] as const;
const infrastructureCatalog = ["KUBERNETES", "AWS", "GCP", "AZURE"] as const;
const accessModelCatalog = ["RBAC", "ABAC"] as const;
const lifecycleActions = ["SUSPEND", "REACTIVATE", "ARCHIVE"] as const;
const toneColor: Record<string, string> = {
  critical: "#dc2626",
  warning: "#d97706",
  success: "#16a34a",
  info: "#0284c7",
  neutral: "#64748b",
};

const emptyCoreForm: CoreFormState = {
  ownerFullName: "",
  ownerEmail: "",
  ownerUsername: "",
  ownerPassword: "",
  companyName: "",
  companyWebsite: "",
  industry: "",
  country: "",
  employeeCount: "",
  tier: "STARTER",
};

const emptyBillingForm: BillingFormState = {
  plan: "STARTER",
  billingStatus: "ACTIVE",
  billingModel: "SUBSCRIPTION",
  billingEmail: "",
  billingCurrency: "USD",
  billingProvider: "MANUAL",
  billingAccountId: "",
  renewalDate: "",
  maxActiveProjects: "10",
  maxTeamMembers: "25",
  storageLimitGb: "100",
  apiRateLimitPerMinute: "120",
  businessVerified: false,
  paymentVerified: false,
  kycStatus: "PENDING",
  verificationNote: "",
};

const emptyEnvironmentForm: EnvironmentFormState = {
  deploymentMode: "SHARED",
  namespace: "",
  cluster: "shared-cluster-01",
  region: "primary-cluster-us",
  infrastructureProvider: "KUBERNETES",
  computeProfile: "GENERAL",
  storageProfile: "STANDARD",
  networkSegment: "",
  environmentTemplate: "STANDARD_V1",
  autoScalingEnabled: false,
  selfServiceOnboardingEnabled: true,
};

const emptyLimitForm: LimitFormState = {
  softCpuCores: "",
  hardCpuCores: "",
  softMemoryGb: "",
  hardMemoryGb: "",
  softStorageGb: "",
  hardStorageGb: "",
  softBandwidthMbps: "",
  hardBandwidthMbps: "",
  throttlingEnabled: true,
  autoScaleEnabled: false,
};

const emptyPermissionForm: PermissionFormState = {
  accessModel: "RBAC",
  adminRolesText: "TENANT_ADMIN",
  permissionsText: "tenant.users.read, tenant.users.write, tenant.settings.manage, tenant.billing.read",
  isolationEnforced: true,
};

const emptyIsolationForm: IsolationFormState = {
  databaseIsolationMode: "SCHEMA",
  networkPolicy: "SEGMENTED",
  encryptionAtRest: true,
  encryptionInTransit: true,
  crossTenantViolationCount: "0",
  securityPolicy: "STANDARD_SAAS_BASELINE",
};

const emptyLifecycleForm: LifecycleFormState = {
  action: "SUSPEND",
  reason: "",
  note: "",
};

const emptyMigrationForm: MigrationFormState = {
  targetRegion: "secondary-cluster-eu",
  note: "",
};

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

function formatCurrency(value?: number) {
  const amount = value ?? 0;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function toNumberInput(value?: number) {
  return value == null ? "" : String(value);
}

function toDateTimeInput(value?: string) {
  if (!value) {
    return "";
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return "";
  }
  const local = new Date(timestamp);
  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  const hours = String(local.getHours()).padStart(2, "0");
  const minutes = String(local.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function parseOptionalInt(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalFloat(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeCsvList(value: string) {
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
  return [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n");
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toCoreForm(tenant: AdminTenantSummary): CoreFormState {
  return {
    ownerFullName: tenant.ownerName ?? "",
    ownerEmail: tenant.ownerEmail ?? "",
    ownerUsername: tenant.ownerUsername ?? "",
    ownerPassword: "",
    companyName: tenant.companyName ?? "",
    companyWebsite: tenant.companyWebsite ?? "",
    industry: tenant.industry ?? "",
    country: tenant.country ?? "",
    employeeCount: toNumberInput(tenant.employeeCount),
    tier: tenant.tier ?? "STARTER",
  };
}

function toBillingForm(tenant: AdminTenantSummary): BillingFormState {
  return {
    plan: tenant.billing?.plan ?? tenant.tier ?? "STARTER",
    billingStatus: tenant.billing?.status ?? "ACTIVE",
    billingModel: tenant.billing?.model ?? "SUBSCRIPTION",
    billingEmail: tenant.billing?.billingEmail ?? tenant.ownerEmail ?? "",
    billingCurrency: tenant.billing?.currency ?? "USD",
    billingProvider: tenant.billing?.provider ?? "MANUAL",
    billingAccountId: tenant.billing?.accountId ?? "",
    renewalDate: toDateTimeInput(tenant.billing?.renewalDate),
    maxActiveProjects: toNumberInput(tenant.quota?.maxActiveProjects),
    maxTeamMembers: toNumberInput(tenant.quota?.maxTeamMembers),
    storageLimitGb: toNumberInput(tenant.quota?.storageLimitGb),
    apiRateLimitPerMinute: toNumberInput(tenant.quota?.apiRateLimitPerMinute),
    businessVerified: !!tenant.businessVerified,
    paymentVerified: !!tenant.paymentVerified,
    kycStatus: tenant.kycStatus ?? "PENDING",
    verificationNote: "",
  };
}

function toEnvironmentForm(tenant: AdminTenantSummary): EnvironmentFormState {
  return {
    deploymentMode: tenant.environment?.deploymentMode ?? "SHARED",
    namespace: tenant.environment?.namespace ?? "",
    cluster: tenant.environment?.cluster ?? "shared-cluster-01",
    region: tenant.environment?.region ?? "primary-cluster-us",
    infrastructureProvider: tenant.environment?.infrastructureProvider ?? "KUBERNETES",
    computeProfile: tenant.environment?.computeProfile ?? "GENERAL",
    storageProfile: tenant.environment?.storageProfile ?? "STANDARD",
    networkSegment: tenant.environment?.networkSegment ?? "",
    environmentTemplate: tenant.environment?.environmentTemplate ?? "STANDARD_V1",
    autoScalingEnabled: !!tenant.environment?.autoScalingEnabled,
    selfServiceOnboardingEnabled: tenant.environment?.selfServiceOnboardingEnabled ?? true,
  };
}

function toLimitForm(tenant: AdminTenantSummary): LimitFormState {
  return {
    softCpuCores: toNumberInput(tenant.resourceLimits?.softCpuCores),
    hardCpuCores: toNumberInput(tenant.resourceLimits?.hardCpuCores),
    softMemoryGb: toNumberInput(tenant.resourceLimits?.softMemoryGb),
    hardMemoryGb: toNumberInput(tenant.resourceLimits?.hardMemoryGb),
    softStorageGb: toNumberInput(tenant.resourceLimits?.softStorageGb),
    hardStorageGb: toNumberInput(tenant.resourceLimits?.hardStorageGb),
    softBandwidthMbps: toNumberInput(tenant.resourceLimits?.softBandwidthMbps),
    hardBandwidthMbps: toNumberInput(tenant.resourceLimits?.hardBandwidthMbps),
    throttlingEnabled: tenant.resourceLimits?.throttlingEnabled ?? true,
    autoScaleEnabled: !!tenant.resourceLimits?.autoScaleEnabled,
  };
}

function toPermissionForm(tenant: AdminTenantSummary): PermissionFormState {
  return {
    accessModel: tenant.permissionProfile?.accessModel ?? "RBAC",
    adminRolesText: (tenant.permissionProfile?.adminRoles ?? ["TENANT_ADMIN"]).join(", "),
    permissionsText: (tenant.permissionProfile?.permissions ?? ["tenant.users.read", "tenant.settings.manage"]).join(", "),
    isolationEnforced: tenant.permissionProfile?.isolationEnforced ?? true,
  };
}

function toIsolationForm(tenant: AdminTenantSummary): IsolationFormState {
  return {
    databaseIsolationMode: tenant.isolationProfile?.databaseIsolationMode ?? "SCHEMA",
    networkPolicy: tenant.isolationProfile?.networkPolicy ?? "SEGMENTED",
    encryptionAtRest: tenant.isolationProfile?.encryptionAtRest ?? true,
    encryptionInTransit: tenant.isolationProfile?.encryptionInTransit ?? true,
    crossTenantViolationCount: toNumberInput(tenant.isolationProfile?.crossTenantViolationCount),
    securityPolicy: tenant.isolationProfile?.securityPolicy ?? "STANDARD_SAAS_BASELINE",
  };
}

function noticeSeverity(notice: Notice) {
  if (!notice) {
    return "info" as const;
  }
  return notice.tone === "error" ? "error" : notice.tone === "success" ? "success" : "info";
}

export default function AdminTenantManagementWorkspace() {
  const [workspace, setWorkspace] = useState<AdminTenantOperationsWorkspace | null>(null);

  const getOwnerDisplay = (tenant: AdminTenantSummary) => {
    if (!tenant.ownerName) return "Service Principal";
    return `${tenant.ownerName} (#USR-${tenant.userId?.slice(-6).toUpperCase() || "ADMIN"})`;
  };

  const getActorDisplay = (actorId?: string | null) => {
    if (!actorId) return "Orchestration Engine";
    return `Identity (#${actorId.slice(-6).toUpperCase()})`;
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended" | "archived" | "risk">("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editingTenant, setEditingTenant] = useState<AdminTenantSummary | null>(null);
  const [coreForm, setCoreForm] = useState<CoreFormState>(emptyCoreForm);
  const [billingForm, setBillingForm] = useState<BillingFormState>(emptyBillingForm);
  const [environmentForm, setEnvironmentForm] = useState<EnvironmentFormState>(emptyEnvironmentForm);
  const [limitForm, setLimitForm] = useState<LimitFormState>(emptyLimitForm);
  const [permissionForm, setPermissionForm] = useState<PermissionFormState>(emptyPermissionForm);
  const [isolationForm, setIsolationForm] = useState<IsolationFormState>(emptyIsolationForm);
  const [lifecycleForm, setLifecycleForm] = useState<LifecycleFormState>(emptyLifecycleForm);
  const [migrationForm, setMigrationForm] = useState<MigrationFormState>(emptyMigrationForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminTenantWorkspace();
      setWorkspace(result);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to load tenant operations workspace.";
      setError(message);
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const tenants = workspace?.tenants ?? [];

  const filteredTenants = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tenants.filter((tenant) => {
      const archived = tenant.suspension?.status === "ARCHIVED";
      const suspended = !tenant.active && !archived;
      const risk = (tenant.usage?.anomalyStatus ?? "NORMAL") !== "NORMAL";

      if (statusFilter === "active" && !tenant.active) {
        return false;
      }
      if (statusFilter === "suspended" && !suspended) {
        return false;
      }
      if (statusFilter === "archived" && !archived) {
        return false;
      }
      if (statusFilter === "risk" && !risk) {
        return false;
      }
      if (tierFilter !== "all" && tenant.tier !== tierFilter) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      return [
        tenant.companyName,
        tenant.ownerName,
        tenant.ownerEmail ?? "",
        tenant.industry ?? "",
        tenant.country ?? "",
        tenant.environment?.region ?? "",
        tenant.id,
      ].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [query, statusFilter, tenants, tierFilter]);

  const selectedTenant = useMemo(() => {
    if (!selectedTenantId) {
      return filteredTenants[0] ?? tenants[0] ?? null;
    }
    return tenants.find((tenant) => tenant.id === selectedTenantId) ?? filteredTenants[0] ?? tenants[0] ?? null;
  }, [filteredTenants, selectedTenantId, tenants]);

  useEffect(() => {
    if (selectedTenant && selectedTenant.id !== selectedTenantId) {
      setSelectedTenantId(selectedTenant.id);
    }
    if (!selectedTenant && selectedTenantId) {
      setSelectedTenantId(null);
    }
  }, [selectedTenant, selectedTenantId]);

  useEffect(() => {
    if (!selectedTenant) {
      return;
    }
    setBillingForm(toBillingForm(selectedTenant));
    setEnvironmentForm(toEnvironmentForm(selectedTenant));
    setLimitForm(toLimitForm(selectedTenant));
    setPermissionForm(toPermissionForm(selectedTenant));
    setIsolationForm(toIsolationForm(selectedTenant));
    setLifecycleForm((current) => ({ ...current, action: selectedTenant.active ? "SUSPEND" : "REACTIVATE", reason: "", note: "" }));
    setMigrationForm({
      targetRegion: selectedTenant.migration?.targetRegion ?? selectedTenant.environment?.region ?? "secondary-cluster-eu",
      note: "",
    });
  }, [selectedTenant]);

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
      const message = err instanceof Error && err.message ? err.message : "Tenant operation failed.";
      setNotice({ tone: "error", message });
    } finally {
      setBusyAction(null);
    }
  }, [load]);

  const openCreate = () => {
    setDialogMode("create");
    setEditingTenant(null);
    setCoreForm(emptyCoreForm);
  };

  const openEdit = (tenant: AdminTenantSummary) => {
    setDialogMode("edit");
    setEditingTenant(tenant);
    setCoreForm(toCoreForm(tenant));
  };

  const handleSaveCore = async () => {
    await runAction(
      dialogMode === "create" ? "create-tenant" : `edit-tenant-${editingTenant?.id ?? "unknown"}`,
      async () => {
        if (dialogMode === "create") {
          const payload: AdminCreateTenantInput = {
            ownerFullName: coreForm.ownerFullName.trim(),
            ownerEmail: coreForm.ownerEmail.trim(),
            ownerUsername: coreForm.ownerUsername.trim() || undefined,
            ownerPassword: coreForm.ownerPassword,
            companyName: coreForm.companyName.trim(),
            companyWebsite: coreForm.companyWebsite.trim() || undefined,
            industry: coreForm.industry.trim() || undefined,
            country: coreForm.country.trim() || undefined,
            employeeCount: parseOptionalInt(coreForm.employeeCount),
            tier: coreForm.tier,
          };
          await adminCreateTenant(payload);
        } else if (editingTenant) {
          const payload: AdminUpdateTenantInput = {
            ownerFullName: coreForm.ownerFullName.trim(),
            ownerEmail: coreForm.ownerEmail.trim(),
            ownerUsername: coreForm.ownerUsername.trim() || undefined,
            companyName: coreForm.companyName.trim(),
            companyWebsite: coreForm.companyWebsite.trim() || undefined,
            industry: coreForm.industry.trim() || undefined,
            country: coreForm.country.trim() || undefined,
            employeeCount: parseOptionalInt(coreForm.employeeCount),
            tier: coreForm.tier,
          };
          await adminPatchTenant(editingTenant.id, payload);
        }
        setDialogMode(null);
      },
      dialogMode === "create" ? "Tenant created." : "Tenant profile updated.",
    );
  };

  const handleDeleteTenant = async (tenant: AdminTenantSummary) => {
    if (typeof window !== "undefined" && !window.confirm(`Delete ${tenant.companyName}? This removes the tenant owner account too.`)) {
      return;
    }
    await runAction(`delete-${tenant.id}`, async () => {
      await adminDeleteTenant(tenant.id);
      if (selectedTenantId === tenant.id) {
        setSelectedTenantId(null);
      }
    }, `${tenant.companyName} deleted.`);
  };

  const handleSaveBilling = async () => {
    if (!selectedTenant) {
      return;
    }
    await runAction(
      `billing-${selectedTenant.id}`,
      async () => {
        await adminPatchTenant(selectedTenant.id, {
          plan: billingForm.plan,
          billingStatus: billingForm.billingStatus,
          billingModel: billingForm.billingModel,
          billingEmail: billingForm.billingEmail.trim() || undefined,
          billingCurrency: billingForm.billingCurrency.trim() || undefined,
          billingProvider: billingForm.billingProvider.trim() || undefined,
          billingAccountId: billingForm.billingAccountId.trim() || undefined,
          renewalDate: billingForm.renewalDate ? new Date(billingForm.renewalDate).toISOString() : undefined,
          maxActiveProjects: parseOptionalInt(billingForm.maxActiveProjects),
          maxTeamMembers: parseOptionalInt(billingForm.maxTeamMembers),
          storageLimitGb: parseOptionalInt(billingForm.storageLimitGb),
          apiRateLimitPerMinute: parseOptionalInt(billingForm.apiRateLimitPerMinute),
          businessVerified: billingForm.businessVerified,
          paymentVerified: billingForm.paymentVerified,
          kycStatus: billingForm.kycStatus,
          verificationNote: billingForm.verificationNote.trim() || undefined,
        });
      },
      `Subscription and quota settings updated for ${selectedTenant.companyName}.`,
    );
  };

  const handleProvisionEnvironment = async () => {
    if (!selectedTenant) {
      return;
    }
    await runAction(
      `environment-${selectedTenant.id}`,
      async () => {
        await adminProvisionTenantEnvironment(selectedTenant.id, {
          deploymentMode: environmentForm.deploymentMode,
          namespace: environmentForm.namespace.trim() || undefined,
          cluster: environmentForm.cluster.trim() || undefined,
          region: environmentForm.region.trim() || undefined,
          infrastructureProvider: environmentForm.infrastructureProvider,
          computeProfile: environmentForm.computeProfile.trim() || undefined,
          storageProfile: environmentForm.storageProfile.trim() || undefined,
          networkSegment: environmentForm.networkSegment.trim() || undefined,
          environmentTemplate: environmentForm.environmentTemplate.trim() || undefined,
          autoScalingEnabled: environmentForm.autoScalingEnabled,
          selfServiceOnboardingEnabled: environmentForm.selfServiceOnboardingEnabled,
        });
      },
      `Environment provisioned for ${selectedTenant.companyName}.`,
    );
  };

  const handleSaveLimits = async () => {
    if (!selectedTenant) {
      return;
    }
    await runAction(
      `limits-${selectedTenant.id}`,
      async () => {
        await adminConfigureTenantLimits(selectedTenant.id, {
          softCpuCores: parseOptionalFloat(limitForm.softCpuCores),
          hardCpuCores: parseOptionalFloat(limitForm.hardCpuCores),
          softMemoryGb: parseOptionalFloat(limitForm.softMemoryGb),
          hardMemoryGb: parseOptionalFloat(limitForm.hardMemoryGb),
          softStorageGb: parseOptionalFloat(limitForm.softStorageGb),
          hardStorageGb: parseOptionalFloat(limitForm.hardStorageGb),
          softBandwidthMbps: parseOptionalFloat(limitForm.softBandwidthMbps),
          hardBandwidthMbps: parseOptionalFloat(limitForm.hardBandwidthMbps),
          throttlingEnabled: limitForm.throttlingEnabled,
          autoScaleEnabled: limitForm.autoScaleEnabled,
        });
      },
      `Resource limits updated for ${selectedTenant.companyName}.`,
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedTenant) {
      return;
    }
    await runAction(
      `permissions-${selectedTenant.id}`,
      async () => {
        await adminUpdateTenantPermissions(selectedTenant.id, {
          accessModel: permissionForm.accessModel,
          adminRoles: normalizeCsvList(permissionForm.adminRolesText),
          permissions: normalizeCsvList(permissionForm.permissionsText),
          isolationEnforced: permissionForm.isolationEnforced,
        });
      },
      `Tenant permission model updated for ${selectedTenant.companyName}.`,
    );
  };

  const handleSaveIsolation = async () => {
    if (!selectedTenant) {
      return;
    }
    await runAction(
      `isolation-${selectedTenant.id}`,
      async () => {
        await adminUpdateTenantIsolation(selectedTenant.id, {
          databaseIsolationMode: isolationForm.databaseIsolationMode,
          networkPolicy: isolationForm.networkPolicy,
          encryptionAtRest: isolationForm.encryptionAtRest,
          encryptionInTransit: isolationForm.encryptionInTransit,
          crossTenantViolationCount: parseOptionalInt(isolationForm.crossTenantViolationCount),
          securityPolicy: isolationForm.securityPolicy,
        });
      },
      `Isolation controls updated for ${selectedTenant.companyName}.`,
    );
  };

  const handleLifecycle = async () => {
    if (!selectedTenant || !lifecycleForm.reason.trim()) {
      return;
    }
    await runAction(
      `lifecycle-${selectedTenant.id}`,
      async () => {
        await adminChangeTenantLifecycle(selectedTenant.id, {
          action: lifecycleForm.action,
          reason: lifecycleForm.reason.trim(),
          note: lifecycleForm.note.trim() || undefined,
        });
        setLifecycleForm((current) => ({ ...current, reason: "", note: "" }));
      },
      `${lifecycleForm.action} executed for ${selectedTenant.companyName}.`,
    );
  };

  const handleMigration = async () => {
    if (!selectedTenant) {
      return;
    }
    await runAction(
      `migration-${selectedTenant.id}`,
      async () => {
        await adminMigrateTenant(selectedTenant.id, {
          targetRegion: migrationForm.targetRegion.trim(),
          note: migrationForm.note.trim() || undefined,
        });
        setMigrationForm((current) => ({ ...current, note: "" }));
      },
      `Migration recorded for ${selectedTenant.companyName}.`,
    );
  };

  const handleRefreshUsage = async () => {
    if (!selectedTenant) {
      return;
    }
    await runAction(
      `usage-${selectedTenant.id}`,
      async () => {
        await adminRefreshTenantUsage(selectedTenant.id);
      },
      `Usage telemetry refreshed for ${selectedTenant.companyName}.`,
    );
  };

  const exportTenantJson = () => {
    if (!workspace) {
      return;
    }
    downloadFile("tenants-workspace.json", JSON.stringify(workspace.tenants, null, 2), "application/json");
    setNotice({ tone: "info", message: "Tenant workspace exported as JSON." });
  };

  const exportTenantCsv = () => {
    if (!workspace) {
      return;
    }
    const csv = toCsv(workspace.tenants.map((tenant) => ({
      id: tenant.id,
      companyName: tenant.companyName,
      ownerName: tenant.ownerName,
      tier: tenant.tier,
      plan: tenant.billing?.plan,
      billingStatus: tenant.billing?.status,
      billingModel: tenant.billing?.model,
      active: tenant.active,
      region: tenant.environment?.region,
      deploymentMode: tenant.environment?.deploymentMode,
      apiRequests: tenant.usage?.apiRequestsCurrentPeriod,
      storageGbUsed: tenant.usage?.storageGbUsed,
      anomalyStatus: tenant.usage?.anomalyStatus,
    })));
    downloadFile("tenants-workspace.csv", csv, "text/csv;charset=utf-8");
    setNotice({ tone: "info", message: "Tenant workspace exported as CSV." });
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
    })));
    downloadFile("tenant-audit.csv", csv, "text/csv;charset=utf-8");
    setNotice({ tone: "info", message: "Tenant audit log exported as CSV." });
  };

  return (
    <Stack spacing={2.2}>
      <GlassCard
        sx={{
          border: "1px solid var(--border)",
          background: "linear-gradient(135deg, #102033 0%, #1c3551 54%, #38566d 100%)",
          color: "common.white",
          p: 0
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ lg: "center" }} gap={3}>
            <Box>
              <Typography variant="overline" fontWeight={900} sx={{ letterSpacing: "0.15em", opacity: 0.8 }}>
                PLATFORM ISOLATION & WORLD MANAGEMENT
              </Typography>
              <Typography variant="h3" fontWeight={900} sx={{ lineHeight: 1, mt: 1 }}>
                Tenant Orchestration
              </Typography>
              <Typography variant="body1" sx={{ mt: 1.5, opacity: 0.9, maxWidth: 880, fontWeight: 600 }}>
                Manage domain-isolated environments, lifecycle pipelines, and multi-region data residency. 
                Full enforcement of subscription quotas and telemetry guardrails.
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <SoftButton variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void load()} sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}>
                Sync
              </SoftButton>
              <SoftButton variant="contained" color="primary" startIcon={<AddRoundedIcon />} onClick={openCreate} sx={{ bgcolor: "white", color: "#102033", "&:hover": { bgcolor: "rgba(255,255,255,0.9)" } }}>
                Provision New World
              </SoftButton>
            </Stack>
          </Stack>
        </CardContent>
      </GlassCard>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {notice ? <Alert severity={noticeSeverity(notice)}>{notice.message}</Alert> : null}

      <Grid container spacing={2}>
        {(workspace?.metrics ?? []).map((metric) => (
          <Grid key={metric.key} size={{ xs: 12, sm: 6, xl: 2 }}>
            <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
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
            </SoftCard>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="h6" fontWeight={800}>
                  Tenant Usage Snapshot
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Real per-tenant storage usage and API volume.
                </Typography>
                <Box sx={{ height: 300 }}>
                  <NoSsrResponsiveContainer fallbackHeight={300}>
                    <BarChart data={workspace?.usageSnapshots ?? []} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                      <XAxis dataKey="tenantName" tick={{ fontSize: 11 }} angle={-16} height={62} interval={0} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="storageGbUsed" fill="#0284c7" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="apiRequestsCurrentPeriod" fill="#16a34a" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </NoSsrResponsiveContainer>
                </Box>
              </Stack>
            </CardContent>
          </SoftCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="h6" fontWeight={800}>
                      Lifecycle State
                    </Typography>
                    <Box sx={{ height: 250 }}>
                      <NoSsrResponsiveContainer fallbackHeight={250}>
                        <PieChart>
                          <Pie data={workspace?.lifecycleDistribution ?? []} dataKey="value" nameKey="label" innerRadius={46} outerRadius={80} paddingAngle={3}>
                            {(workspace?.lifecycleDistribution ?? []).map((entry) => (
                              <Cell key={entry.label} fill={toneColor[entry.tone] ?? toneColor.info} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </NoSsrResponsiveContainer>
                    </Box>
                  </Stack>
                </CardContent>
              </SoftCard>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="h6" fontWeight={800}>
                      Billing State
                    </Typography>
                    <Box sx={{ height: 250 }}>
                      <NoSsrResponsiveContainer fallbackHeight={250}>
                        <PieChart>
                          <Pie data={workspace?.billingDistribution ?? []} dataKey="value" nameKey="label" innerRadius={46} outerRadius={80} paddingAngle={3}>
                            {(workspace?.billingDistribution ?? []).map((entry) => (
                              <Cell key={entry.label} fill={toneColor[entry.tone] ?? toneColor.info} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </NoSsrResponsiveContainer>
                    </Box>
                  </Stack>
                </CardContent>
              </SoftCard>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Stack direction={{ xs: "column", lg: "row" }} gap={1.2}>
            <SoftTextField
              label="Search tenants"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Company, owner, email, region"
              fullWidth
              InputProps={{ startAdornment: <SearchRoundedIcon sx={{ fontSize: 18, mr: 1, color: "text.secondary" }} /> }}
            />
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
                <MenuItem value="all">All states</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
                <MenuItem value="risk">Usage Risk</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Tier</InputLabel>
              <Select label="Tier" value={tierFilter} onChange={(event) => setTierFilter(event.target.value)}>
                <MenuItem value="all">All tiers</MenuItem>
                {tierCatalog.map((tier) => (
                  <MenuItem key={tier} value={tier}>
                    {tier}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1}>
              <SoftButton variant="outlined" startIcon={<PaidRoundedIcon />} onClick={exportAuditCsv} disabled={!workspace}>
                Audit CSV
              </SoftButton>
              <SoftButton variant="outlined" startIcon={<ApartmentRoundedIcon />} onClick={exportTenantJson} disabled={!workspace}>
                JSON
              </SoftButton>
            </Stack>
          </Stack>
        </CardContent>
      </SoftCard>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, xl: 7 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Stack spacing={1.2}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Tenant Directory
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Real tenant operations are available on every record.
                  </Typography>
                </Box>
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tenant</TableCell>
                        <TableCell>Environment</TableCell>
                        <TableCell>Subscription</TableCell>
                        <TableCell>Usage</TableCell>
                        <TableCell>Isolation</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredTenants.map((tenant) => (
                        <TableRow key={tenant.id} hover selected={tenant.id === selectedTenant?.id} onClick={() => setSelectedTenantId(tenant.id)} sx={{ cursor: "pointer" }}>
                          <TableCell sx={{ minWidth: 230 }}>
                            <Stack spacing={0.4}>
                              <Typography variant="subtitle2" fontWeight={900}>
                                {tenant.companyName}
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.5, letterSpacing: "0.05em" }}>
                                ID: #WORLD-{tenant.id.slice(-6).toUpperCase()} · {tenant.tier}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                {getOwnerDisplay(tenant)}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ minWidth: 180 }}>
                            <Stack spacing={0.35}>
                              <Typography variant="body2" fontWeight={700}>
                                {tenant.environment?.deploymentMode ?? "SHARED"} · {tenant.environment?.status ?? "--"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {tenant.environment?.region ?? "--"} · {tenant.environment?.cluster ?? "--"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                NS {tenant.environment?.namespace ?? "--"}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ minWidth: 190 }}>
                            <Stack spacing={0.35}>
                              <Typography variant="body2" fontWeight={700}>
                                {tenant.billing?.plan ?? "STARTER"} · {tenant.billing?.status ?? "ACTIVE"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {tenant.billing?.model ?? "SUBSCRIPTION"} · {tenant.billing?.provider ?? "MANUAL"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {tenant.billing?.billingEmail ?? tenant.ownerEmail ?? "--"}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ minWidth: 180 }}>
                            <Stack spacing={0.35}>
                              <Typography variant="body2">
                                CPU {tenant.usage?.cpuCoresUsed ?? 0} · RAM {tenant.usage?.memoryGbUsed ?? 0} GB
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Storage {tenant.usage?.storageGbUsed ?? 0} GB · API {tenant.usage?.apiRequestsCurrentPeriod ?? 0}
                              </Typography>
                              <Chip
                                label={tenant.usage?.anomalyStatus ?? "NORMAL"}
                                size="small"
                                color={tenant.usage?.anomalyStatus === "CRITICAL" ? "error" : tenant.usage?.anomalyStatus === "WARNING" ? "warning" : "success"}
                                variant="outlined"
                                sx={{ alignSelf: "flex-start" }}
                              />
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ minWidth: 170 }}>
                            <Stack spacing={0.35}>
                              <Typography variant="body2" fontWeight={700}>
                                {tenant.isolationProfile?.databaseIsolationMode ?? "SCHEMA"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {tenant.isolationProfile?.networkPolicy ?? "SEGMENTED"} · violations {tenant.isolationProfile?.crossTenantViolationCount ?? 0}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {tenant.isolationProfile?.encryptionAtRest ? "At-rest encrypted" : "No at-rest encryption"}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right" sx={{ minWidth: 280 }}>
                            <Stack direction="row" spacing={0.8} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                              <SoftButton variant="outlined" size="small" startIcon={<EditRoundedIcon />} onClick={(event) => {
                                event.stopPropagation();
                                openEdit(tenant);
                              }}>
                                Edit
                              </SoftButton>
                              <SoftButton variant="outlined" size="small" startIcon={<CloudSyncRoundedIcon />} disabled={!!busyAction} onClick={(event) => {
                                event.stopPropagation();
                                setSelectedTenantId(tenant.id);
                                void runAction(`usage-quick-${tenant.id}`, async () => {
                                  await adminRefreshTenantUsage(tenant.id);
                                }, `Usage refreshed for ${tenant.companyName}.`);
                              }}>
                                Usage
                              </SoftButton>
                              <SoftButton
                                variant="outlined"
                                size="small"
                                color={tenant.active ? "warning" : "success"}
                                startIcon={tenant.active ? <LockRoundedIcon /> : <LockOpenRoundedIcon />}
                                disabled={!!busyAction}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedTenantId(tenant.id);
                                  void runAction(`lifecycle-quick-${tenant.id}`, async () => {
                                    await adminChangeTenantLifecycle(tenant.id, {
                                      action: tenant.active ? "SUSPEND" : "REACTIVATE",
                                      reason: tenant.active ? "Quick suspension from tenant directory" : "Quick reactivation from tenant directory",
                                    });
                                  }, `${tenant.companyName} ${tenant.active ? "suspended" : "reactivated"}.`);
                                }}
                              >
                                {tenant.active ? "Suspend" : "Reactivate"}
                              </SoftButton>
                              <SoftButton variant="outlined" size="small" color="error" startIcon={<DeleteRoundedIcon />} disabled={!!busyAction} onClick={(event) => {
                                event.stopPropagation();
                                void handleDeleteTenant(tenant);
                              }}>
                                Delete
                              </SoftButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!loading && filteredTenants.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                            No tenants match the active filters.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </Box>
              </Stack>
            </CardContent>
          </SoftCard>
        </Grid>

        <Grid size={{ xs: 12, xl: 5 }}>
          <Stack spacing={2}>
            <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                {selectedTenant ? (
                  <Stack spacing={1.1}>
                    <Box>
                      <Typography variant="h6" fontWeight={800}>
                        {selectedTenant.companyName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedTenant.ownerName} · {selectedTenant.ownerEmail ?? "No owner email"}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.7} useFlexGap flexWrap="wrap">
                      <Chip label={selectedTenant.environment?.status ?? "PROVISIONED"} size="small" variant="outlined" />
                      <Chip label={selectedTenant.billing?.status ?? "ACTIVE"} size="small" variant="outlined" />
                      <Chip label={selectedTenant.usage?.anomalyStatus ?? "NORMAL"} size="small" color={selectedTenant.usage?.anomalyStatus === "CRITICAL" ? "error" : selectedTenant.usage?.anomalyStatus === "WARNING" ? "warning" : "success"} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Created {formatDateTime(selectedTenant.ownerCreatedAt)} · Updated {formatDateTime(selectedTenant.updatedAt)}
                    </Typography>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a tenant to open operational controls.
                  </Typography>
                )}
              </CardContent>
            </SoftCard>

            <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Stack spacing={1.2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PaidRoundedIcon fontSize="small" />
                    <Typography variant="h6" fontWeight={800}>
                      Subscription, Billing & Quotas
                    </Typography>
                  </Stack>
                  <Grid container spacing={1.1}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Plan</InputLabel>
                        <Select label="Plan" value={billingForm.plan} onChange={(event) => setBillingForm((current) => ({ ...current, plan: event.target.value }))}>
                          {planCatalog.map((plan) => (
                            <MenuItem key={plan} value={plan}>{plan}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Billing status</InputLabel>
                        <Select label="Billing status" value={billingForm.billingStatus} onChange={(event) => setBillingForm((current) => ({ ...current, billingStatus: event.target.value }))}>
                          {billingStatusCatalog.map((status) => (
                            <MenuItem key={status} value={status}>{status}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Billing model</InputLabel>
                        <Select label="Billing model" value={billingForm.billingModel} onChange={(event) => setBillingForm((current) => ({ ...current, billingModel: event.target.value }))}>
                          {billingModelCatalog.map((model) => (
                            <MenuItem key={model} value={model}>{model}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <SoftTextField fullWidth label="Billing email" value={billingForm.billingEmail} onChange={(event) => setBillingForm((current) => ({ ...current, billingEmail: event.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <SoftTextField fullWidth label="Currency" value={billingForm.billingCurrency} onChange={(event) => setBillingForm((current) => ({ ...current, billingCurrency: event.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <SoftTextField fullWidth label="Provider" value={billingForm.billingProvider} onChange={(event) => setBillingForm((current) => ({ ...current, billingProvider: event.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <SoftTextField fullWidth label="Billing account ID" value={billingForm.billingAccountId} onChange={(event) => setBillingForm((current) => ({ ...current, billingAccountId: event.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <SoftTextField fullWidth type="datetime-local" label="Renewal date" value={billingForm.renewalDate} onChange={(event) => setBillingForm((current) => ({ ...current, renewalDate: event.target.value }))} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <SoftTextField fullWidth type="number" label="Project quota" value={billingForm.maxActiveProjects} onChange={(event) => setBillingForm((current) => ({ ...current, maxActiveProjects: event.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <SoftTextField fullWidth type="number" label="Seat quota" value={billingForm.maxTeamMembers} onChange={(event) => setBillingForm((current) => ({ ...current, maxTeamMembers: event.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <SoftTextField fullWidth type="number" label="Storage quota GB" value={billingForm.storageLimitGb} onChange={(event) => setBillingForm((current) => ({ ...current, storageLimitGb: event.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <SoftTextField fullWidth type="number" label="API limit/min" value={billingForm.apiRateLimitPerMinute} onChange={(event) => setBillingForm((current) => ({ ...current, apiRateLimitPerMinute: event.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <SoftTextField fullWidth label="Verification note" value={billingForm.verificationNote} onChange={(event) => setBillingForm((current) => ({ ...current, verificationNote: event.target.value }))} />
                    </Grid>
                  </Grid>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <FormControlLabel control={<Switch checked={billingForm.businessVerified} onChange={(event) => setBillingForm((current) => ({ ...current, businessVerified: event.target.checked }))} />} label="Business verified" />
                    <FormControlLabel control={<Switch checked={billingForm.paymentVerified} onChange={(event) => setBillingForm((current) => ({ ...current, paymentVerified: event.target.checked }))} />} label="Payment verified" />
                    <FormControl fullWidth size="small" sx={{ maxWidth: 220 }}>
                      <InputLabel>KYC status</InputLabel>
                      <Select label="KYC status" value={billingForm.kycStatus} onChange={(event) => setBillingForm((current) => ({ ...current, kycStatus: event.target.value }))}>
                        {kycStatusCatalog.map((status) => (
                          <MenuItem key={status} value={status}>{status}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                  <SoftButton variant="contained" startIcon={<SaveRoundedIcon />} disabled={!selectedTenant || !!busyAction} onClick={() => void handleSaveBilling()}>
                    Save Billing & Quotas
                  </SoftButton>
                </Stack>
              </CardContent>
            </SoftCard>

            <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Stack spacing={1.2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <SettingsEthernetRoundedIcon fontSize="small" />
                    <Typography variant="h6" fontWeight={800}>
                      Environment & Resource Limits
                    </Typography>
                  </Stack>
                  <Grid container spacing={1.1}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Deployment</InputLabel>
                        <Select label="Deployment" value={environmentForm.deploymentMode} onChange={(event) => setEnvironmentForm((current) => ({ ...current, deploymentMode: event.target.value }))}>
                          {deploymentModeCatalog.map((mode) => (
                            <MenuItem key={mode} value={mode}>{mode}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <SoftTextField fullWidth label="Namespace" value={environmentForm.namespace} onChange={(event) => setEnvironmentForm((current) => ({ ...current, namespace: event.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <SoftTextField fullWidth label="Cluster" value={environmentForm.cluster} onChange={(event) => setEnvironmentForm((current) => ({ ...current, cluster: event.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <SoftTextField fullWidth label="Region" value={environmentForm.region} onChange={(event) => setEnvironmentForm((current) => ({ ...current, region: event.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Infrastructure</InputLabel>
                        <Select label="Infrastructure" value={environmentForm.infrastructureProvider} onChange={(event) => setEnvironmentForm((current) => ({ ...current, infrastructureProvider: event.target.value }))}>
                          {infrastructureCatalog.map((provider) => (
                            <MenuItem key={provider} value={provider}>{provider}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <SoftTextField fullWidth label="Network segment" value={environmentForm.networkSegment} onChange={(event) => setEnvironmentForm((current) => ({ ...current, networkSegment: event.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <SoftTextField fullWidth label="Compute profile" value={environmentForm.computeProfile} onChange={(event) => setEnvironmentForm((current) => ({ ...current, computeProfile: event.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <SoftTextField fullWidth label="Storage profile" value={environmentForm.storageProfile} onChange={(event) => setEnvironmentForm((current) => ({ ...current, storageProfile: event.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <SoftTextField fullWidth label="Template" value={environmentForm.environmentTemplate} onChange={(event) => setEnvironmentForm((current) => ({ ...current, environmentTemplate: event.target.value }))} />
                    </Grid>
                  </Grid>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <FormControlLabel control={<Switch checked={environmentForm.autoScalingEnabled} onChange={(event) => setEnvironmentForm((current) => ({ ...current, autoScalingEnabled: event.target.checked }))} />} label="Auto scaling" />
                    <FormControlLabel control={<Switch checked={environmentForm.selfServiceOnboardingEnabled} onChange={(event) => setEnvironmentForm((current) => ({ ...current, selfServiceOnboardingEnabled: event.target.checked }))} />} label="Self-service onboarding" />
                  </Stack>
                  <SoftButton variant="outlined" startIcon={<CloudSyncRoundedIcon />} disabled={!selectedTenant || !!busyAction} onClick={() => void handleProvisionEnvironment()}>
                    Provision Environment
                  </SoftButton>

                  <Divider />

                  <Grid container spacing={1.1}>
                    <Grid size={{ xs: 12, sm: 3 }}><SoftTextField fullWidth type="number" label="Soft CPU" value={limitForm.softCpuCores} onChange={(event) => setLimitForm((current) => ({ ...current, softCpuCores: event.target.value }))} /></Grid>
                    <Grid size={{ xs: 12, sm: 3 }}><SoftTextField fullWidth type="number" label="Hard CPU" value={limitForm.hardCpuCores} onChange={(event) => setLimitForm((current) => ({ ...current, hardCpuCores: event.target.value }))} /></Grid>
                    <Grid size={{ xs: 12, sm: 3 }}><SoftTextField fullWidth type="number" label="Soft RAM GB" value={limitForm.softMemoryGb} onChange={(event) => setLimitForm((current) => ({ ...current, softMemoryGb: event.target.value }))} /></Grid>
                    <Grid size={{ xs: 12, sm: 3 }}><SoftTextField fullWidth type="number" label="Hard RAM GB" value={limitForm.hardMemoryGb} onChange={(event) => setLimitForm((current) => ({ ...current, hardMemoryGb: event.target.value }))} /></Grid>
                    <Grid size={{ xs: 12, sm: 3 }}><SoftTextField fullWidth type="number" label="Soft storage GB" value={limitForm.softStorageGb} onChange={(event) => setLimitForm((current) => ({ ...current, softStorageGb: event.target.value }))} /></Grid>
                    <Grid size={{ xs: 12, sm: 3 }}><SoftTextField fullWidth type="number" label="Hard storage GB" value={limitForm.hardStorageGb} onChange={(event) => setLimitForm((current) => ({ ...current, hardStorageGb: event.target.value }))} /></Grid>
                    <Grid size={{ xs: 12, sm: 3 }}><SoftTextField fullWidth type="number" label="Soft bandwidth" value={limitForm.softBandwidthMbps} onChange={(event) => setLimitForm((current) => ({ ...current, softBandwidthMbps: event.target.value }))} /></Grid>
                    <Grid size={{ xs: 12, sm: 3 }}><SoftTextField fullWidth type="number" label="Hard bandwidth" value={limitForm.hardBandwidthMbps} onChange={(event) => setLimitForm((current) => ({ ...current, hardBandwidthMbps: event.target.value }))} /></Grid>
                  </Grid>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <FormControlLabel control={<Switch checked={limitForm.throttlingEnabled} onChange={(event) => setLimitForm((current) => ({ ...current, throttlingEnabled: event.target.checked }))} />} label="Throttling" />
                    <FormControlLabel control={<Switch checked={limitForm.autoScaleEnabled} onChange={(event) => setLimitForm((current) => ({ ...current, autoScaleEnabled: event.target.checked }))} />} label="Auto scale limits" />
                  </Stack>
                  <SoftButton variant="contained" startIcon={<StorageRoundedIcon />} disabled={!selectedTenant || !!busyAction} onClick={() => void handleSaveLimits()}>
                    Save Hard & Soft Limits
                  </SoftButton>
                </Stack>
              </CardContent>
            </SoftCard>

            <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Stack spacing={1.2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ManageAccountsRoundedIcon fontSize="small" />
                    <Typography variant="h6" fontWeight={800}>
                      Tenant Permissions & Isolation
                    </Typography>
                  </Stack>
                  <Grid container spacing={1.1}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Access model</InputLabel>
                        <Select label="Access model" value={permissionForm.accessModel} onChange={(event) => setPermissionForm((current) => ({ ...current, accessModel: event.target.value }))}>
                          {accessModelCatalog.map((model) => (
                            <MenuItem key={model} value={model}>{model}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <SoftTextField fullWidth label="Tenant admin roles" value={permissionForm.adminRolesText} onChange={(event) => setPermissionForm((current) => ({ ...current, adminRolesText: event.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <SoftTextField fullWidth label="Tenant permissions" value={permissionForm.permissionsText} onChange={(event) => setPermissionForm((current) => ({ ...current, permissionsText: event.target.value }))} helperText="Comma-separated permission keys." />
                    </Grid>
                  </Grid>
                  <FormControlLabel control={<Switch checked={permissionForm.isolationEnforced} onChange={(event) => setPermissionForm((current) => ({ ...current, isolationEnforced: event.target.checked }))} />} label="Enforce tenant-boundary isolation" />
                  <SoftButton variant="outlined" startIcon={<ManageAccountsRoundedIcon />} disabled={!selectedTenant || !!busyAction} onClick={() => void handleSavePermissions()}>
                    Save Permission Model
                  </SoftButton>

                  <Divider />

                  <Grid container spacing={1.1}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <SoftTextField fullWidth label="Database isolation mode" value={isolationForm.databaseIsolationMode} onChange={(event) => setIsolationForm((current) => ({ ...current, databaseIsolationMode: event.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <SoftTextField fullWidth label="Network policy" value={isolationForm.networkPolicy} onChange={(event) => setIsolationForm((current) => ({ ...current, networkPolicy: event.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <SoftTextField fullWidth type="number" label="Cross-tenant violation count" value={isolationForm.crossTenantViolationCount} onChange={(event) => setIsolationForm((current) => ({ ...current, crossTenantViolationCount: event.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <SoftTextField fullWidth label="Security policy" value={isolationForm.securityPolicy} onChange={(event) => setIsolationForm((current) => ({ ...current, securityPolicy: event.target.value }))} />
                    </Grid>
                  </Grid>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <FormControlLabel control={<Switch checked={isolationForm.encryptionAtRest} onChange={(event) => setIsolationForm((current) => ({ ...current, encryptionAtRest: event.target.checked }))} />} label="Encrypt at rest" />
                    <FormControlLabel control={<Switch checked={isolationForm.encryptionInTransit} onChange={(event) => setIsolationForm((current) => ({ ...current, encryptionInTransit: event.target.checked }))} />} label="Encrypt in transit" />
                  </Stack>
                  <SoftButton variant="contained" startIcon={<ShieldRoundedIcon />} disabled={!selectedTenant || !!busyAction} onClick={() => void handleSaveIsolation()}>
                    Save Isolation Controls
                  </SoftButton>
                </Stack>
              </CardContent>
            </SoftCard>

            <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Stack spacing={1.2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <WarningAmberRoundedIcon fontSize="small" />
                    <Typography variant="h6" fontWeight={800}>
                      Lifecycle, Migration & Usage
                    </Typography>
                  </Stack>
                  <Grid container spacing={1.1}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Lifecycle action</InputLabel>
                        <Select label="Lifecycle action" value={lifecycleForm.action} onChange={(event) => setLifecycleForm((current) => ({ ...current, action: event.target.value }))}>
                          {lifecycleActions.map((action) => (
                            <MenuItem key={action} value={action}>{action}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <SoftTextField fullWidth label="Lifecycle reason" value={lifecycleForm.reason} onChange={(event) => setLifecycleForm((current) => ({ ...current, reason: event.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <SoftTextField fullWidth label="Lifecycle note" value={lifecycleForm.note} onChange={(event) => setLifecycleForm((current) => ({ ...current, note: event.target.value }))} />
                    </Grid>
                  </Grid>
                  <SoftButton variant="outlined" startIcon={lifecycleForm.action === "REACTIVATE" ? <LockOpenRoundedIcon /> : <LockRoundedIcon />} disabled={!selectedTenant || !!busyAction || !lifecycleForm.reason.trim()} onClick={() => void handleLifecycle()}>
                    Execute Lifecycle Action
                  </SoftButton>

                  <Divider />

                  <Grid container spacing={1.1}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <SoftTextField fullWidth label="Target region" value={migrationForm.targetRegion} onChange={(event) => setMigrationForm((current) => ({ ...current, targetRegion: event.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <SoftTextField fullWidth label="Migration note" value={migrationForm.note} onChange={(event) => setMigrationForm((current) => ({ ...current, note: event.target.value }))} />
                    </Grid>
                  </Grid>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <SoftButton variant="contained" startIcon={<PublishedWithChangesRoundedIcon />} disabled={!selectedTenant || !!busyAction || !migrationForm.targetRegion.trim()} onClick={() => void handleMigration()}>
                      Execute Migration
                    </SoftButton>
                    <SoftButton variant="outlined" startIcon={<CloudSyncRoundedIcon />} disabled={!selectedTenant || !!busyAction} onClick={() => void handleRefreshUsage()}>
                      Refresh Usage Telemetry
                    </SoftButton>
                  </Stack>
                  {selectedTenant ? (
                    <Typography variant="caption" color="text.secondary">
                      Usage: CPU {selectedTenant.usage?.cpuCoresUsed ?? 0} / Storage {selectedTenant.usage?.storageGbUsed ?? 0} GB / API {selectedTenant.usage?.apiRequestsCurrentPeriod ?? 0}
                      {" · "}
                      Migration: {selectedTenant.migration?.status ?? "IDLE"} to {selectedTenant.migration?.targetRegion ?? selectedTenant.environment?.region ?? "--"}
                    </Typography>
                  ) : null}
                </Stack>
              </CardContent>
            </SoftCard>
          </Stack>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack spacing={1.2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SecurityRoundedIcon fontSize="small" />
                  <Typography variant="h6" fontWeight={800}>
                    Operational Alerts
                  </Typography>
                </Stack>
                <Stack spacing={0.9}>
                  {(workspace?.alerts ?? []).length ? (
                    workspace!.alerts.map((alert) => (
                      <SoftCard key={alert.key} variant="outlined" sx={{ border: "1px solid", borderColor: "divider", boxShadow: "none" }}>
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
                            {alert.tenantId ? (
                              <SoftButton variant="text" size="small" sx={{ alignSelf: "flex-start", px: 0 }} onClick={() => setSelectedTenantId(alert.tenantId ?? null)}>
                                {alert.actionHint ?? "Open tenant"}
                              </SoftButton>
                            ) : null}
                          </Stack>
                        </CardContent>
                      </SoftCard>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No active tenant alerts.
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </SoftCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack spacing={1.2}>
                <Typography variant="h6" fontWeight={800}>
                  Tenant Audit Trail
                </Typography>
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Action</TableCell>
                        <TableCell>Entity</TableCell>
                        <TableCell>Actor</TableCell>
                        <TableCell>Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(workspace?.auditTrail ?? []).slice(0, 16).map((entry) => (
                        <TableRow key={entry.id} hover>
                          <TableCell sx={{ minWidth: 250 }}>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {entry.action}
                            </Typography>
                          </TableCell>
                          <TableCell>{entry.entityType ?? "--"} {entry.entityId ? `· #ID-${entry.entityId.slice(-6).toUpperCase()}` : ""}</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>{getActorDisplay(entry.actorUserId)}</TableCell>
                          <TableCell sx={{ fontWeight: 600, opacity: 0.7 }}>{formatDateTime(entry.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Stack>
            </CardContent>
          </SoftCard>
        </Grid>
      </Grid>

      <Dialog open={dialogMode !== null} onClose={() => setDialogMode(null)} fullWidth maxWidth="md">
        <DialogTitle>{dialogMode === "create" ? "Create Tenant" : `Edit ${editingTenant?.companyName ?? "Tenant"}`}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.2 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={1.2}>
                <Typography variant="subtitle2" fontWeight={800}>
                  Owner Account
                </Typography>
                <SoftTextField fullWidth label="Owner full name" value={coreForm.ownerFullName} onChange={(event) => setCoreForm((current) => ({ ...current, ownerFullName: event.target.value }))} />
                <SoftTextField fullWidth label="Owner email" value={coreForm.ownerEmail} onChange={(event) => setCoreForm((current) => ({ ...current, ownerEmail: event.target.value }))} />
                <SoftTextField fullWidth label="Owner username" value={coreForm.ownerUsername} onChange={(event) => setCoreForm((current) => ({ ...current, ownerUsername: event.target.value }))} />
                {dialogMode === "create" ? (
                  <SoftTextField fullWidth type="password" label="Owner password" value={coreForm.ownerPassword} onChange={(event) => setCoreForm((current) => ({ ...current, ownerPassword: event.target.value }))} />
                ) : null}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={1.2}>
                <Typography variant="subtitle2" fontWeight={800}>
                  Tenant Profile
                </Typography>
                <SoftTextField fullWidth label="Company name" value={coreForm.companyName} onChange={(event) => setCoreForm((current) => ({ ...current, companyName: event.target.value }))} />
                <SoftTextField fullWidth label="Company website" value={coreForm.companyWebsite} onChange={(event) => setCoreForm((current) => ({ ...current, companyWebsite: event.target.value }))} />
                <SoftTextField fullWidth label="Industry" value={coreForm.industry} onChange={(event) => setCoreForm((current) => ({ ...current, industry: event.target.value }))} />
                <SoftTextField fullWidth label="Country" value={coreForm.country} onChange={(event) => setCoreForm((current) => ({ ...current, country: event.target.value }))} />
                <SoftTextField fullWidth type="number" label="Employee count" value={coreForm.employeeCount} onChange={(event) => setCoreForm((current) => ({ ...current, employeeCount: event.target.value }))} />
                <FormControl fullWidth size="small">
                  <InputLabel>Tier</InputLabel>
                  <Select label="Tier" value={coreForm.tier} onChange={(event) => setCoreForm((current) => ({ ...current, tier: event.target.value }))}>
                    {tierCatalog.map((tier) => (
                      <MenuItem key={tier} value={tier}>{tier}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <SoftButton variant="text" onClick={() => setDialogMode(null)} disabled={!!busyAction}>
            Cancel
          </SoftButton>
          <SoftButton
            variant="contained"
            onClick={() => void handleSaveCore()}
            disabled={
              !!busyAction
              || !coreForm.ownerFullName.trim()
              || !coreForm.ownerEmail.trim()
              || !coreForm.companyName.trim()
              || (dialogMode === "create" && coreForm.ownerPassword.trim().length < 8)
            }
          >
            {dialogMode === "create" ? "Create Tenant" : "Save Tenant"}
          </SoftButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
