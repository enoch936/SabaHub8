# Enterprise Dynamic Modeling (PlantUML)

This document provides advanced dynamic models for SabaHub, including sequence, state, and interaction flows suitable for enterprise governance and review.

---

## 1) End-to-End Candidate Journey (Sequence)

```plantuml
@startuml
skinparam linetype ortho
skinparam sequence {
  LifeLineBorderColor #2B2B2B
  LifeLineBackgroundColor #F6F8FA
  ParticipantBorderColor #2B2B2B
}

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
BUS -> ANALYTICS : Track funnel event
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

---

## 2) Job Posting & Promotion (Sequence)

```plantuml
@startuml
skinparam linetype ortho
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

## 3) Payment Processing & Failure Handling (Sequence)

```plantuml
@startuml
skinparam linetype ortho
actor "Employer" as EMP
participant "Billing Service" as BILL
participant "Payment Gateway" as PAY
participant "Event Bus" as BUS
participant "Notification Service" as NOTIF
participant "Audit Log" as AUDIT

EMP -> BILL : Pay invoice
BILL -> PAY : Create charge
alt Payment success
  PAY --> BILL : Payment succeeded
  BILL -> BUS : Publish PaymentSucceeded
  BUS -> NOTIF : Send receipt
  BILL -> AUDIT : Record success
else Payment failed
  PAY --> BILL : Payment failed
  BILL -> BUS : Publish PaymentFailed
  BUS -> NOTIF : Notify failure
  BILL -> AUDIT : Record failure
end
@enduml
```

---

## 4) Application State Machine (State)

```plantuml
@startuml
skinparam linetype ortho
skinparam state {
  BackgroundColor #FFFFFF
  BorderColor #333333
}

[*] --> Draft
Draft --> Submitted : submit
Submitted --> UnderReview : review
UnderReview --> Shortlisted : shortlist
UnderReview --> Rejected : reject
Shortlisted --> InterviewScheduled : scheduleInterview
InterviewScheduled --> Offered : sendOffer
Offered --> Hired : acceptOffer
Offered --> Rejected : declineOffer
Hired --> [*]
Rejected --> [*]
@enduml
```

---

## 5) Consent & RTBF (Sequence)

```plantuml
@startuml
skinparam linetype ortho
actor "Job Seeker" as JS
participant "Privacy & Consent" as CONSENT
participant "Security & Compliance" as COMP
database "Auth DB" as AUTHDB
database "Application DB" as APPDB
database "Object Storage" as BLOB
database "Analytics Warehouse" as DWH

JS -> CONSENT : Submit consent
CONSENT -> COMP : Record consent

JS -> CONSENT : RTBF request
CONSENT -> COMP : Validate request
COMP -> AUTHDB : Delete identity data
COMP -> APPDB : Delete application data
COMP -> BLOB : Delete documents
COMP -> DWH : Purge analytics
COMP --> JS : Confirmation
@enduml
```

---

## 6) API Governance & Rate Limiting (Sequence)

```plantuml
@startuml
skinparam linetype ortho
actor "Partner API Client" as PARTNER
participant "API Gateway" as API
participant "API Platform" as APIP
participant "API Versioning" as VER
participant "Usage Policy" as POLICY
participant "Rate Limiter" as RATE
participant "API Audit" as AUDIT

PARTNER -> API : GET /v2/jobs
API -> APIP : Route request
APIP -> VER : Validate version
APIP -> POLICY : Check quota
APIP -> RATE : Enforce limits
alt Allowed
  RATE --> APIP : Allow
  APIP -> AUDIT : Log usage
  APIP --> API : Response
  API --> PARTNER : 200 OK
else Blocked
  RATE --> APIP : Deny
  APIP -> AUDIT : Log denial
  APIP --> API : 429/403
  API --> PARTNER : 429/403
end
@enduml
```

---

## 7) Observability Signal Flow (Interaction)

```plantuml
@startuml
skinparam linetype ortho
participant "API Gateway" as API
participant "Job Service" as JOB
participant "Applications Service" as APP
participant "Billing Service" as BILL
participant "Notifications Service" as NOTIF
participant "Observability Stack" as OBS

API -> OBS : logs/metrics/traces
JOB -> OBS : logs/metrics/traces
APP -> OBS : logs/metrics/traces
BILL -> OBS : logs/metrics/traces
NOTIF -> OBS : logs/metrics/traces
@enduml
```
