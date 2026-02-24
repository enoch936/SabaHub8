# Enterprise C4 Diagrams (PlantUML)

Standalone PlantUML sources generated from `ENTERPRISE_C4_DIAGRAMS_PLANTUML.md`.

Diagrams use the built-in PlantUML standard library `C4` includes, so rendering works **offline** (no `!includeurl` required).

## Files
- `00-context.puml` — C4 Context diagram
- `10-container.puml` — C4 Container diagram
- `11-container-multi-tenant.puml` — C4 Multi-tenant container view
- `20-scenario-candidate-application-lifecycle.puml` — Scenario sequence
- `21-scenario-employer-job-posting-promotion.puml` — Scenario sequence
- `30-privacy-consent-flow.puml` — Privacy/RTBF sequence
- `40-observability-coverage.puml` — Observability coverage (C4 containers)
- `50-external-api-integration-rules.puml` — Partner governance sequence
- `60-executive-overview.puml` — Executive overview (single page)
- `70-component-identity-access.puml` — Component diagram
- `71-component-job-posting.puml` — Component diagram
- `72-component-applications-hiring.puml` — Component diagram
- `73-component-billing-subscription.puml` — Component diagram
- `74-component-messaging-notification.puml` — Component diagram
- `75-component-analytics-insights.puml` — Component diagram
- `76-component-security-compliance.puml` — Component diagram
- `77-component-admin-ops.puml` — Component diagram
- `78-component-public-api-platform.puml` — Component diagram
- `79-component-devsecops-observability.puml` — Component diagram
- `80-component-privacy-consent.puml` — Component diagram
- `81-component-exception-edge.puml` — Component diagram

## Render
From repo root:
- Syntax check: `plantuml -checkonly -failfast2 c4_duagram/*.puml`
- Generate SVGs into `c4_duagram/rendered/`: `cd c4_duagram && plantuml -tsvg -o rendered *.puml`

## Notes
- If your PlantUML distribution does not ship the `C4` stdlib, install/update PlantUML or vendor C4 includes locally.
