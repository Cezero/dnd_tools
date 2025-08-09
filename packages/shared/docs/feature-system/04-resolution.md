# 04 — Resolving what applies (canonical algorithm)

Use this algorithm when computing a character's effective modifiers/resources at runtime or when assembling the character sheet.

## 1. Gather character sources
- From `CharacterAdvancement` or the character record, collect each `(classId, classLevel)` pair and the `raceId`.

## 2. Collect candidate progressions
- For each class pair:
  ```sql
  SELECT * FROM FeatureProgression
  WHERE classId = :classId AND level <= :classLevel
  ```
- Group results by `featureId` and keep the row with the **max(level)** per `featureId`.
- Also include `FeatureProgression` rows where `raceId = character.raceId` and `level <= 1`.

## 3. Evaluate prerequisites
- For each candidate progression, evaluate `FeaturePrerequisite[]`.
- If any prerequisite fails (for example `SkillRanks` prereq), exclude the progression.

## 4. Present choices & read saved choices
- If the progression has `FeatureChoice[]`, UI must present options (Single / Multiple / Allocation).
- Persist player choices into `CharacterFeatureChoice` linked to `advancementId`/`progressionId`.
- Some modifiers depend on these choices via `appliesIfChoiceKey`/`appliesIfChoiceValue`.

## 5. Collect modifiers
- For each included progression, load `modifiers[]`.
- For each `FeatureModifier`:
  - If `appliesIfChoiceKey`/`appliesIfChoiceValue` present, ensure the character made that choice (via CharacterFeatureChoice).
  - Evaluate all `FeatureModifierCondition[]` rows; only include the modifier if **all** conditions match the current runtime context or state tokens.

## 6. Runtime event matching
When an event occurs (attack roll, save, skill check, damage calculation):
- Filter modifiers:
  - `modifier.appliesTo` must match the event category (Damage, Attack, Skill, Save, AC, etc).
  - If `appliesToId` is set, it must match the specific instance (skillId, abilityId, diceId).
  - All `conditions` must match the runtime context tokens (attack_type, triggers).
- Combine numeric modifiers using stacking rules (`bonusType` controls stacking). Add dice contributions where present.

## 7. Notes on overwrites
- Because we selected the progression with the highest level ≤ classLevel, features that "upgrade" later override earlier progression entries automatically.
