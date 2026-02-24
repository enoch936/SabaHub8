# Enterprise C4 Diagrams (PlantUML)

This document provides a full enterprise-grade C4 conversion (Context, Container, and Component views) for SabaHub.

## Coverage Traceability (Use Cases → C4)

The following matrix ensures every use case and specialized view from the enterprise use case catalog is represented in the C4 model.

| Use Case Area | Covered By C4 View(s) |
| --- | --- |
| Enterprise Context (Level 0) | Context Diagram (actors + external systems) |
| Business Capabilities (Level 1) | Container Diagram (service boundaries) |
| System Use Cases (Level 2) | Container Diagram (service responsibilities) |
| Identity & Access | Component: Identity & Access Service |
| Job Posting | Component: Job Posting Service |
| Applications & Hiring (Exec/Operational) | Component: Applications & Hiring Service |
| Billing & Subscription | Component: Billing & Subscription Service |
| Security & Compliance | Component: Security & Compliance Service |
| Admin & Operations | Component: Admin & Operations Service |
| Analytics & Insights (Exec/Operational) | Component: Analytics & Insights Service |
| Messaging & Notification | Component: Messaging & Notification Service |
| Exception & Edge Cases | Component: Exception & Edge Case Handling |
| Actor Hierarchy & Specialization | Context Diagram (actors) |
| Multi-Tenant Platform | Container Diagram (Admin & Operations + Identity) |
| Enterprise Integrations | Context + Container (external systems + API Platform) |
| DevSecOps & Observability | Component: DevSecOps & Observability Platform |
| Privacy & Consent | Component: Privacy & Consent Module |
| Employer Job Post Lifecycle | Component: Job Posting Service |
| Candidate Application Lifecycle | Component: Applications & Hiring Service |
| Public API Platform | Component: Public API Platform |
| Multi-Tenant Partitioning (Explicit) | Multi-Tenant Container Diagram |
| Scenario Data/Event Flows | Sequence Diagrams (Scenarios) |
| Privacy & Consent Flows | Sequence Diagram (Privacy & RTBF) |
| Observability Coverage | Observability Coverage Diagram |
| External API Integration Rules | Sequence Diagram (Partner API Governance) |
| Executive Overview | Executive Overview Diagram |

---

## Scenarios and Use Case Realizations

Scenarios are concrete instances of a use case, describing a major set of actions that occur in a specific situation. Use case realizations capture these scenarios as a graphical sequence of events (sequence diagram) or collaboration/communication diagram. Each scenario should map back to a use case and reference the responsible C4 container or component.

---

## C4 Context Diagram

```plantuml
@startuml
!include <C4/C4_Context>

LAYOUT_LEFT_RIGHT

Person(jobSeeker, "Job Seeker", "Searches and applies for jobs")
Person(employer, "Employer", "Posts jobs, manages hiring")
Person(recruiter, "Recruiter", "Supports talent acquisition")
Person(admin, "Administrator", "Manages platform, users, and compliance")
Person(support, "Support Agent", "Provides customer support")
Person(financeAdmin, "Finance Admin", "Manages billing & tax")
Person(government, "Government/Compliance", "Regulates and audits platform")
Person(tenantAdmin, "Tenant Admin", "Manages tenant-level configuration")
Person(tenantUser, "Tenant User", "End-user within tenant organization")
Person(partnerAPI, "Partner API Client", "Integrates via public API")

System_Ext(idp, "Identity Provider", "Authentication & SSO")
System_Ext(pay, "Payment Gateway", "Payments and billing")
System_Ext(msg, "Notification Provider", "Email/SMS/Push delivery")
System_Ext(bi, "Analytics/BI", "Reporting and analytics")
System_Ext(ats, "ATS/HRIS", "Recruiting systems")
System_Ext(bgCheck, "Background Check Provider", "Candidate verification")
System_Ext(calendar, "Calendar Provider", "Interview scheduling")
System_Ext(esign, "E-Signature Service", "Offer signing")
System_Ext(crmErp, "CRM/ERP", "Billing & revenue sync")

System(system, "SabaHub Enterprise Platform", "Multi-tenant talent acquisition and hiring platform")

Rel(jobSeeker, system, "Searches and applies")
Rel(employer, system, "Manages jobs and hiring")
Rel(recruiter, system, "Manages candidates")
Rel(admin, system, "Governance and compliance")
Rel(support, system, "Support operations")
Rel(financeAdmin, system, "Billing and tax")
Rel(government, system, "Regulatory oversight")
Rel(tenantAdmin, system, "Tenant configuration")
Rel(tenantUser, system, "Tenant usage")
Rel(partnerAPI, system, "Public API integration")

Rel(system, idp, "SSO/MFA")
Rel(system, pay, "Payments")
Rel(system, msg, "Notifications")
Rel(system, bi, "Analytics")
Rel(system, ats, "Job/candidate sync")
Rel(system, bgCheck, "Background checks")
Rel(system, calendar, "Interview scheduling")
Rel(system, esign, "Offer signatures")
Rel(system, crmErp, "Revenue sync")
@enduml
```

