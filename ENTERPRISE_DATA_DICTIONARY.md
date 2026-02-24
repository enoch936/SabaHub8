# Enterprise Data Dictionary (SabaHub)

This data dictionary defines core entities, attributes, data types, constraints, and governance notes for the SabaHub enterprise platform.

---

## 1) Identity & Access

### 1.1 User
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Unique user identifier |
| email | String | unique, not null | Primary login email |
| status | UserStatus | not null | ACTIVE, SUSPENDED, DELETED |
| createdAt | DateTime | not null | Record creation timestamp |
| tenantId | UUID | FK → Tenant.id | Tenant scope |

### 1.2 Profile
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| userId | UUID | PK/FK → User.id | Profile owner |
| firstName | String | not null | First name |
| lastName | String | not null | Last name |
| phone | String | nullable | E.164 formatted phone |

### 1.3 Session
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Session identifier |
| userId | UUID | FK → User.id | Session owner |
| expiresAt | DateTime | not null | Session expiration |
| revokedAt | DateTime | nullable | Revocation time |

### 1.4 Role
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Role identifier |
| name | String | unique, not null | Role name |

### 1.5 Permission
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Permission identifier |
| name | String | unique, not null | Permission name |

### 1.6 Tenant
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Tenant identifier |
| name | String | unique, not null | Tenant name |
| status | TenantStatus | not null | ACTIVE, SUSPENDED, DELETED |
| createdAt | DateTime | not null | Created timestamp |

### 1.7 TenantPolicy
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Policy identifier |
| tenantId | UUID | FK → Tenant.id | Tenant scope |
| policyKey | String | not null | Policy key |
| policyValue | String | not null | Policy value |

---

## 2) Job & Hiring

### 2.1 Company
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Company identifier |
| name | String | not null | Company name |
| industry | String | nullable | Industry category |
| tenantId | UUID | FK → Tenant.id | Tenant scope |

### 2.2 JobPost
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Job post identifier |
| companyId | UUID | FK → Company.id | Owning company |
| title | String | not null | Job title |
| status | JobStatus | not null | DRAFT, PUBLISHED, CLOSED |
| createdAt | DateTime | not null | Created timestamp |

### 2.3 JobDraft
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Draft identifier |
| jobPostId | UUID | FK → JobPost.id | Job post |
| lastSavedAt | DateTime | not null | Draft last save time |

### 2.4 Application
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Application identifier |
| jobPostId | UUID | FK → JobPost.id | Target job |
| candidateId | UUID | FK → User.id | Candidate user |
| status | ApplicationStatus | not null | SUBMITTED, REVIEW, OFFER, REJECTED |
| submittedAt | DateTime | not null | Submitted timestamp |

### 2.5 Interview
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Interview identifier |
| applicationId | UUID | FK → Application.id | Related application |
| scheduledAt | DateTime | not null | Scheduled time |
| status | InterviewStatus | not null | SCHEDULED, COMPLETED, CANCELED |

### 2.6 Offer
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Offer identifier |
| applicationId | UUID | FK → Application.id | Related application |
| status | OfferStatus | not null | SENT, ACCEPTED, DECLINED |
| issuedAt | DateTime | not null | Offer issue time |

### 2.7 Resume
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Resume identifier |
| applicationId | UUID | FK → Application.id | Related application |
| fileUrl | String | not null | Storage URL |

---

## 3) Billing

### 3.1 Subscription
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Subscription identifier |
| companyId | UUID | FK → Company.id | Owning company |
| status | SubscriptionStatus | not null | ACTIVE, PAST_DUE, CANCELED |
| startedAt | DateTime | not null | Start time |

### 3.2 Plan
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Plan identifier |
| name | String | unique, not null | Plan name |
| price | Money | not null | Plan price |

### 3.3 Invoice
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Invoice identifier |
| subscriptionId | UUID | FK → Subscription.id | Related subscription |
| total | Money | not null | Invoice total |
| status | InvoiceStatus | not null | OPEN, PAID, FAILED |

### 3.4 Payment
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Payment identifier |
| invoiceId | UUID | FK → Invoice.id | Related invoice |
| providerRef | String | not null | Payment provider reference |
| status | PaymentStatus | not null | SUCCEEDED, FAILED, REFUNDED |

---

## 4) Notifications

### 4.1 Notification
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Notification identifier |
| userId | UUID | FK → User.id | Recipient |
| channel | ChannelType | not null | EMAIL, SMS, PUSH |
| status | NotificationStatus | not null | SENT, FAILED, QUEUED |
| templateId | UUID | FK → Template.id | Template used |

### 4.2 NotificationPreference
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| userId | UUID | PK/FK → User.id | User |
| channel | ChannelType | PK | Channel |
| enabled | Boolean | not null | Preference state |

### 4.3 Template
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Template identifier |
| name | String | unique, not null | Template name |
| content | Text | not null | Template body |

---

## 5) Analytics & Compliance

### 5.1 AuditEvent
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Audit event identifier |
| userId | UUID | FK → User.id | Actor |
| eventType | String | not null | Event type |
| createdAt | DateTime | not null | Timestamp |

### 5.2 Consent
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Consent identifier |
| userId | UUID | FK → User.id | User |
| type | ConsentType | not null | GDPR, CCPA, MARKETING |
| grantedAt | DateTime | not null | Consent time |

---

## 6) Integrations & Public API

### 6.1 ApiClient
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Client identifier |
| name | String | not null | Client name |
| status | ClientStatus | not null | ACTIVE, SUSPENDED |

### 6.2 ApiKey
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | API key identifier |
| apiClientId | UUID | FK → ApiClient.id | Owning client |
| keyHash | String | not null | Hashed key |
| status | ApiKeyStatus | not null | ACTIVE, REVOKED |

### 6.3 WebhookSubscription
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Webhook identifier |
| apiClientId | UUID | FK → ApiClient.id | Owning client |
| eventType | String | not null | Subscribed event |
| endpointUrl | String | not null | Webhook endpoint |

### 6.4 ExternalProvider
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Provider identifier |
| name | String | not null | Provider name |
| type | ProviderType | not null | ATS, HRIS, ESIGN |

---

## 7) Data Governance & Classification

### 7.1 DataClassification
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| code | String | PK | PUBLIC, INTERNAL, CONFIDENTIAL, PII |
| description | String | not null | Classification meaning |

### 7.2 DataRetentionPolicy
| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, not null | Retention policy identifier |
| entityName | String | not null | Entity governed |
| retentionDays | Integer | not null | Retention period |
| legalBasis | String | nullable | Legal rationale |
</attachment>