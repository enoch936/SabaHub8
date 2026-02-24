# Enterprise Class Model (PlantUML)

Standalone PlantUML class-model diagrams extracted from `ENTERPRISE_CLASS_MODEL_PLANTUML.md`.

## Files
- `00-domain-services-core-entities.puml` — Domain services & core entities (identity, tenant, job, hiring, billing, notifications, compliance)
- `10-public-api-governance.puml` — Public API governance classes (clients, keys, policies, logging)

## Render
From repo root:
- Syntax check: `plantuml -checkonly -failfast2 class_modell/*.puml`
- Generate SVGs into `class_modell/rendered/`: `cd class_modell && plantuml -tsvg -o rendered *.puml`