---

## C4 Container Diagram

```plantuml
@startuml
!include <C4/C4_Container>

LAYOUT_LEFT_RIGHT

Person(jobSeeker, "Job Seeker")
Person(employer, "Employer")
Person(recruiter, "Recruiter")
Person(admin, "Administrator")
Person(support, "Support Agent")
Person(financeAdmin, "Finance Admin")
Person(tenantAdmin, "Tenant Admin")
Person(tenantUser, "Tenant User")
Person(partnerAPI, "Partner API Client")
Person(devOps, "DevOps Engineer")

System_Ext(idp, "Identity Provider")
System_Ext(pay, "Payment Gateway")
System_Ext(msg, "Notification Provider")
System_Ext(bi, "Analytics/BI")
System_Ext(ats, "ATS/HRIS")
System_Ext(bgCheck, "Background Check Provider")
System_Ext(calendar, "Calendar Provider")
System_Ext(esign, "E-Signature Service")
System_Ext(crmErp, "CRM/ERP")

System_Boundary(sabaHub, "SabaHub Platform") {
  Container(webApp, "Web Application", "React/TypeScript", "Primary UI for all users")
  Container(mobileApp, "Mobile Application", "iOS/Android", "Mobile experience")
  Container(apiGateway, "API Gateway", "Edge/API", "Auth, routing, rate limits")

  Container(eventBus, "Event Bus", "Kafka/RabbitMQ", "Async event streaming")

  Container(authService, "Identity & Access Service", "Java/Spring", "SSO, MFA, sessions, roles")
  Container(jobService, "Job Posting Service", "Java/Spring", "Job lifecycle management")
  Container(appService, "Applications & Hiring Service", "Java/Spring", "Applications, interviews, offers")
  Container(billingService, "Billing & Subscription Service", "Java/Spring", "Plans, payments, invoices")
  Container(notificationService, "Messaging & Notification Service", "Node.js", "Email/SMS/Push/In-app")
  Container(analyticsService, "Analytics & Insights Service", "Python/ETL", "Dashboards, KPIs, exports")
  Container(complianceService, "Security & Compliance Service", "Java/Spring", "Audit, privacy, reporting")
  Container(adminOpsService, "Admin & Operations Service", "Java/Spring", "Tenants, support, config")
  Container(apiPlatform, "Public API Platform", "REST/Webhooks", "Partner integrations")
  Container(observability, "DevSecOps & Observability", "Platform", "CI/CD, monitoring, logging")

  ContainerDb(authDb, "Auth DB", "PostgreSQL", "User identities and auth data")
  ContainerDb(sessionStore, "Session Store", "Redis", "Session tokens and MFA state")
  ContainerDb(jobDb, "Job DB", "Relational DB", "Job posts and metadata")
  ContainerDb(applicationDb, "Application DB", "Relational DB", "Applications and workflow state")
  ContainerDb(searchIndex, "Search Index", "Elasticsearch", "Job and candidate search")
  ContainerDb(billingDb, "Billing DB", "Relational DB", "Plans, invoices, subscriptions")
  ContainerDb(paymentLogs, "Payment Log Store", "Append-only", "Payment events and disputes")
  ContainerDb(analyticsWarehouse, "Data Warehouse", "Warehouse", "Aggregated analytics data")
  ContainerDb(auditStore, "Audit Log Store", "Immutable Log", "Compliance and audit trails")
  ContainerDb(tenantConfigDb, "Tenant Config Store", "Relational DB", "Tenant isolation & feature flags")
  ContainerDb(blobStore, "Object Storage", "Blob Storage", "Resumes, media, attachments")
}

Rel(jobSeeker, webApp, "Uses")
Rel(jobSeeker, mobileApp, "Uses")
Rel(employer, webApp, "Uses")
Rel(recruiter, webApp, "Uses")
Rel(admin, webApp, "Uses")
Rel(support, webApp, "Uses")
Rel(financeAdmin, webApp, "Uses")
Rel(tenantAdmin, webApp, "Uses")
Rel(tenantUser, webApp, "Uses")
Rel(partnerAPI, apiPlatform, "Integrates")

Rel(webApp, apiGateway, "HTTPS")
Rel(mobileApp, apiGateway, "HTTPS")
Rel(apiGateway, authService, "Auth & identity")
Rel(apiGateway, jobService, "Job operations")
Rel(apiGateway, appService, "Application workflows")
Rel(apiGateway, billingService, "Billing")
Rel(apiGateway, notificationService, "Notifications")
Rel(apiGateway, analyticsService, "Analytics")
Rel(apiGateway, complianceService, "Compliance")
Rel(apiGateway, adminOpsService, "Admin/ops")
Rel(apiGateway, apiPlatform, "Public APIs")

Rel(authService, authDb, "Reads/Writes")
Rel(authService, sessionStore, "Reads/Writes")
Rel(jobService, jobDb, "Reads/Writes")
Rel(appService, applicationDb, "Reads/Writes")
Rel(jobService, searchIndex, "Indexes")
Rel(appService, searchIndex, "Indexes")
Rel(billingService, billingDb, "Reads/Writes")
Rel(billingService, paymentLogs, "Appends")
Rel(analyticsService, analyticsWarehouse, "Reads/Writes")
Rel(complianceService, auditStore, "Reads/Writes")
Rel(adminOpsService, tenantConfigDb, "Reads/Writes")
Rel(jobService, blobStore, "Stores media")
Rel(appService, blobStore, "Stores resumes/docs")

Rel(jobService, eventBus, "Publishes JobCreated/JobUpdated")
Rel(appService, eventBus, "Publishes ApplicationSubmitted/StatusChanged")
Rel(billingService, eventBus, "Publishes PaymentSucceeded/Failed")
Rel(notificationService, eventBus, "Subscribes to notifications")
Rel(analyticsService, eventBus, "Subscribes for analytics")
Rel(complianceService, eventBus, "Subscribes for audit/compliance")
Rel(observability, eventBus, "Subscribes for operational signals")

Rel(authService, idp, "SSO/MFA")
Rel(billingService, pay, "Payments")
Rel(notificationService, msg, "Delivery")
Rel(analyticsService, bi, "Exports")
Rel(apiPlatform, ats, "Job/candidate sync")
Rel(appService, bgCheck, "Background checks")
Rel(appService, calendar, "Scheduling")
Rel(appService, esign, "Offer signing")
Rel(billingService, crmErp, "Revenue sync")

Rel(observability, devOps, "Alerts, incident response")
@enduml
```

