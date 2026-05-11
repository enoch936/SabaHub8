# SabaHub Admin Module Documentation

## 1. What the Admin Looks Like

The Admin area is a full control plane UI built with Next.js App Router and MUI.

Visual style:
- Gradient hero cards for each workspace (Executive, Operations, Platform Systems).
- Persistent left navigation on desktop.
- Temporary slide drawer on mobile/tablet.
- Sticky top app bar with domain badge, live status badge, role chip, theme toggle, and logout.
- Alert chips and status indicators across modules.
- Dense operational tables, action dialogs, runbooks, and feature flag switches.

Core shell behavior:
- Admin layout verifies token validity and session bootstrap before usage.
- Access is role-gated in frontend (redirect non-admin users to forbidden) and backend (controller-level admin checks).
- Dynamic badges for moderation load are computed live from jobs, disputes, and content draft states.

## 2. High-Level Admin Structure

Admin route root: `/admin`

Primary navigation is grouped into 3 domains:

### Executive
- Platform Control (`/admin/platform-control`)
  - Runtime Controls (`section=runtime-controls`)
  - Recovery Operations (`section=recovery-operations`)
- Security Governance (`/admin/security-governance`)
  - Threat Monitoring (`section=threat-monitoring`)
  - Policy Enforcement (`section=policy-enforcement`)
- Analytics and Reporting (`/admin/analytics`)

### Operations
- Users and Access (`/admin/users`)
  - Role Governance
  - Tenant Management (`/admin/tenants`)
- Marketplace Operations (`/admin/jobs`)
  - Proposal Pipeline (`/admin/proposals`)
  - Content Review (`/admin/content`)
  - Dispute Resolution (`/admin/disputes`)
- Content Moderation (`/admin/content-moderation`)
  - Job Moderation (`/admin/jobs`)
  - Policy Content (`/admin/content`)
  - Dispute Cases (`/admin/disputes`)
- Revenue and Risk (`/admin/transactions`)
- Financial Operations (`/admin/financial-operations`)
- Chat Operations (`/admin/chat`)

### Platform Systems
- AI Operations (`/admin/ai-models`)
- Infrastructure and Monitoring (domain-routed)
- Audit and Compliance (`/admin/audit-logs`)

### Dynamic domain routing
Domain-specific pages also resolve through `/admin/domain/[domainId]` and map to specialized workspaces such as:
- `platform-administration`
- `security-monitoring-compliance`
- `multi-tenant-platform-management`
- `payment-financial-oversight`
- `ai-governance-model-management`
- `system-monitoring-health-management`
- `devops-infrastructure-management`
- `api-integration-management`
- `data-management`

## 3. Basic Admin Controls (Day-to-Day)

These are operational controls used most frequently:

### User and access administration
- List users and workspace summaries.
- Create user / edit user / delete user.
- Grant and revoke roles.
- Suspend/reactivate and document verification updates.
- Access profile and security setting updates.

### Marketplace moderation
- List and patch jobs.
- List and patch proposals.
- Moderate content and policy records.
- Handle disputes and status progression.

### Finance queue handling
- Review pending top-ups.
- Review internal transfers.
- Review and update withdrawal states.
- Filter/search all transaction queues.

### Analytics and reporting
- Summary metrics (users, jobs, revenue, open disputes).
- Daily trend data.
- Export JSON/CSV analytics bundles.

### Audit review
- Search and filter audit event stream.
- Inspect actor/entity metadata details in modal dialogs.

## 4. Advanced Admin Controls (Control Plane / Governance)

These are advanced controls intended for platform governance and incident response.

### Command Center operations
- Domain-level metrics and alert surfaces.
- Feature flag governance (toggle and update metadata).
- Runbook execution with dry-run and execute modes.
- Section-level insight endpoints for targeted operational focus.

### Platform Control workspace
- Lane-based operational playbooks (governance, delivery, runtime, edge, resilience).
- Execution operations including deployment, rollback, and infra lifecycle actions.
- Feature flags for platform safety, failover, endpoint security, and DR posture.

