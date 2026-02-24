# Enterprise Activity Diagrams (PlantUML)

This document provides enterprise-grade activity diagrams aligned with the SabaHub use cases. Each diagram is self-contained and ready to render in any PlantUML-compatible tool.

---

## 1) Common Sub-Activities (Reusable)

```plantuml
@startuml
'-----------------------
' Sub-activities
'-----------------------
skinparam activity {
  BackgroundColor #EFEFEF
  BorderColor #2B2B2B
  BackgroundColor<<failure>> #FFEEEE
}

' Authentication & MFA
|Auth|
start
:Validate credentials;
if (MFA enabled?) then (yes)
  :Challenge MFA;
  :Verify MFA token;
endif
stop

' Logging / Audit
|Audit|
start
:Record audit event;
stop

' Notification Delivery
|Notify|
start
:Resolve template;
:Check user preferences;
if (Allowed channel?) then (yes)
  :Send message;
  if (Delivery failed?) then (yes)
    :Fallback channel <<failure>>;
    :Retry delivery <<failure>>;
  endif
else (no)
  :Skip delivery <<failure>>;
endif
:Log delivery status;
stop
@enduml
```

---

## 2) User Registration & Sign-In (with Sub-Activities & Audit)

```plantuml
@startuml
skinparam linetype ortho
skinparam activity {
  BackgroundColor #F6F8FA
  BorderColor #2B2B2B
  BackgroundColor<<failure>> #FFEEEE
}
|User|
start
:User enters email & password;
if (Existing account?) then (no)
  |Identity Service|
  :Create user profile;
  :Send verification email;
  if (MFA required?) then (yes)
    |Auth|
    :Validate credentials;
    if (MFA enabled?) then (yes)
      :Challenge MFA;
      :Verify MFA token;
    endif
  endif
else (yes)
  |Identity Service|
  |Auth|
  :Validate credentials;
  if (MFA enabled?) then (yes)
    :Challenge MFA;
    :Verify MFA token;
  endif
endif
|Audit|
:Record audit event;
stop
@enduml
```

---

## 3) Employer Job Posting Lifecycle (Parallel Promotions & Notifications)

```plantuml
@startuml
skinparam linetype ortho
skinparam activity {
  BackgroundColor #FFFFFF
  BorderColor #333333
  BackgroundColor<<failure>> #FFEEEE
}
|Employer|
start
:Create job draft;
|Job Service|
:Validate job fields;
if (Compliance required?) then (yes)
  |Compliance|
  :Submit for compliance review;
  if (Approved?) then (yes)
    |Job Service|
    :Proceed;
  else (no)
    |Employer|
    :Return to draft <<failure>>;
    stop
  endif
endif
|Job Service|
:Publish job;
:Index in search;
fork
  |Billing|
  if (Promoted?) then (yes)
    :Charge promotion;
    :Boost visibility;
  endif
fork again
  |Notification Service|
  :Resolve template;
  :Check user preferences;
  if (Allowed channel?) then (yes)
    :Send message;
    if (Delivery failed?) then (yes)
      :Fallback channel <<failure>>;
      :Retry delivery <<failure>>;
    endif
  else (no)
    :Skip delivery <<failure>>;
  endif
  :Log delivery status;
end fork
stop
@enduml
```

---

## 4) Candidate Application Lifecycle (with Async Notifications)

