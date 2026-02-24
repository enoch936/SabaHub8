# Enterprise Activity Diagrams (PlantUML)

Standalone PlantUML activity-diagram sources aligned with `ENTERPRISE_ACTIVITY_DIAGRAMS_PLANTUML.md`.

## Files
- `00-common-auth-mfa.puml` — Authentication & MFA sub-activity
- `01-common-audit-event.puml` — Audit/logging sub-activity
- `02-common-notification-delivery.puml` — Notification delivery + fallback sub-activity
- `10-user-registration-signin.puml` — User registration & sign-in (MFA + audit)
- `20-employer-job-posting-lifecycle.puml` — Employer job posting lifecycle (parallel billing + notifications)
- `30-candidate-application-lifecycle.puml` — Candidate application lifecycle (async notifications)
- `40-billing-subscription.puml` — Billing & subscription (payment exception handling)
- `50-api-partner-access.puml` — Partner API access (governance + audit)
- `60-multi-tenant-isolation-access.puml` — Multi-tenant isolation & access (tenant RBAC)
- `70-security-monitoring-incident-response.puml` — Security monitoring & incident response (parallel remediation)

## Render
From repo root:
- Syntax check: `plantuml -checkonly -failfast2 activity-diagrams/*.puml`
- Generate SVGs into `activity-diagrams/rendered/`: `cd activity-diagrams && plantuml -tsvg -o rendered *.puml`

