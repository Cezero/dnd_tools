# 07 — Concrete examples

This section shows how to model common D&D 3.5 features using the schema.

---

## Example: Bard — Inspire Greatness (temporary hit dice)

**Goal**: While Inspire Greatness is active, targets gain +2d10 temporary hit dice.

**Data model**
- `Feature`:
  - `slug`: `inspire-greatness`
  - `name`: Inspire Greatness
- `FeatureProgression` (granted by Bard at level 13)
- `FeatureModifier` on that progression:
  - `type` = `Quantity` (1)
  - `appliesTo` = `HitDice` (5)
  - `value` = `2` (number of dice)
  - `appliesToId` = `RpgDice.D10` (3) from CommonData.ts
- `FeatureModifierCondition`:
  - `conditionType` = `trigger` (0)
  - `conditionValue` = `inspire_greatness_active`

**Runtime**: when token `inspire_greatness_active` exists on the target, add 2d10 temporary HP.

---

## Example: Rogue — Sneak Attack (bonus damage dice)

**Goal**: Add N d6 when attack qualifies as sneak attack.

**Data model**
- `Feature`: `sneak-attack`
- Multiple `FeatureProgression` rows for level milestones (1→1d6, 3→2d6, 5→3d6, ...)
- `FeatureModifier` (for 3d6 milestone):
  - `type` = `Quantity` (1)
  - `appliesTo` = `Damage` (7)
  - `value` = `3`
  - `appliesToId` = `RpgDice.D6` (1) from CommonData.ts
- Condition:
  - `conditionType` = `attack_type` (1)
  - `conditionValue` = `sneak_attack`

**Runtime**: when attack has tag `sneak_attack`, add 3d6.

---

## Example: Monk — Unarmed Strike (replacement damage die)

**Options**
1. **Replacement**: progression grants a `FeatureModifier` with `type = Other` and `appliesTo = Damage` and `appliesToId = d8` and condition `attack_type = unarmed`. Runtime respects replacement semantics (replace base weapon dice).
2. **Augment**: use `Quantity` to add dice, or use special convention and engine logic.

---

## Example: Barbarian — Rage scaling (overwrite progression entries)

**Model**
- `Feature` slug `rage`.
- `FeatureProgression` rows:
  - level 1: STR+4, CON+4, Will+2, AC-2
  - level 11: STR+6, CON+6, Will+3, AC-2
  - level 20: STR+8, CON+8, Will+4, AC-2
- Each progression has `FeatureModifier` rows for those bonuses:
  - `type` = `Bonus` (0)
  - `appliesTo` = `Attribute` (0) with `appliesToId = 1` (STR)
  - `value` = 4 (or 6, 8)
  - `bonusType` = `Morale` (3) for Rage bonuses

**Runtime**: choose progression with largest level ≤ class level and apply its modifiers.

---

## Example: Ranger — Favored Enemy & bonus allocation

**Model**
- `Feature` `favored-enemy-choice`: a choice progression at levels 1,5,10,15,20 where each progression offers a `FeatureChoice` to pick an enemy type.
- `Feature` `favored-enemy-bonus-allocation`: progressions at 5,10,15,20 with `FeatureChoice.choiceBehavior = Allocation` (pick which favored enemy receives extra +2).
- `FeatureModifier` for baseline favored enemy bonus:
  - `type` = `Bonus`
  - `appliesTo` = `Attack` or `Skill`
  - `appliesIfChoiceKey` = `'favored_enemy'` and `appliesIfChoiceValue` = enemy key
- Allocation +2:
  - Implemented as `FeatureModifier` attached to allocation progression and gated with `appliesIfChoiceKey`/`appliesIfChoiceValue` matching the saved allocation.

**Runtime**: CharacterFeatureChoice rows indicate which enemies are chosen and which allocations were assigned.

---

## Example: Magic Items — Ring of Protection, Belt of Giant Strength

**Ring of Protection +2**
- `Feature` `ring-of-protection-plus-2`
- `FeatureProgression` (magic item source)
- `FeatureModifier`:
  - `type` = Bonus (0)
  - `appliesTo` = AC (3)
  - `value` = 2
  - `bonusType` = Deflection (7) — applies to touch attacks

**Belt of Giant Strength +4**
- `Feature` `belt-giant-strength-plus-4`
- `FeatureProgression` (magic item source)
- `FeatureModifier`:
  - `type` = Bonus (0)
  - `appliesTo` = Attribute (0)
  - `appliesToId` = 1 (STR)
  - `value` = 4
  - `bonusType` = Enhancement (2) — doesn't stack with other STR enhancement

---

## Example: Fighter — Weapon Proficiency and Bonus Feats

**Fighter weapon proficiencies (Simple + Martial)**
- `Feature` `fighter-weapon-proficiencies`
- Two `FeatureSpecialEffect` rows:
  - `effectType` = Proficiency, `targetId` = `PROFICIENCY_TYPE_ENUM.SIMPLE_WEAPON` (1)
  - `effectType` = Proficiency, `targetId` = `PROFICIENCY_TYPE_ENUM.MARTIAL_WEAPON` (2)

**Fighter bonus feats**
- `Feature` `fighter-bonus-feat`
- `FeatureProgression` rows at levels 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20
- `FeatureChoice` with:
  - `choiceType` = Feat
  - `choiceBehavior` = Single  
  - `appliesToType` = Feat, `appliesTo` = FeatureFeatChoiceFilter.FighterBonus (1)
- Runtime filters feats where `feat.fighterBonus === true`

---

## Example: Races — Gnome (STR-2 / CON+2), Elf proficiencies, bonus languages

**Gnome**
- `Feature` `gnome-ability-adjustments`
- `FeatureProgression` with `raceId = gnome` and `level = 1`
- `FeatureModifier` rows:
  - STR: `type` = Bonus (0), `appliesTo` = Attribute (0), `appliesToId` = 1 (STR from ABILITY_MAP), `value` = -2, `bonusType` = Racial (12)
  - CON: same with `appliesToId` = 3 (CON), `value` = +2, `bonusType` = Racial (12)

**Elf — weapon proficiencies**
- `Feature` `elf-weapon-proficiencies`
- `FeatureSpecialEffect` row with `effectType = Proficiency` and `targetId = PROFICIENCY_TYPE_ENUM.MARTIAL_WEAPON` from ItemData.ts
- Use `FeatureSpecialEffect` for proficiency grants rather than modifiers.

**Elf — bonus languages**
- `Feature` `elf-languages`
- `FeatureProgression` (`raceId` elf)
- `FeatureChoice` with `choiceType` = Language and `choiceBehavior` = Multiple, `pickCount` computed from INT modifier at character creation.
- Player choices reference `LANGUAGE_MAP` keys from CommonData.ts.