```plantuml
@startuml
skinparam linetype ortho
skinparam activity {
  BackgroundColor #F2F2F2
  BorderColor #2B2B2B
  BackgroundColor<<failure>> #FFEEEE
}
|Job Seeker|
start
:Search job;
:Open job details;
:Submit application;
:Upload resume & documents;
|Applications Service|
:Application received;
fork
  |Notification Service|
  :Notify employer;
fork again
  |Notification Service|
  :Notify candidate;
  :Resolve template;
  :Check user preferences;
  if (Allowed channel?) then (yes)
    :Send message;
    if (Delivery failed?) then (yes)
      :Fallback channel <<failure>>;
      :Retry delivery <<failure>>;
    endif
  else (no)
    :Skip delivery <<failure>>;
  endif
  :Log delivery status;
end fork
|Applications Service|
:Begin screening;
if (Shortlisted?) then (yes)
  :Schedule interview;
  :Conduct interview;
  if (Offer decision?) then (offer)
    :Prepare offer;
    :Send offer;
    if (Offer accepted?) then (yes)
      :Hire candidate;
    else (no)
      :Close application <<failure>>;
    endif
  else (reject)
    :Reject application <<failure>>;
  endif
else (no)
  :Reject application <<failure>>;
endif
stop
@enduml
```

---

## 5) Billing & Subscription (with Exception Handling)

```plantuml
@startuml
skinparam linetype ortho
skinparam activity {
  BackgroundColor #F6F8FA
  BorderColor #2B2B2B
  BackgroundColor<<failure>> #FFEEEE
}
|Employer|
start
:Employer selects plan;
|Billing Service|
:Create subscription;
:Generate invoice;
:Process payment;
if (Payment success?) then (yes)
  :Activate subscription;
  :Update billing history;
else (no)
  :Record payment failure <<failure>>;
  |Notification Service|
  :Notify employer;
  :Resolve template;
  :Check user preferences;
  if (Allowed channel?) then (yes)
    :Send message;
    if (Delivery failed?) then (yes)
      :Fallback channel <<failure>>;
      :Retry delivery <<failure>>;
    endif
  else (no)
    :Skip delivery <<failure>>;
  endif
  :Log delivery status;
  |Audit|
  :Record audit event;
endif
stop
@enduml
```

---

## 6) API Partner Access (with Governance & Audit)

```plantuml
@startuml
skinparam linetype ortho
skinparam activity {
  BackgroundColor #F6F8FA
  BorderColor #2B2B2B
  BackgroundColor<<failure>> #FFEEEE
}
|Partner|
start
:Partner calls API endpoint;
|API Gateway|
:Authenticate API key;
:Validate API version;
:Check quota & rate limits;
if (Allowed?) then (yes)
  |API Platform|
  :Process request;
  fork
    |Audit|
    :Record audit event;
  fork again
    |API Platform|
    :Return response;
  end fork
else (no)
  :Return 429/403 <<failure>>;
  |Audit|
  :Record audit event;
endif
stop
@enduml
```

---

## 7) Multi-Tenant Isolation & Access (with Compliance Notes)

```plantuml
@startuml
skinparam linetype ortho
skinparam activity {
  BackgroundColor #FFFFFF
  BorderColor #333333
  BackgroundColor<<failure>> #FFEEEE
}
|User|
start
:User authenticates;
|Identity Service|
:Resolve tenant context;
:Evaluate tenant RBAC;
note right
  All actions are tenant-isolated.
  Audit logging required per GDPR/PCI.
end note
if (Authorized?) then (yes)
  |Data Layer|
  :Route to tenant partition;
  :Read/Write tenant data;
else (no)
  |Identity Service|
  :Deny access <<failure>>;
  |Audit|
  :Record audit event;
endif
stop
@enduml
```

---

## 8) Security Monitoring & Incident Response (with Parallel Remediation)

```plantuml
@startuml
skinparam linetype ortho
skinparam activity {
  BackgroundColor #F2F2F2
  BorderColor #2B2B2B
  BackgroundColor<<failure>> #FFEEEE
}
|Security Operations|
start
:Monitor security events;
if (Threat detected?) then (yes)
  :Create incident;
  :Trigger alerting;
  fork
    |Security Operations|
    :Start containment actions;
  fork again
    |DevOps|
    if (Requires rollback?) then (yes)
      :Execute rollback;
    endif
  end fork
  |Security Operations|
  :Perform remediation;
  :Close incident;
  |Audit|
  :Record audit event;
else (no)
  :Continue monitoring;
endif
stop
@enduml
```
