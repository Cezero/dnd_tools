# Glossary Analysis and Recommended Changes

## Overview

This document analyzes the D&D 3.5 Monster Manual glossary (`util/monster_extractor/output/glossary.html`) and provides recommendations for schema and enum updates.

## 1. Monster Types Analysis

### Current State
The `MonsterTypeId` enum currently includes 16 types, including "Beast" which is **not** in the D&D 3.5 glossary.

### Glossary Types (15 total)
All types from the glossary are present in our enum:
1. ✅ Aberration
2. ✅ Animal
3. ✅ Construct
4. ✅ Dragon
5. ✅ Elemental
6. ✅ Fey
7. ✅ Giant
8. ✅ Humanoid
9. ✅ Magical Beast
10. ✅ Monstrous Humanoid
11. ✅ Ooze
12. ✅ Outsider
13. ✅ Plant
14. ✅ Undead
15. ✅ Vermin

### Recommendation
**Remove "Beast" from `MonsterTypeId` enum** - This type does not exist in D&D 3.5. It may be a 5e type that was incorrectly included. Since it's not used in the schema, this is a safe removal.

## 2. Subtypes Analysis (Currently Called "Keywords")

### Current State
The `MonsterKeywordId` enum currently has 17 subtypes, but the glossary defines **24 subtypes**.

### Missing Subtypes (7 total)
The following subtypes are defined in the glossary but missing from our enum:

1. **Baatezu** - Race of evil outsiders (devils). Traits: Immunity to fire and poison, resistance to acid 10 and cold 10, See in Darkness (Su), Summon (Sp), Telepathy.
2. **Eladrin** - Race of celestials native to Olympian Glades of Arborea. Traits: Resistance to cold 10 and fire 10, Tongues (Su).
3. **Goblinoid** - Stealthy humanoids who live by hunting and raiding, all speak Goblin.
4. **Guardinal** - Race of celestials native to Blessed Fields of Elysium. Traits: Resistance to cold 10 and sonic 10, Lay on Hands (Su), Speak with Animals (Su).
5. **Native** - Subtype for outsiders with mortal ancestors or strong connection to Material Plane. Can be raised/reincarnated/resurrected. Need to eat and sleep.
6. **Reptilian** - Scaly, usually cold-blooded. Only used to describe a set of humanoid races, not all reptiles.
7. **Tanar'ri** - Race of evil outsiders (demons). Traits: Immunity to electricity and poison, resistance to acid 10, cold 10, and fire 10, Summon (Sp).

### Current Subtypes (17 total)
All of these are correctly present:
1. ✅ Aquatic
2. ✅ Air
3. ✅ Angel
4. ✅ Archon
5. ✅ Augmented
6. ✅ Chaotic
7. ✅ Cold
8. ✅ Earth
9. ✅ Evil
10. ✅ Extraplanar
11. ✅ Fire
12. ✅ Good
13. ✅ Incorporeal
14. ✅ Lawful
15. ✅ Shapechanger
16. ✅ Swarm
17. ✅ Water

### Recommendation
**Add the 7 missing subtypes** to the enum and rename `MonsterKeywordId` → `MonsterSubtypeId` throughout the codebase to match D&D 3.5 terminology.

## 3. Nonabilities Handling

### Glossary Definition
Some creatures lack certain ability scores entirely (not 0, but completely absent). The modifier for a nonability is +0, but special rules apply:

- **No Strength**: Can't exert force, auto-fails Strength checks. If it can attack, uses Dex modifier for BAB instead of Str.
- **No Dexterity**: Can't move. If it can perform actions, uses Int modifier for initiative instead of Dex. Auto-fails Reflex saves and Dex checks.
- **No Constitution**: No body or no metabolism. Immune to Fortitude saves (unless effect works on objects or is harmless). Immune to ability damage/drain/energy drain. Auto-fails Constitution checks. Cannot tire.
- **No Intelligence**: Mindless, immunity to mind-affecting effects, auto-fails Intelligence checks. Mindless creatures don't gain feats or skills (except bonus feats or racial skill bonuses).
- **No Wisdom**: Object, not a creature. Also has no Charisma.
- **No Charisma**: Object, not a creature. Also has no Wisdom.

### Current Schema State
The `Monster` model stores ability scores as nullable `Int?` fields:
- `strength Int?`
- `dexterity Int?`
- `constitution Int?`
- `intelligence Int?`
- `wisdom Int?`
- `charisma Int?`

### Recommendation
**Current nullable Int fields are sufficient** - A `null` value can represent a nonability. However, we should:

1. **Document the nonability rules** in the schema documentation
2. **Add validation logic** in the application layer to ensure:
   - If Wisdom is null, Charisma must also be null (and vice versa)
   - If Constitution is null, the creature cannot have a body/metabolism
   - If Intelligence is null, the creature is mindless and has special rules
3. **Consider adding a helper function** to check if an ability is a nonability vs. just low (0-1)

## 4. Naming Convention Change

### Current Naming
- `MonsterKeywordId` enum
- `MonsterKeywordMap` table/model
- `MONSTER_KEYWORD_MAP` constant
- `keywords` relationship in Monster model

### Recommended Naming
- `MonsterSubtypeId` enum
- `MonsterSubtypeMap` table/model
- `MONSTER_SUBTYPE_MAP` constant
- `subtypes` relationship in Monster model

### Rationale
The D&D 3.5 glossary consistently uses the term "subtype" for these creature characteristics. "Keyword" is a more generic term that doesn't match the official terminology.

## 5. Summary of Required Changes

### High Priority
1. ✅ **Rename "Keywords" to "Subtypes"** throughout codebase
   - Rename `MonsterKeywordId` → `MonsterSubtypeId`
   - Rename `MonsterKeywordMap` → `MonsterSubtypeMap`
   - Rename `keywords` relationship → `subtypes`
   - Update all references in code, schema, and documentation

2. ✅ **Add 7 missing subtypes** to the enum:
   - Baatezu
   - Eladrin
   - Goblinoid
   - Guardinal
   - Native
   - Reptilian
   - Tanar'ri

3. ✅ **Remove "Beast" type** from `MonsterTypeId` enum (not in D&D 3.5)

### Medium Priority
4. **Document nonabilities** in schema documentation
5. **Add validation rules** for nonability constraints (Wisdom/Charisma relationship, etc.)

### Low Priority
6. **Add helper functions** for nonability checks in application code

## 6. Implementation Order

1. Add missing subtypes to enum (preserve existing IDs, add new ones)
2. Remove "Beast" type from enum
3. Rename all "Keyword" references to "Subtype"
4. Update documentation
5. Add nonability documentation and validation

## 7. Notes

- The glossary confirms that all 15 monster types are correctly identified
- Subtypes are distinct from types and can be applied to multiple types
- Some subtypes are race-based (Baatezu, Tanar'ri, Angel, Archon, Eladrin, Guardinal)
- Some subtypes are alignment-based (Chaotic, Evil, Good, Lawful)
- Some subtypes are elemental (Air, Earth, Fire, Water, Cold)
- Some subtypes are physical/mechanical (Incorporeal, Swarm, Aquatic, Augmented, Native, Shapechanger)
- Some subtypes are cultural/racial (Goblinoid, Reptilian)