---

## C4 Container Diagram (Multi-Tenant View)

```plantuml
@startuml
!include <C4/C4_Container>

LAYOUT_LEFT_RIGHT

Person(tenantAdmin, "Tenant Admin")
Person(tenantUser, "Tenant User")

System_Boundary(sabaHub, "SabaHub Platform") {
  Container(authService, "Identity & Access Service", "Java/Spring", "SSO, MFA, sessions, roles")
  Container(adminOpsService, "Admin & Operations Service", "Java/Spring", "Tenants, support, config")
  Container(jobService, "Job Posting Service", "Java/Spring", "Job lifecycle management")
  Container(appService, "Applications & Hiring Service", "Java/Spring", "Applications, interviews, offers")
  Container(notificationService, "Messaging & Notification Service", "Node.js", "Email/SMS/Push/In-app")

  Container(tenantRbac, "Tenant RBAC", "Policy Engine", "Per-tenant access control")
  ContainerDb(tenantConfigDb, "Tenant Config Store", "Relational DB", "Tenant isolation & feature flags")

  Container_Boundary(tenantA, "Tenant A (Logical Partition)") {
    ContainerDb(jobDbA, "Job DB (Tenant A)", "Relational DB", "Tenant A job data")
    ContainerDb(applicationDbA, "Application DB (Tenant A)", "Relational DB", "Tenant A applications")
    ContainerDb(blobStoreA, "Object Storage (Tenant A)", "Blob Storage", "Tenant A files")
  }

  Container_Boundary(tenantB, "Tenant B (Logical Partition)") {
    ContainerDb(jobDbB, "Job DB (Tenant B)", "Relational DB", "Tenant B job data")
    ContainerDb(applicationDbB, "Application DB (Tenant B)", "Relational DB", "Tenant B applications")
    ContainerDb(blobStoreB, "Object Storage (Tenant B)", "Blob Storage", "Tenant B files")
  }
}

Rel(tenantAdmin, adminOpsService, "Configures tenant")
Rel(tenantUser, authService, "Authenticates")
Rel(authService, tenantRbac, "Evaluates tenant access")
Rel(adminOpsService, tenantConfigDb, "Reads/Writes")

Rel(jobService, jobDbA, "Tenant A scoped")
Rel(appService, applicationDbA, "Tenant A scoped")
Rel(jobService, blobStoreA, "Tenant A scoped")
Rel(appService, blobStoreA, "Tenant A scoped")

Rel(jobService, jobDbB, "Tenant B scoped")
Rel(appService, applicationDbB, "Tenant B scoped")
Rel(jobService, blobStoreB, "Tenant B scoped")
Rel(appService, blobStoreB, "Tenant B scoped")
@enduml
```