### Security Governance workspace
- Threat monitoring and policy enforcement lanes.
- Quick-action security operations:
  - Investigate alerts
  - Monitor security events
  - Review audit logs
  - Enforce MFA policy
  - Configure fraud controls
  - Run privacy compliance checks
- Security-focused feature flag controls.

### AI model operations workspace
- Read AI engine status and model registry.
- Activate model versions.
- Rollback versions.
- Trigger model retraining and runtime reload.
- Import local datasets and inspect dataset statistics.

### Multi-tenant operations
- Tenant create/update/delete.
- Environment provisioning.
- Resource limit management.
- Permission and isolation profile management.
- Tenant lifecycle actions and usage refresh.

## 5. Backend Admin Control Surface (API)

Main secured admin APIs include:

- `/api/admin/command-center/*`
  - Overview, domain views, section insight, feature flag updates, runbook operation execution.
- `/api/admin/users/*`
  - User CRUD, role governance, access control, identity verification, credential reset, warning lifecycle, malicious user control, policy updates.
- `/api/admin/tenants/*`
  - Tenant lifecycle and governance operations.
- `/api/admin/analytics/*`
  - Summary, daily trends, workspace payload, executive report generation, JSON/CSV export.
- `/api/admin/jobs/*`
- `/api/admin/proposals/*`
- `/api/admin/audit-logs`

Additional admin-scoped endpoints used by operations modules:
- `/api/admin/content/*`
- `/api/admin/disputes/*`
- `/api/admin/payments/*`
- `/api/admin/withdrawals/*`
- `/api/admin/wallet/*`

## 6. Admin Security and Role Model

Role checks are enforced in both UI and backend.

Frontend behavior:
- Session bootstrap and token usability check.
- Redirect to login if token/session is invalid.
- Redirect to forbidden if role is not ADMIN in admin shell.

Backend behavior:
- Controllers require admin authorization before action.
- Role set used in multiple admin controllers includes:
  - ADMIN
  - SUPER_ADMIN
  - SUPPORT_ADMIN
  - FINANCE_ADMIN

Auditability:
- Sensitive operations generate audit logs in user and governance controllers.
- Audit workspace enables investigation of actor, entity, and metadata traces.

## 7. Responsiveness and UX Behavior

The admin module has explicit responsive behavior:

- Breakpoint-driven shell:
  - Desktop (`lg` and up): persistent sidebar drawer.
  - Mobile/tablet: temporary drawer that auto-closes on route change.
- Header adapts with responsive spacing and hidden secondary chips on narrow screens.
- Data sections use MUI grid sizing (`xs`, `sm`, `md`, `lg`, `xl`) so cards/tables stack safely on mobile.
- Tabs in moderation use scrollable mode with mobile scroll buttons.
- Wide tables are wrapped with horizontal overflow containers to avoid layout breakage.

Practical result:
- Mobile-first usability for queue reviews and filtering.
- Desktop density for high-volume admin work (tables, charts, runbooks).

## 8. Admin Data Flow

1. UI workspaces call typed API functions from `frontend/src/lib/api.ts`.
2. API client injects bearer token and active role header.
3. Next.js API base `/api` proxies to backend services.
4. Spring controllers enforce role authorization and execute domain services.
5. Returned payloads hydrate dashboards, cards, charts, and data tables.

## 9. Operational Model in This Project

Admin in this project is not a single dashboard only. It is a layered operations model:
- Executive command and governance controls.
- Operational queues and moderation functions.
- Platform engineering and security controls.
- Tenant, finance, AI, and compliance workspaces.

This gives SabaHub a production-style admin architecture where both day-to-day support and advanced platform governance are available in one unified admin plane.

## 10. Quick Capability Checklist

- Command center overview and alert posture: Yes
- Domain-level runbooks and dry-run execution: Yes
- Feature flags with live update: Yes
- User/role/identity/security administration: Yes
- Tenant lifecycle and environment controls: Yes
- Finance queue and withdrawal management: Yes
- Marketplace moderation (jobs/content/disputes): Yes
- AI model governance operations: Yes
- Audit log investigation workspace: Yes
- Responsive desktop/mobile admin shell: Yes
