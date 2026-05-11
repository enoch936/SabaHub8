"use client";

import {
  type AdminCommandCenterFeatureFlag,
  type AdminCommandCenterOperation,
} from "@/lib/api";

export type ResponsibilityActionModel = {
  key: string;
  rawLabel: string;
  title: string;
  summary: string;
  operation: AdminCommandCenterOperation | null;
  flag: AdminCommandCenterFeatureFlag | null;
};

type ResponsibilityRule = {
  match: RegExp;
  operationId?: string;
  flagPattern?: RegExp;
};

const responsibilityRules: Record<string, ResponsibilityRule[]> = {
  "security-monitoring-compliance": [
    { match: /mfa/i, operationId: "enforce-mfa-policy", flagPattern: /security\.enforce-mfa/i },
    { match: /privacy|gdpr|data protection|compliance/i, operationId: "run-privacy-compliance-check" },
    { match: /fraud/i, operationId: "configure-fraud-detection", flagPattern: /payments\.fraud-detection/i },
    { match: /audit/i, operationId: "review-audit-logs" },
    { match: /access|encryption/i, operationId: "apply-access-security-policy", flagPattern: /platform\.infrastructure\.guardrails/i },
    { match: /investigate|incident|alert|suspicious/i, operationId: "investigate-security-alerts" },
    { match: /monitor|detect|login|authentication|firewall|security event/i, operationId: "monitor-security-events" },
  ],
  "user-role-management": [
    { match: /role|permission|privilege/i, operationId: "audit-role-permissions" },
    { match: /suspend|ban|warning/i, operationId: "suspend-risk-users" },
    { match: /reactivate|credential|password|auth|identity|verify/i, operationId: "reset-user-credentials" },
  ],
  "multi-tenant-platform-management": [
    { match: /create/i, operationId: "create-tenant-environment" },
    { match: /suspend/i, operationId: "suspend-tenant-environment" },
    { match: /migrate/i, operationId: "migrate-tenant-data" },
    { match: /quota|resource/i, flagPattern: /tenants\.resource-quota-enforcement/i },
  ],
  "content-moderation-marketplace-governance": [
    { match: /remove|fraud|scam/i, operationId: "remove-fraudulent-listings", flagPattern: /marketplace\.strict-moderation/i },
    { match: /guideline/i, operationId: "publish-guideline-update", flagPattern: /marketplace\.strict-moderation/i },
    { match: /moderate|review|reported|investigate|report|approve|dispute|profile|portfolio/i, operationId: "review-flagged-content", flagPattern: /marketplace\.strict-moderation/i },
  ],
  "ai-governance-model-management": [
    { match: /update|machine learning|model/i, operationId: "update-ml-model" },
    { match: /configure|tune|recommendation|automation/i, operationId: "tune-recommendation-parameters" },
    { match: /bias|fair|health/i, flagPattern: /ai\.bias-monitoring/i },
    { match: /monitor|review|matching|fraud|salary|scoring/i, operationId: "monitor-ai-health", flagPattern: /ai\.bias-monitoring/i },
  ],
  "support-operational-management": [
    { match: /assign/i, operationId: "assign-support-agents" },
    { match: /escalate|complaint|unresolved|critical/i, operationId: "escalate-critical-tickets" },
    { match: /sla|workflow|resolution|ticket|support|dispute|review|investigate|resolve/i, operationId: "run-sla-review" },
  ],
  "payment-financial-oversight": [
    { match: /withdrawal/i, operationId: "review-withdrawal-queue" },
    { match: /report/i, operationId: "generate-financial-report" },
    { match: /fraud/i, operationId: "audit-financial-transactions", flagPattern: /payments\.fraud-detection/i },
    { match: /payment|audit|billing|subscription|revenue|transaction|monitor/i, operationId: "audit-financial-transactions" },
  ],
  "system-monitoring-health-management": [
    { match: /alert/i, operationId: "configure-system-alerts" },
    { match: /outage/i, operationId: "investigate-service-outage" },
    { match: /health|server|cpu|memory|api|background|sla|reliability|monitor|track/i, operationId: "run-health-check" },
  ],
  "platform-governance": [
    { match: /announcement/i, operationId: "broadcast-announcement" },
    { match: /rule/i, operationId: "configure-marketplace-rules" },
    { match: /policy|governance|regulation/i, operationId: "update-platform-policy" },
  ],
  "api-integration-management": [
    { match: /oauth/i, operationId: "rotate-oauth-secrets" },
    { match: /rate/i, operationId: "apply-rate-limit-policy" },
    { match: /webhook/i, operationId: "validate-webhook-integrity" },
  ],
  "data-management": [
    { match: /migration/i, operationId: "execute-data-migration" },
    { match: /backup/i, operationId: "verify-platform-backups" },
    { match: /database|retention|integrity|maintenance/i, operationId: "perform-database-maintenance" },
  ],
  "devops-infrastructure-management": [
    { match: /ci\/cd|cicd|pipeline/i, operationId: "run-cicd-pipeline", flagPattern: /devops\.safe-deployments/i },
    { match: /kubernetes|deployment|cluster/i, operationId: "manage-kubernetes-deployment", flagPattern: /devops\.safe-deployments/i },
    { match: /load balancer|resource/i, operationId: "rebalance-load-balancers" },
  ],
  "platform-administration": [
    { match: /feature flag|global platform settings|guardrail|configuration/i, flagPattern: /platform\.infrastructure\.guardrails/i },
  ],
};

function toSectionKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanResponsibilityLabel(value: string) {
  const cleaned = value.replace(/^to\s+/i, "").trim();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : value;
}

function buildSummary(
  responsibility: string,
  operation: AdminCommandCenterOperation | null,
  flag: AdminCommandCenterFeatureFlag | null,
) {
  const title = cleanResponsibilityLabel(responsibility);
  if (operation && flag) {
    return `${title} with live section telemetry, ${operation.title}, and ${flag.key} controls.`;
  }
  if (operation) {
    return `${title} with live section telemetry and the ${operation.title} runbook.`;
  }
  if (flag) {
    return `${title} with live section telemetry and the ${flag.key} control toggle.`;
  }
  return `${title} through live section telemetry, checklists, and admin review signals.`;
}

export function buildResponsibilityActionModels(args: {
  domainId: string;
  responsibilities: string[];
  operations: AdminCommandCenterOperation[];
  featureFlags: AdminCommandCenterFeatureFlag[];
}) {
  const { domainId, responsibilities, operations, featureFlags } = args;
  const rules = responsibilityRules[domainId] ?? [];

  return responsibilities.map<ResponsibilityActionModel>((responsibility) => {
    const rule = rules.find((candidate) => candidate.match.test(responsibility));
    const operation = rule?.operationId ? operations.find((item) => item.id === rule.operationId) ?? null : null;
    const flag = rule?.flagPattern ? featureFlags.find((item) => rule.flagPattern?.test(item.key)) ?? null : null;

    return {
      key: toSectionKey(responsibility),
      rawLabel: responsibility,
      title: cleanResponsibilityLabel(responsibility),
      summary: buildSummary(responsibility, operation, flag),
      operation,
      flag,
    };
  });
}