---

## Scenario Data & Event Flow Diagrams

### Scenario 1: Candidate Application Lifecycle (End-to-End)

```plantuml
@startuml
actor "Job Seeker" as JS
participant "Web/Mobile UI" as UI
participant "API Gateway" as API
participant "Applications & Hiring Service" as APP
participant "Background Check Provider" as BGC
participant "Calendar Provider" as CAL
participant "E-Signature Service" as ESIGN
participant "Event Bus" as BUS
participant "Notification Service" as NOTIF
participant "Analytics Service" as ANALYTICS

JS -> UI : Submit application
UI -> API : POST /applications
API -> APP : Create application
APP -> BUS : Publish ApplicationSubmitted
BUS -> NOTIF : Notify candidate
BUS -> ANALYTICS : Track application funnel
APP -> BGC : Request background check
BGC --> APP : Check result
APP -> CAL : Schedule interview
CAL --> APP : Interview confirmed
APP -> ESIGN : Send offer for signature
ESIGN --> APP : Offer signed
APP -> BUS : Publish OfferAccepted
BUS -> NOTIF : Notify employer/candidate
BUS -> ANALYTICS : Update hiring metrics
@enduml
```

### Scenario 2: Employer Job Posting & Promotion

```plantuml
@startuml
actor "Employer" as EMP
participant "Web UI" as UI
participant "API Gateway" as API
participant "Job Posting Service" as JOB
participant "Search Index" as SEARCH
participant "Billing Service" as BILL
participant "Event Bus" as BUS
participant "Notification Service" as NOTIF

EMP -> UI : Create/Publish job
UI -> API : POST /jobs
API -> JOB : Create job
JOB -> SEARCH : Index job
JOB -> BUS : Publish JobCreated
BUS -> NOTIF : Notify followers
JOB -> BILL : Charge promotion (if paid)
BILL -> BUS : Publish PaymentSucceeded/Failed
BUS -> NOTIF : Notify employer
@enduml
```

---

## Privacy & Consent Flow Diagram

