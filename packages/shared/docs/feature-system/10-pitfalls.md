# 10 — Conventions & common pitfalls

## Conventions
- Use enum integers in DB, map to human names in UI using the canonical `FeatureData.ts`.
- Maintain a small `diceId` enum/table for dice mapping.
- Use CharacterFeatureChoice as the single source of truth for player decisions.
- Treat `FeatureModifierCondition` as runtime-only checks; `appliesIfChoiceKey/Value` are build-time choice checks.

## Common pitfalls
- **Hard-coding feature slugs**: avoid logic keyed on specific slugs. Use data-driven tokens or `appliesIfChoice` semantics.
- **Mixing build-time and runtime checks**: `appliesIfChoice*` is for choices saved at advancement time; `conditions` are for runtime state.
- **Ignoring progression overwrite rule**: remember to pick the progression with the highest `level <= classLevel`.
- **Not centralizing tokens**: mismatched strings between UI and engine cause silent failures.
- **Overloading `appliesTo` strings**: prefer `appliesTo` (enum) + `appliesToId` (id) mapping to domain tables.
