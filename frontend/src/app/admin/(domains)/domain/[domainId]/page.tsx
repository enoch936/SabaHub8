import AdminAIModelOperationsWorkspace from "@/components/admin/AdminAIModelOperationsWorkspace";
import AdminApiIntegrationWorkspace from "@/components/admin/AdminApiIntegrationWorkspace";
import AdminAnalyticsWorkspace from "@/components/admin/AdminAnalyticsWorkspace";
import AdminContentGovernanceWorkspace from "@/components/admin/AdminContentGovernanceWorkspace";
import AdminDataManagementWorkspace from "@/components/admin/AdminDataManagementWorkspace";
import AdminDevopsInfrastructureWorkspace from "@/components/admin/AdminDevopsInfrastructureWorkspace";
import AdminDomainWorkspace from "@/components/admin/AdminDomainWorkspace";
import AdminFinanceWorkspace from "@/components/admin/AdminFinanceWorkspace";
import AdminMarketplaceOrchestrationWorkspace from "@/components/admin/AdminJobModerationWorkspace";
import AdminOperationalDomainConsole from "@/components/admin/AdminOperationalDomainConsole";
import AdminPlatformControl from "@/components/admin/AdminPlatformControl";
import AdminProposalWorkspace from "@/components/admin/AdminProposalWorkspace";
import AdminSecurityGovernance from "@/components/admin/AdminSecurityGovernance";
import AdminSystemMonitoringWorkspace from "@/components/admin/AdminSystemMonitoringWorkspace";
import AdminSupportOperationsWorkspace from "@/components/admin/AdminSupportOperationsWorkspace";
import AdminTenantManagementWorkspace from "@/components/admin/AdminTenantManagementWorkspace";
import AdminUserManagementWorkspace from "@/components/admin/AdminUserManagementWorkspace";

type PageProps = {
  params: Promise<{ domainId: string }>;
  searchParams: Promise<{ section?: string }>;
};

export default async function AdminDomainPage({ params, searchParams }: PageProps) {
  const { domainId } = await params;
  const { section } = await searchParams;
  if (domainId === "analytics-platform-insights") {
    return <AdminAnalyticsWorkspace />;
  }
  if (domainId === "platform-administration") {
    return <AdminPlatformControl focusSection={section ?? null} />;
  }
  if (domainId === "user-role-management") {
    return <AdminUserManagementWorkspace />;
  }
  if (domainId === "content-moderation-marketplace-governance") {
    return <AdminMarketplaceOrchestrationWorkspace />;
  }
  if (domainId === "ai-governance-model-management") {
    return <AdminAIModelOperationsWorkspace />;
  }
  if (domainId === "payment-financial-oversight") {
    return <AdminFinanceWorkspace />;
  }
  if (domainId === "platform-governance") {
    return <AdminContentGovernanceWorkspace />;
  }
  if (domainId === "security-monitoring-compliance") {
    return <AdminSecurityGovernance focusSection={section ?? null} />;
  }
  if (domainId === "multi-tenant-platform-management") {
    return <AdminTenantManagementWorkspace />;
  }
  if (domainId === "system-monitoring-health-management") {
    return <AdminSystemMonitoringWorkspace focusSection={section ?? null} />;
  }
  if (domainId === "devops-infrastructure-management") {
    return <AdminDevopsInfrastructureWorkspace focusSection={section ?? null} />;
  }
  if (domainId === "api-integration-management") {
    return <AdminApiIntegrationWorkspace focusSection={section ?? null} />;
  }
  if (domainId === "data-management") {
    return <AdminDataManagementWorkspace focusSection={section ?? null} />;
  }
  if (domainId === "support-operational-management") {
    return <AdminSupportOperationsWorkspace />;
  }
  if (domainId === "proposal-pipeline") {
    return <AdminProposalWorkspace />;
  }
  return <AdminDomainWorkspace domainId={domainId} focusSection={section ?? null} />;
}