```plantuml
@startuml
actor "Job Seeker" as JS
participant "Privacy & Consent Module" as CONSENT
participant "Security & Compliance Service" as COMP
database "Auth DB" as AUTHDB
database "Application DB" as APPDB
database "Object Storage" as BLOB
database "Analytics Warehouse" as DWH
participant "Analytics Service" as ANALYTICS
participant "Notification Service" as NOTIF

JS -> CONSENT : Capture consent
CONSENT -> COMP : Store consent policy
COMP -> ANALYTICS : Allow analytics processing
COMP -> NOTIF : Allow notifications

JS -> CONSENT : Right-to-be-Forgotten request
CONSENT -> COMP : Validate request
COMP -> AUTHDB : Delete identity data
COMP -> APPDB : Delete application data
COMP -> BLOB : Delete resumes/docs
COMP -> DWH : Purge analytics records
COMP -> ANALYTICS : Confirm purge
@enduml
```

---

## Observability Coverage Diagram

```plantuml
@startuml
!include <C4/C4_Container>

LAYOUT_LEFT_RIGHT

System_Boundary(sabaHub, "SabaHub Platform") {
  Container(apiGateway, "API Gateway", "Edge/API", "Auth, routing, rate limits")
  Container(authService, "Identity & Access Service", "Java/Spring", "SSO, MFA, sessions, roles")
  Container(jobService, "Job Posting Service", "Java/Spring", "Job lifecycle management")
  Container(appService, "Applications & Hiring Service", "Java/Spring", "Applications, interviews, offers")
  Container(billingService, "Billing & Subscription Service", "Java/Spring", "Plans, payments, invoices")
  Container(notificationService, "Messaging & Notification Service", "Node.js", "Email/SMS/Push/In-app")
  Container(analyticsService, "Analytics & Insights Service", "Python/ETL", "Dashboards, KPIs, exports")
  Container(complianceService, "Security & Compliance Service", "Java/Spring", "Audit, privacy, reporting")
  Container(adminOpsService, "Admin & Operations Service", "Java/Spring", "Tenants, support, config")
  Container(observability, "DevSecOps & Observability", "Platform", "Logs, metrics, traces")
}

Rel(apiGateway, observability, "Logs/Metrics/Traces")
Rel(authService, observability, "Logs/Metrics/Traces")
Rel(jobService, observability, "Logs/Metrics/Traces")
Rel(appService, observability, "Logs/Metrics/Traces")
Rel(billingService, observability, "Logs/Metrics/Traces")
Rel(notificationService, observability, "Logs/Metrics/Traces")
Rel(analyticsService, observability, "Logs/Metrics/Traces")
Rel(complianceService, observability, "Audit Events/Alerts")
Rel(adminOpsService, observability, "Logs/Metrics/Traces")
@enduml
```

---

## External API Integration Rules (Partner Governance)

```plantuml
@startuml
actor "Partner API Client" as PARTNER
participant "API Gateway" as API
participant "Public API Platform" as APIP
participant "API Versioning" as VER
participant "Usage Policies" as POL
participant "Rate Limits" as RATE
participant "API Audit" as AUDIT
participant "ATS/HRIS" as ATS

PARTNER -> API : GET /v2/jobs
API -> APIP : Route request
APIP -> VER : Validate version
APIP -> POL : Check quota/policy
APIP -> RATE : Enforce limits
RATE --> APIP : Allow/deny
APIP -> AUDIT : Log usage
APIP -> ATS : Sync job catalog
ATS --> APIP : Response
APIP --> API : Response
API --> PARTNER : Response

note right of RATE
On limit violation:
- Return 429
- Retry-After header
end note
@enduml
```

---

## Executive Overview Diagram (Single-Page)

```plantuml
@startuml
!include <C4/C4_Container>

LAYOUT_LEFT_RIGHT

Person(jobSeeker, "Job Seeker")
Person(employer, "Employer")
Person(admin, "Administrator")

System_Boundary(sabaHub, "SabaHub Platform") {
  Container(apiGateway, "API Gateway", "Edge/API", "Unified entry")
  Container(jobService, "Job Posting", "Service", "Jobs")
  Container(appService, "Applications", "Service", "Hiring workflows")
  Container(billingService, "Billing", "Service", "Payments")
  Container(notificationService, "Notifications", "Service", "Email/SMS/Push")
  Container(analyticsService, "Analytics", "Service", "KPIs & reports")
  Container(adminOpsService, "Admin & Ops", "Service", "Tenants & config")
  Container(eventBus, "Event Bus", "Streaming", "Async events")
}

Rel(jobSeeker, apiGateway, "Uses")
Rel(employer, apiGateway, "Uses")
Rel(admin, adminOpsService, "Governs")
Rel(apiGateway, jobService, "Routes")
Rel(apiGateway, appService, "Routes")
Rel(apiGateway, billingService, "Routes")
Rel(jobService, eventBus, "Publishes")
Rel(appService, eventBus, "Publishes")
Rel(billingService, eventBus, "Publishes")
Rel(eventBus, notificationService, "Notifies")
Rel(eventBus, analyticsService, "Feeds analytics")
Rel(adminOpsService, eventBus, "Controls rollout")
@enduml
```

