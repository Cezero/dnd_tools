# Class Proficiencies

How weapon and armor proficiencies are stored, displayed, and applied to attack math.

## Canonical Model

Same split as [class skills](class-skills.md): class grants are base mechanics; feat grants are Other modifiers.

| Source | Entity type | `appliesTo` | Typical feature |
|--------|-------------|-------------|-----------------|
| Class (and race) | `@EntityType.Base` (4) | `@EntityAppliesToType.Proficiency` (36) | `{ClassName} Proficiencies` (`slug: class-{classId}-proficiencies`) |
| Feat (Simple Weapon Proficiency, armor feats, and similar) | `@EntityType.Other` (3) | `@EntityAppliesToType.Proficiency` (36) | Feat feature linked via `featId` |

Fields are the same for both:

- **`appliesToId`**: proficiency type from `@PROFICIENCY_TYPE_ENUM` (1 simple weapon, 2 martial weapon, 3 exotic weapon, 4–8 armor/shield).
- **`appliesToSubId`**: `-1` (or null) means the whole category (`all simple weapons`, and so on). A positive id is a specific item (Wizard quarterstaff is item 39).

The class editor writes **Base only**. See `apps/frontend/src/features/class/ClassProficiencyService.ts` and `apps/frontend/src/features/class/tabs/ProficienciesTab.tsx`. The entity editor can author either type; class vs feat is chosen by `sourceType`, not by accepting leftover Other class rows.

## Runtime Readers

`isCanonicalProficiencyGrant` (`packages/shared/static-data/src/FeatureData.ts`) is the only match rule:

- Class or race + `EntityType.Base` + Proficiency
- Feat + `EntityType.Other` + Proficiency

Leftover class features named `Class Proficiency` (`sourceType` Class, `EntityType.Other`) do **not** count. Attack math, sheet display, and available-feat filtering all use this helper.

- **`extractProficiencies`** (`apps/frontend/src/lib/attack-calculation/proficiencies.ts`): collects weapon categories, armor categories, and specific item ids. `isProficientWithWeapon` uses this; a miss applies the −4 non-proficient penalty in `apps/frontend/src/lib/character-calculation/calculations/combatValues.ts`.
- **`formatProficiencies`** (`apps/frontend/src/lib/formatters/characterSheetDisplayStrategy.ts`): Proficiencies section on the sheet.
- **`availableFeatService`** (`apps/backend/src/features/characterResolution/availableFeatService.ts`): category (`appliesToSubId === -1`) grants hide feats that would grant the same “all” proficiency.

`featBenefitResolver` stays Other-only: it resolves **feat** entities, not class chassis grants.

## Examples

**Fighter** (`Fighter Proficiencies`): six Base entities, all `appliesToSubId: -1` (simple weapons, martial weapons, light/medium/heavy armor, shields).

**Wizard** (`Wizard Proficiencies`): five Base entities with specific item ids (club, dagger, quarterstaff, light crossbow, heavy crossbow). Wizards are not proficient with all simple weapons.

**Simple Weapon Proficiency feat**: Other entity, `appliesToId` simple weapon, `appliesToSubId: -1`.

## Leftover Data

Older Other features named `Class Proficiency` were removed: unlinked from `FeatureClassMap`, then the Feature and FeatureEntity rows were deleted. Classes keep a single Base `{Class} Proficiencies` feature. Feat-granted Other proficiency features (`sourceType` Feat) were not changed. New class proficiency data must be Base.

## Cross-System References

- [Class Skills](class-skills.md) — same Base-vs-Other pattern for class skills vs skill grants
- [Attack Calculation](../character-management/attack-calculation.md) — non-proficient −4 and `extractProficiencies`
- [Static Data](static-data.md) — `@EntityType`, `@EntityAppliesToType.Proficiency`, `@PROFICIENCY_TYPES`
- Source: `packages/shared/static-data/src/FeatureData.ts` (Base and Other both list Proficiency)
