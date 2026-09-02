# Class and Race Feature System Refactoring

*Architectural overview of the refactoring to move rule-related fields from Class and Race models into the feature system.*

## Goals and Benefits

This refactoring unifies all rule-related information through the feature system, providing significant architectural benefits:

### Unified Architecture

- **Single Source of Truth**: All mechanical effects flow through the feature system
- **Consistent Patterns**: Same patterns for all character mechanics (class, race, feat, domain, etc.)
- **Simplified Logic**: No special cases for different source types

### Simplified Variant Classes

- **First-Order Classes**: Variants are regular classes with shared progressions
- **No Override System**: Eliminates complex ClassVariant model and resolution logic
- **Clone Workflow**: Intuitive "clone from base class" feature for creating variants
- **Easier Maintenance**: One class system instead of two (base + variant)

### Easier Gestalt/Multiclass

- **Automatic Resolution**: Feature resolution handles merging automatically
- **No Merge Logic**: No explicit field-by-field merge code needed
- **Consistent Behavior**: Gestalt rules applied uniformly through feature system

### Better Data Efficiency

- **Reusable Progressions**: Progressions can be shared across multiple classes
- **No Duplication**: Shared progressions stored once, referenced many times
- **Fork When Needed**: Option to create class-specific copies when variants need different values

## Architecture Changes

### Database Schema

**Historical Note**: This document describes the migration to the feature system. Since this migration, `Feature` and `FeatureProgression` have been merged into a single `Feature` model. The current schema uses `FeatureClassMap` and `FeatureRaceMap` for many-to-many relationships.

**New Models (Historical):**
- `FeatureProgressionClassMap` - Many-to-many relationship for reusable progressions (now `FeatureClassMap`)

**Modified Models (Historical):**
- `FeatureProgression` - Added `classes` relationship for many-to-many support (now merged into `Feature`)
- `Class` - Added `sharedFeatureProgressions` relationship (now `sharedFeatures` via `FeatureClassMap`)

**Deprecated Models (to be removed in Phase 4):**
- `ClassVariant` - Variants become regular classes

### Feature System Extensions

**New Entity Types:**
- `HitDie` - EntityType for hit die size
- `BABProgression` - EntityType for BAB progression type
- `SaveProgression` - EntityType for save progression
- `CastingAbility` - EntityType for casting ability
- `CastingType` - EntityType for casting type
- `Size` - EntityType for creature size
- `Speed` - EntityType for base speed
- `FavoredClass` - EntityType for favored class
- `LevelAdjustment` - EntityType for level adjustment

**Note**: `SkillPoints` is already supported via the feature system.

### Shared Atomic Mechanics Features

Class mechanics are moving out of per-class `class-mechanics-*` containers into first-class features linked through `FeatureClassMap`. Each feature has a single `EntityType.Base` entity. Classes that share a progression point at the same feature instead of copying the formula.

**BAB catalog (all 3.5 PHB classes):**

- `good-bab` — Barbarian, Fighter, Paladin, Ranger (`LINEAR_SCALING`, value 1)
- `average-bab` — Bard, Cleric, Druid, Monk, Rogue (`LEVEL_TIMES_VALUE`, value 0.75)
- `poor-bab` — Sorcerer, Wizard (`LEVEL_TIMES_VALUE`, value 0.5)

**Save / hit die / skill points prototype (Wizard and Sorcerer only):**

- `good-will-save`, `bad-will-save`, `good-fort-save`, `bad-fort-save`, `good-ref-save`, `bad-ref-save`
- `hit-die-d4` (`RpgDice.D4` is 0; treat as a real die, not empty)
- `skill-points-2`

Other 3.5 classes still keep Fort/Ref/Will, hit die, and skill points on their `class-mechanics-*` containers. 3.0 PHB rows stay on the dummy `class-mechanics` template (id 21329).