---

## C4 Component Diagrams

### Identity & Access Service

```plantuml
@startuml
!include <C4/C4_Component>

Container(authService, "Identity & Access Service", "Java/Spring", "SSO, MFA, sessions, roles") {
  Component(signUp, "Sign Up", "Registration")
  Component(signIn, "Sign In", "Authentication")
  Component(mfa, "MFA Orchestrator", "Second-factor enforcement")
  Component(passwordReset, "Password Reset", "Credential recovery")
  Component(sessionMgmt, "Session Management", "Token/session lifecycle")
  Component(roleMgmt, "Role & Permission Management", "RBAC/ABAC")
  Component(ssoIntegration, "SSO Integration", "SAML/OIDC adapters")
  Component(loginAudit, "Audit Login Events", "Security audit trail")
}

Rel(signIn, mfa, "Extends")
Rel(signIn, sessionMgmt, "Includes")
Rel(signIn, loginAudit, "Includes")
Rel(ssoIntegration, signIn, "Includes")
Rel(signIn, passwordReset, "Includes")
@enduml
```

### Job Posting Service

```plantuml
@startuml
!include <C4/C4_Component>

Container(jobService, "Job Posting Service", "Java/Spring", "Job lifecycle") {
  Component(jobManager, "Job Manager", "Create/update/close")
  Component(draftManager, "Draft Manager", "Draft save/restore")
  Component(jobPromotion, "Promotion Engine", "Paid boosts")
  Component(mediaManager, "Media Manager", "Media attachments")
  Component(complianceChecker, "Compliance Checker", "Policy validation")
  Component(notificationTrigger, "Notification Trigger", "Job updates")
}

Rel(jobManager, draftManager, "Includes")
Rel(jobManager, complianceChecker, "Includes")
Rel(jobManager, mediaManager, "Includes")
Rel(jobPromotion, jobManager, "Extends")
Rel(jobManager, notificationTrigger, "Triggers")
@enduml
```

### Applications & Hiring Service

```plantuml
@startuml
!include <C4/C4_Component>

Container(appService, "Applications & Hiring Service", "Java/Spring", "Applications and hiring") {
  Component(submitApp, "Submit Application", "Intake")
  Component(uploadDocs, "Upload Resume/Docs", "Document handling")
  Component(trackStatus, "Track Application Status", "Lifecycle tracking")
  Component(reviewApps, "Review Applications", "Employer review")
  Component(shortlist, "Shortlist Candidate", "Candidate selection")
  Component(scheduleInterview, "Schedule Interview", "Calendar orchestration")
  Component(sendOffer, "Send Offer", "Offer management")
  Component(rejectApp, "Reject Application", "Rejection workflow")
  Component(notifyCandidate, "Notify Candidate", "Messaging hook")
}

Rel(submitApp, uploadDocs, "Includes")
Rel(reviewApps, notifyCandidate, "Includes")
Rel(shortlist, notifyCandidate, "Includes")
Rel(scheduleInterview, notifyCandidate, "Includes")
Rel(sendOffer, notifyCandidate, "Includes")
Rel(rejectApp, notifyCandidate, "Includes")
@enduml
```

### Billing & Subscription Service

