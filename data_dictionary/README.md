# Enterprise Data Dictionary (SabaHub)

Standalone visuals and artifacts generated from `ENTERPRISE_DATA_DICTIONARY.md`.

## Diagrams
- `00-platform-erd-overview.puml` — Cross-domain ER overview (high level)
- `10-identity-access-erd.puml` — Identity & access entities (tenant, users, sessions, roles)
- `20-job-hiring-erd.puml` — Job & hiring entities (company, jobs, applications, interviews, offers)
- `30-billing-erd.puml` — Billing entities (plans, subscriptions, invoices, payments)
- `40-notifications-erd.puml` — Notification entities (templates, preferences, delivery records)
- `50-analytics-compliance-erd.puml` — Audit & consent entities
- `60-integrations-public-api-erd.puml` — Public API + integrations entities
- `70-governance-classification-erd.puml` — Data governance entities

## Render
From repo root:
- Syntax check: `plantuml -checkonly -failfast2 data_dictionary/*.puml`
- Generate SVGs into `data_dictionary/rendered/`: `cd data_dictionary && plantuml -tsvg -o rendered *.puml`

