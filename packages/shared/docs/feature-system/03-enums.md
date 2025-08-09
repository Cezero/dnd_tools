# 03 — Enums (codes & meaning)

This file lists the enums used by the Feature schema. The integer codes are what is stored in the DB.

> **Note**: Most enums are defined in `@shared/static-data/src/FeatureData.ts` and related files. Always reference the canonical definitions rather than hard-coding values.

## Key References for appliesToId
- **Dice IDs**: Use `RpgDice` enum from `CommonData.ts` (D4=0, D6=1, D8=2, D10=3, D12=4, D20=5, D100=6, D2=7, D3=8)
- **Ability IDs**: Use `ABILITY_MAP` keys (STR=1, DEX=2, CON=3, INT=4, WIS=5, CHA=6)
- **Skill IDs**: Use `SKILL_MAP` keys (1-45 covering all D&D 3.5 skills)
- **Language IDs**: Use `LANGUAGE_MAP` keys for bonus language choices
- **Proficiency IDs**: Use `PROFICIENCY_TYPES` for weapon/armor proficiencies

## FeatureSourceType
- `0` Race
- `1` Class
- `2` Template

## ModifierType
- `0` Bonus — numeric bonus, positive or negative
- `1` Quantity — count/number (used for dice quantity, number of uses in some contexts)
- `2` Uses — resource uses (alternative to Quantity when semantics differ)
- `3` Targets — number of targets affected
- `4` Distance — flat distance values (ft, etc.)
- `5` Other — catch-all for special cases

## ModifierAppliesToType
- `0` Attribute
- `1` Skill
- `2` SavingThrow
- `3` AC
- `4` MovementSpeed
- `5` HitDice
- `6` Attack
- `7` Damage
- `8` Initiative
- `9` Other

## FeatureBonusType (from FeatureData.ts)

### Always Stacking (Add Together)
- `0` Dodge — Always stacks, never from spells/magic items
- `1` Circumstance — Always stacks unless from same source

### Non-Stacking (Highest Applies)
- `2` Enhancement — Weapons, armor, ability scores
- `3` Morale — Hope, courage, determination effects
- `4` Competence — Task performance bonuses
- `5` Alchemical — Nonmagical alchemical substances
- `6` Armor — Physical armor protection
- `7` Deflection — Magical attack deflection (applies to touch)
- `8` Insight — Precognitive knowledge
- `9` Luck — Fortune effects
- `10` Natural Armor — Creature's tough hide
- `11` Profane — Evil-sourced bonuses
- `12` Racial — Innate racial characteristics
- `13` Resistance — Saving throw protection
- `14` Sacred — Good-sourced bonuses
- `15` Shield — Shield protection
- `16` Size — Creature size category effects

### Special
- `17` Other — Custom rules, case-by-case basis

## FeatureAppliesToType (progression-level scoping)
- `0` Skill
- `1` Item
- `2` Language
- `3` Feat
- `4` Other

## FeatureFeatChoiceFilter
- `0` Any
- `1` FighterBonus
- `2` MetamagicOrItemCreation

## FeaturePrerequisiteType
- `0` SkillRanks
- `1` Other

## FeatureModifierConditionType
- `0` trigger
- `1` attack_type
- `2` other

## ChoiceType
- `Feat`
- `Feature`

## ChoiceBehavior
- `Single`
- `Multiple`
- `Allocation`

> Tip: Keep this file current with `FeatureData.ts` — it is the canonical mapping used by UI and runtime code.