```plantuml
@startuml
!include <C4/C4_Component>

Container(billingService, "Billing & Subscription Service", "Java/Spring", "Plans, payments, invoices") {
  Component(choosePlan, "Choose Plan", "Plan selection")
  Component(startSubscription, "Start Subscription", "Activation")
  Component(upgradePlan, "Upgrade/Downgrade Plan", "Plan changes")
  Component(cancelSubscription, "Cancel Subscription", "Cancellations")
  Component(payInvoice, "Pay Invoice", "Payment processing")
  Component(processRefunds, "Process Refunds & Disputes", "Refunds")
  Component(viewBillingHistory, "View Billing History", "Invoices")
  Component(taxMgmt, "Handle Tax/VAT", "Tax engine")
}

Rel(startSubscription, payInvoice, "Includes")
Rel(upgradePlan, payInvoice, "Includes")
Rel(cancelSubscription, viewBillingHistory, "Includes")
@enduml
```

### Messaging & Notification Service

```plantuml
@startuml
!include <C4/C4_Component>

Container(notificationService, "Messaging & Notification Service", "Node.js", "Email/SMS/Push/In-app") {
  Component(emailSender, "Send Email", "Email delivery")
  Component(smsSender, "Send SMS", "SMS delivery")
  Component(pushSender, "Send Push Notification", "Push delivery")
  Component(inAppMsg, "In-App Messaging", "In-app messages")
  Component(notificationPrefs, "Notification Preferences", "User preferences")
  Component(templateMgmt, "Template Management", "Templates")
  Component(fallbackHandler, "Fallback Notification", "Retries/fallback")
}

Rel(templateMgmt, emailSender, "Includes")
Rel(templateMgmt, smsSender, "Includes")
Rel(templateMgmt, pushSender, "Includes")
Rel(inAppMsg, notificationPrefs, "Extends")
Rel(fallbackHandler, emailSender, "Retries")
Rel(fallbackHandler, smsSender, "Retries")
Rel(fallbackHandler, pushSender, "Retries")
@enduml
```

### Analytics & Insights Service

```plantuml
@startuml
!include <C4/C4_Component>

Container(analyticsService, "Analytics & Insights Service", "Python/ETL", "Dashboards, KPIs, exports") {
  Component(viewDashboard, "View Dashboard", "KPIs and metrics")
  Component(generateReports, "Generate Reports", "Report engine")
  Component(exportData, "Export Data", "BI exports")
  Component(predictiveInsights, "Predictive Insights", "ML insights")
  Component(dataQualityMonitor, "Data Quality Monitor", "Validation")
  Component(configureKPIs, "Configure KPIs", "KPI setup")
}

Rel(generateReports, exportData, "Includes")
Rel(predictiveInsights, viewDashboard, "Extends")
@enduml
```

### Security & Compliance Service

```plantuml
@startuml
!include <C4/C4_Component>

Container(complianceService, "Security & Compliance Service", "Java/Spring", "Audit, privacy, reporting") {
  Component(securityPolicies, "Configure Security Policies", "Policy management")
  Component(monitorSecurity, "Monitor Security Events", "Event monitoring")
  Component(reviewAuditLogs, "Review Audit Logs", "Audit review")
  Component(auditAlerting, "Audit Alerting", "Policy violation alerts")
  Component(dataRetention, "Data Retention & Purge", "Retention controls")
  Component(consentMgmt, "Consent & Privacy Management", "Consent handling")
  Component(regulatoryReporting, "Regulatory Reporting", "Compliance reports")
  Component(incidentResponse, "Incident Response", "Incident handling")
}

Rel(monitorSecurity, reviewAuditLogs, "Includes")
Rel(incidentResponse, reviewAuditLogs, "Includes")
Rel(auditAlerting, incidentResponse, "Escalates to")
Rel(consentMgmt, regulatoryReporting, "Includes")
@enduml
```

### Admin & Operations Service

```plantuml
@startuml
!include <C4/C4_Component>

Container(adminOpsService, "Admin & Operations Service", "Java/Spring", "Tenants, support, config") {
  Component(userMgmt, "Manage Users & Roles", "User administration")
  Component(tenantMgmt, "Manage Tenants/Organizations", "Multi-tenant config")
  Component(tenantIsolation, "Tenant Isolation Controls", "Schema/partitioning policies")
  Component(contentModeration, "Moderate Content", "Content safety")
  Component(supportTicketing, "Handle Support Tickets", "Support workflow")
  Component(systemConfig, "Configure System Settings", "Configuration")
  Component(featureFlagConfig, "Tenant Feature Flags", "Tenant-specific flags")
  Component(healthMonitor, "Monitor Health & SLAs", "Monitoring")
  Component(deployRollback, "Deploy & Rollback", "Release operations")
  Component(featureFlags, "Feature Flags & Experiments", "Experimentation")
}

Rel(healthMonitor, deployRollback, "Includes")
@enduml
```