**Resolution:** Character resolution loads `FeatureClassMap` links and attributes BAB/saves to the intersection of those class IDs and the character's actual class levels. A shared feature such as `poor-bab` linked to Wizard and Sorcerer only contributes for the class the character has. Formula results of 0 (poor BAB or poor saves at level 1) are stored in `resolvedFormulaValues`.

**Data script:** [`apps/backend/scripts/split-shared-class-mechanics.ts`](../../../apps/backend/scripts/split-shared-class-mechanics.ts) creates the atomic features, links PHB BAB and Wizard/Sorcerer saves, removes BAB entities from leftover containers, and unlinks Wizard/Sorcerer from `class-mechanics-21359`. Review and run it manually; do not apply it as a Prisma migration.

### Spellcasting Integration

**Approach 1 (Initial Implementation):**
- Link `SpellcastingProgression` to classes via `Feature` (via FeatureClassMap)
- Maintains `SpellcastingProgression` and `SpellcastingSlot` models
- Easier migration and better performance

**TODO: Future Enhancement - Approach 2:**
- Replace `SpellcastingProgression`/`SpellcastingSlot` with `FeatureEntity` formulas
- Complete unification through feature system
- Consider after Phase 4 is complete and stable
- See: [Spellcasting Analysis](../class-system/spellcasting-system.md#future-enhancements) for details

## Migration Strategy

The refactoring is implemented in four phases to ensure data integrity and minimize risk:

### Phase 1: FeatureProgression Many-to-Many Support
- Add `FeatureProgressionClassMap` model (now `FeatureClassMap`)
- Update queries to support both direct and many-to-many patterns
- Add clone and fork functionality
- **Status**: ✅ Complete (Note: Feature and FeatureProgression have since been merged into unified Feature model)

### Phase 2: Variant-to-Class Migration
- Convert existing `ClassVariant` entries to regular `Class` entries
- Create progression sharing relationships
- **Status**: Pending Phase 1 completion

### Phase 3: Spellcasting via Feature Links
- Link `SpellcastingProgression` to classes via `Feature` (via FeatureClassMap)
- Migrate existing spellcasting data
- **Status**: Pending Phase 1 completion

### Phase 4: Remove Direct Class/Race Field Access
- Remove deprecated database fields
- Update all code to use feature system exclusively
- **Status**: Pending Phases 1-3 completion and validation

**Critical Principle**: Database fields and relations CANNOT be removed until migrations to new models are successfully completed.

## Future Enhancements

### FeatureEntity Formulas for Spellcasting

**Status**: Deferred to future phase

**Considerations:**
- Requires formula system extensions
- More complex migration
- Performance implications
- UI complexity for formula editing

**When to Consider:**
- After Phase 4 is complete and stable
- If maximum flexibility is needed
- If formula system is extended to support spellcasting patterns
- If performance with formula caching is acceptable

**Documentation**: See [Spellcasting System Analysis](../class-system/spellcasting-system.md#future-enhancements)

## Related Documentation

### System-Specific Documentation

- **[Class System](../class-system/README.md)** - Class system implementation
- **[Variant Class System](../variant-class-system/README.md)** - Variant class system (being migrated)
- **[Feature System](../feature-system/README.md)** - Feature system architecture
- **[Spellcasting System](../class-system/spellcasting-system.md)** - Spellcasting mechanics

### Implementation Guides

- **[Migration Guide](../class-system/migration-guide.md)** - Step-by-step migration process
- **[Database Schema](../class-system/database-schema.md)** - Database structure and relationships

## Implementation Status

- ✅ **Phase 1**: Database schema updated, backend services implemented, API endpoints added
- ⏳ **Phase 1**: Frontend UI updates in progress
- ⏳ **Phase 1**: Documentation updates in progress
- ⏳ **Shared atomic mechanics**: Resolution and extractors support first-class BAB/save features. Data script is ready; remaining classes still use `class-mechanics-*` containers for saves/HD/skill points
- ⏸️ **Phase 2**: Pending Phase 1 completion
- ⏸️ **Phase 3**: Pending Phase 1 completion
- ⏸️ **Phase 4**: Pending Phases 1-3 completion
