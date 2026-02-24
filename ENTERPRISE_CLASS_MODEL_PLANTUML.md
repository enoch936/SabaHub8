# Enterprise Class Model (PlantUML)

This document provides an enterprise-grade Class Model for SabaHub. It refines domain objects into software classes with responsibilities, key methods, and core relationships.

---

## 1) Domain Services & Core Entities

```plantuml
@startuml
skinparam linetype ortho
skinparam classAttributeIconSize 0
skinparam class {
  BackgroundColor #F6F8FA
  BorderColor #2B2B2B
  ArrowColor #2B2B2B
}

package "Identity" {
  class User {
    +id: UUID
    +email: String
    +status: UserStatus
    +createdAt: DateTime
    +activate(): void
    +suspend(reason: String): void
  }
  class Credential {
    +passwordHash: String
    +lastChangedAt: DateTime
    +verify(raw: String): Boolean
  }
  class Role {
    +name: String
  }
  class Permission {
    +name: String
  }
  class Session {
    +id: UUID
    +expiresAt: DateTime
    +invalidate(): void
  }
}

package "Tenant" {
  class Tenant {
    +id: UUID
    +name: String
    +status: TenantStatus
  }
  class TenantPolicy {
    +policyKey: String
    +policyValue: String
  }
  class FeatureFlag {
    +key: String
    +enabled: Boolean
  }
}

package "Job" {
  class JobPost {
    +id: UUID
    +title: String
    +status: JobStatus
    +publish(): void
    +close(): void
  }
  class JobDraft {
    +id: UUID
    +lastSavedAt: DateTime
    +save(): void
  }
  class Company {
    +id: UUID
    +name: String
  }
}

package "Hiring" {
  class Application {
    +id: UUID
    +status: ApplicationStatus
    +submit(): void
    +reject(): void
  }
  class Interview {
    +id: UUID
    +scheduledAt: DateTime
  }
  class Offer {
    +id: UUID
    +status: OfferStatus
    +send(): void
  }
}

package "Billing" {
  class Subscription {
    +id: UUID
    +status: SubscriptionStatus
    +activate(): void
    +cancel(): void
  }
  class Invoice {
    +id: UUID
    +total: Money
  }
  class Payment {
    +id: UUID
    +status: PaymentStatus
    +capture(): void
  }
}

package "Notifications" {
  class Notification {
    +id: UUID
    +channel: ChannelType
    +status: NotificationStatus
    +send(): void
  }
  class Template {
    +id: UUID
    +name: String
  }
}

package "Compliance" {
  class AuditEvent {
    +id: UUID
    +eventType: String
  }
  class Consent {
    +id: UUID
    +type: ConsentType
  }
}

package "Services" {
  class IdentityService {
    +signIn(email: String, password: String): Session
    +signUp(user: User): User
  }
  class JobService {
    +createJob(job: JobPost): JobPost
    +publishJob(jobId: UUID): void
  }
  class HiringService {
    +submitApplication(app: Application): Application
    +scheduleInterview(appId: UUID, at: DateTime): Interview
  }
  class BillingService {
    +charge(invoiceId: UUID): Payment
  }
  class NotificationService {
    +notify(notification: Notification): void
  }
  class ComplianceService {
    +record(event: AuditEvent): void
    +capture(consent: Consent): void
  }
}

User "1" -- "1" Credential
User "*" -- "*" Role
Role "*" -- "*" Permission
User "1" -- "*" Session
Tenant "1" -- "*" User
Tenant "1" -- "*" TenantPolicy
Tenant "1" -- "*" FeatureFlag

Company "1" -- "*" JobPost
JobPost "1" -- "0..1" JobDraft
JobPost "1" -- "*" Application
Application "1" -- "0..1" Interview
Application "1" -- "0..1" Offer

Subscription "1" -- "*" Invoice
Invoice "1" -- "0..*" Payment

Notification "*" -- "1" Template
AuditEvent "*" -- "1" User
Consent "*" -- "1" User

IdentityService ..> User
IdentityService ..> Session
JobService ..> JobPost
HiringService ..> Application
BillingService ..> Payment
NotificationService ..> Notification
ComplianceService ..> AuditEvent
@enduml
```

---

## 2) Public API Governance Classes

```plantuml
@startuml
skinparam linetype ortho
skinparam classAttributeIconSize 0
skinparam class {
  BackgroundColor #FFFFFF
  BorderColor #333333
  ArrowColor #333333
}

class ApiClient {
  +id: UUID
  +name: String
  +status: ClientStatus
}

class ApiKey {
  +id: UUID
  +keyHash: String
  +status: ApiKeyStatus
}

class ApiVersion {
  +version: String
  +status: VersionStatus
}

class UsagePolicy {
  +policyId: String
  +quota: Integer
}

class ApiRequestLog {
  +id: UUID
  +timestamp: DateTime
  +statusCode: Integer
}

class ApiGovernanceService {
  +validateVersion(version: String): Boolean
  +checkQuota(clientId: UUID): Boolean
  +logRequest(log: ApiRequestLog): void
}

ApiClient "1" -- "*" ApiKey
ApiClient "1" -- "*" UsagePolicy
ApiVersion "1" -- "*" UsagePolicy
ApiRequestLog "*" -- "1" ApiClient
ApiGovernanceService ..> ApiRequestLog
@enduml
```
