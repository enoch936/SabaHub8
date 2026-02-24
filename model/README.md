# Enterprise Object Model (PlantUML)

Standalone PlantUML object-model diagrams extracted from `ENTERPRISE_OBJECT_MODEL_PLANTUML.md`.

## Files
- `00-core-domain-object-model.puml` — Core domain object model
- `10-multi-tenant-isolation-view.puml` — Multi-tenant object model (isolation view)
- `20-public-api-governance-view.puml` — Public API object model (governance view)

## Render
From repo root:
- Syntax check: `plantuml -checkonly -failfast2 model/*.puml`
- Generate SVGs into `model/rendered/`: `cd model && plantuml -tsvg -o rendered *.puml`

