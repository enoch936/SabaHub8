# Enterprise Dynamic Modeling (PlantUML)

Standalone dynamic-model diagrams extracted from `ENTERPRISE_DYNAMIC_MODELING_PLANTUML.md`.

## Files
- `00-candidate-journey-sequence.puml` — End-to-end candidate journey (sequence)
- `10-job-posting-promotion-sequence.puml` — Job posting & promotion (sequence)
- `20-payment-processing-failure-sequence.puml` — Payment processing & failure handling (sequence)
- `30-application-state-machine.puml` — Application state machine (state diagram)
- `40-consent-rtbf-sequence.puml` — Consent & RTBF (sequence)
- `50-api-governance-rate-limiting-sequence.puml` — API governance & rate limiting (sequence)
- `60-observability-signal-flow.puml` — Observability signal flow (interaction)

## Render
From repo root:
- Syntax check: `plantuml -checkonly -failfast2 dynamic/*.puml`
- Generate SVGs into `dynamic/rendered/`: `cd dynamic && plantuml -tsvg -o rendered *.puml`

