# Feature System Documentation (Feature / FeatureProgression / FeatureModifier)

This package documents the **Feature** model and related tables (FeatureProgression, FeatureModifier, FeatureModifierCondition, FeatureChoice, FeaturePrerequisite, FeatureSpecialEffect) and the enums defined in `FeatureData.ts`.

Files in this package:
- [01-overview.md](01-overview.md) — High-level overview and design assumptions
- [02-schema-map.md](02-schema-map.md) — Quick schema map for the Prisma models
- [03-enums.md](03-enums.md) — Enumerations (int codes) used by the schema
- [04-resolution.md](04-resolution.md) — Canonical algorithm for resolving which progressions and modifiers apply
- [05-conditions.md](05-conditions.md) — Condition semantics and runtime matching tokens
- [06-choices-allocations.md](06-choices-allocations.md) — FeatureChoice and Allocation behavior
- [07-examples.md](07-examples.md) — Concrete examples (Bard, Rogue, Monk, Barbarian, Ranger, Racial features, Fighter bonus feats)
- [08-ui-agent-guidance.md](08-ui-agent-guidance.md) — Guidance for UI components and LLM agents
- [09-appendix-tokens.md](09-appendix-tokens.md) — Recommended runtime tokens / tags
- [10-pitfalls.md](10-pitfalls.md) — Conventions and pitfalls to avoid
- [11-stacking-rules.md](11-stacking-rules.md) — Bonus stacking rules implementation
- [12-special-effects.md](12-special-effects.md) — FeatureSpecialEffect usage patterns
- [13-touch-attacks.md](13-touch-attacks.md) — Touch attack AC calculations

Use `01-overview.md` as the place to start.

> Package note: This documentation is derived from your schema and enum definitions. If the schema or enums change, update the corresponding files.