### Public API Platform

```plantuml
@startuml
!include <C4/C4_Component>

Container(apiPlatform, "Public API Platform", "REST/Webhooks", "Partner integrations") {
  Component(apiCredentials, "Obtain API Credentials", "Key issuance")
  Component(apiKeyMgmt, "Manage API Keys", "Key rotation")
  Component(apiVersioning, "API Versioning", "Versioned endpoints")
  Component(usagePolicies, "Usage Policies", "Quota and usage rules")
  Component(jobCatalog, "Access Job Catalog", "Job endpoints")
  Component(submitApplications, "Submit Applications", "Application endpoints")
  Component(webhooks, "Webhook Subscription", "Event delivery")
  Component(rateLimits, "Rate Limit Management", "Abuse protection")
  Component(apiAudit, "Audit API Usage", "Usage logging")
}

Rel(jobCatalog, rateLimits, "Includes")
Rel(submitApplications, rateLimits, "Includes")
Rel(apiVersioning, jobCatalog, "Applies")
Rel(apiVersioning, submitApplications, "Applies")
Rel(usagePolicies, rateLimits, "Governs")
Rel(webhooks, apiAudit, "Includes")
@enduml
```

### DevSecOps & Observability Platform

```plantuml
@startuml
!include <C4/C4_Component>

Container(observability, "DevSecOps & Observability", "Platform", "CI/CD, monitoring, logging") {
  Component(ciCd, "CI/CD Pipeline", "Build and deploy")
  Component(iac, "Infrastructure as Code", "Provisioning")
  Component(secretsMgmt, "Secrets Management", "Credential vault")
  Component(vulnScan, "Vulnerability Scanning", "Security scans")
  Component(perfMonitoring, "Performance Monitoring", "APM/metrics")
  Component(logAggregation, "Log Aggregation", "Centralized logs")
  Component(alerting, "Alerting & Incident Mgmt", "Alerts and response")
  Component(releaseGov, "Release Governance", "Approvals and policy")
  Component(autoRollback, "Automated Rollback", "Rollback on failed scans")
}

Rel(vulnScan, releaseGov, "Includes")
Rel(alerting, releaseGov, "Includes")
Rel(vulnScan, autoRollback, "Triggers on failure")
Rel(autoRollback, ciCd, "Executes rollback")
@enduml
```

### Privacy & Consent Module

```plantuml
@startuml
!include <C4/C4_Component>

Container(complianceService, "Security & Compliance Service", "Java/Spring", "Privacy and consent") {
  Component(captureConsent, "Capture Consent", "Consent capture")
  Component(dataAccess, "Manage Data Access Requests", "DSAR workflows")
  Component(rtbf, "Right to be Forgotten", "Data erasure")
  Component(dataExport, "Data Export", "User export")
  Component(pia, "Privacy Impact Assessment", "Risk assessment")
}

Rel(dataAccess, dataExport, "Includes")
@enduml
```

### Exception & Edge Case Handling

```plantuml
@startuml
!include <C4/C4_Component>

Container(notificationService, "Messaging & Notification Service", "Node.js", "Fallback and resilience") {
  Component(paymentFailure, "Payment Failure Handling", "Billing retry/compensation")
  Component(otpFailure, "Invalid/Expired OTP", "OTP validation errors")
  Component(duplicatePrevention, "Duplicate Application Prevention", "Idempotency")
  Component(rateLimit, "Rate Limit & Abuse Prevention", "Throttling")
  Component(fallbackNotify, "Fallback Notification", "Channel fallback")
}

Rel(paymentFailure, fallbackNotify, "Includes")
Rel(otpFailure, fallbackNotify, "Includes")
Rel(duplicatePrevention, fallbackNotify, "Includes")
Rel(rateLimit, fallbackNotify, "Includes")
@enduml
```
