# 08 — Guidance for UI components & LLM agents

This section gives actionable instructions for UI and agents that must present features, collect choices, and compute runtime effects.

## Rendering character sheet
1. Resolve progressions (see `04-resolution.md`).
2. Show each `Feature` (name + description).
3. If progression has `choices`, render choice UI:
   - `Single`: radio or select
   - `Multiple`: checkbox list up to `pickCount`
   - `Allocation`: allocation UI (drag/drop, sliders, or list of targets with counts)
4. Persist choices as `CharacterFeatureChoice` rows, associating them with the `advancementId` for that level to support future reassignments.

## Running a combat/skill event
- When an event occurs, build a `runtimeContext` object with:
  - `attackType` (melee/ranged/unarmed/sneak_attack/...)
  - `activeTokens` (strings set by abilities, e.g., `rage_active`)
  - `targetTags` (undead, dragon, etc.)
  - `weaponType`, `skillId`, `abilityId`, etc.
- Query active `FeatureModifier` rows that match the character (resolved progressions) and test each modifier's conditions against the `runtimeContext`.
- Apply numeric modifications with stacking rules and apply dice contributions.

## Natural language tooltips (for agent)
- To generate tooltip text, combine:
  - `Feature.name` and `Feature.description`
  - For each active modifier: a human-friendly phrase from `{type, value, appliesTo, appliesToId, bonusType, conditions}`.
  - Example: `"+2 morale to attack rolls vs. goblinoids (Favored Enemy: Goblinoid)"`.

## Choice filtering (feats)
- Use `FeatureProgression.appliesToType` + `appliesTo` to construct filters for candidate feats:
  - If `appliesToType = Feat` and `appliesTo = FighterBonus`, show feats where `feat.fighterBonus === true`.
  - If `appliesTo` = MetamagicOrItemCreation, filter by `feat.featType` in `{Metamagic, ItemCreation}`.

## Allocation UI contract
- Show the targets (e.g., current favored enemies) derived from existing CharacterFeatureChoice rows.
- Allow assignment of each allocation token; save each assignment as a `CharacterFeatureChoice` record referencing progressionId and choiceId.

## Test cases to verify implementation
- Bard uses Inspire Greatness: targets get temporary HP while the effect token is present.
- Rogue sneak attack: damage includes additional d6s when attack tagged `sneak_attack`.
- Ranger favored enemy: baseline +2 vs chosen enemy, allocation +2 assigned at level 5 can be moved at level 10.
