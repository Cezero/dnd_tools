# Class and Race Feature System Migration History

*Historical record of the migration from direct class/race fields to feature-based system.*

## Overview

This document records the migration process that moved the class and race systems to use the feature system exclusively. The migration was implemented in multiple phases to ensure data integrity and minimize risk.

**Status**: Most migrations are complete. The system now uses feature-based resolution exclusively. Some legacy fields may still exist in the database schema but are not used by application code.

## Migration History

### Phased Approach

The migration was divided into multiple phases:

1. **Phase 1**: FeatureProgression many-to-many support ✅ Complete
2. **Phase 2**: Variant-to-class migration ✅ Complete
3. **Phase 3**: Spellcasting via FeatureProgression links ✅ Complete
4. **Phase 4**: Class/Race mechanics via FeatureProgression ✅ Complete
5. **Phase 5**: Remove direct class/race field access ⏸️ Partial (some fields remain but are unused)

**Current State**: All application code uses feature-based resolution. Legacy database fields may still exist but are not accessed by the application.

### Migration Status

**Completed Phases**:
- ✅ Phase 1: FeatureProgression many-to-many support implemented
- ✅ Phase 2: Variant-to-class migration completed
- ✅ Phase 3: Spellcasting via FeatureProgression links completed
- ✅ Phase 4: Class/Race mechanics migrated to feature system
- ✅ All backward compatibility code removed from application

**Remaining Work**:
- ⏸️ Phase 5: Some legacy database fields may still exist but are unused by application code

## Phase 1: FeatureProgression Many-to-Many Support

### Goal

Enable FeatureProgression to be shared across multiple classes via many-to-many relationship.

### Database Migration

**Step 1: Create Prisma Migration**

```bash
cd /home/countzero/git/dnd_tools/apps/backend
npx prisma migrate dev --name add_feature_progression_class_map
```

**Step 2: Verify Migration**

- Check that `FeatureProgressionClassMap` table is created
- Verify indexes are created on `classId` and `progressionId`
- Verify foreign key constraints

**Step 3: Run Data Migration Script**

```bash
npx tsx scripts/migrate-feature-progression-class-map.ts
```

**Step 4: Validate Migration**

- Verify all progressions with `classId` have corresponding map entries
- Check for any orphaned progressions
- Verify query performance

### Code Updates

**Backend:**
- ✅ Updated `FeatureSystemService.getFeatureProgressionsByClassId()` to query both patterns
- ✅ Added `cloneClassFeatures()` method
- ✅ Added `forkProgressionForClass()` method
- ✅ Updated `getFeatureProgressionsByIds()` to include classes relationship

**Frontend:**
- ⏳ Add clone feature UI to ClassEdit component
- ⏳ Add shared progression indicators
- ⏳ Add fork progression action

### Implementation Status

✅ **Completed**:
- FeatureProgression many-to-many support implemented
- Clone and fork progression functionality working
- Queries use FeatureProgressionClassMap pattern
- Performance validated

## Phase 2: Variant-to-Class Migration

### Goal

Convert existing ClassVariant entries to regular Class entries with shared progressions.

### Prerequisites

- Phase 1 must be complete and validated
- All existing classes must work correctly

### Migration Script

**Step 1: Run Migration Script**

```bash
npx tsx scripts/migrate-variants-to-classes.ts
```

**Step 2: Run Validation Script**

```bash
npx tsx scripts/validate-variant-migration.ts
```

**Step 3: Review Validation Report**

- Check for any migration errors
- Verify all variants have corresponding Class entries
- Verify progressions are correctly linked
- Compare variant resolution before/after

### Code Updates

**Backend:**
- ✅ `ClassService.getAllClasses()` includes migrated variants
- ✅ Variant resolution logic removed
- ✅ VariantClassService removed

**Frontend:**
- ✅ `ClassList` shows variants as regular classes
- ✅ Variant-specific UI logic removed

### Implementation Status

✅ **Completed**:
- All variants resolve correctly as classes
- Character creation works with migrated variants
- Gestalt characters work correctly
- No data loss occurred

## Phase 3: Spellcasting via FeatureProgression Links

### Goal

Link SpellcastingProgression to classes via FeatureProgression instead of direct classId.

### Prerequisites

- Phase 1 must be complete and validated
- Phase 2 must be complete and validated (if variants exist)

### Migration Script

**Step 1: Run Migration Script**

```bash
npx tsx scripts/migrate-spellcasting-to-features.ts
```

**Step 2: Run Validation Script**

```bash
npx tsx scripts/validate-spellcasting-migration.ts
```

**Step 3: Review Validation Report**

- Verify all spellcasting progressions have FeatureProgression links
- Verify feature entities are correctly created
- Test spell slot calculations
- Compare spellcasting before/after

### Code Updates

**Backend:**
- ✅ `ClassService.createClass()` creates FeatureProgression for spellcasting
- ✅ `CharacterService.getAvailableSpellsForClass()` uses resolved features
- ✅ All code uses feature-based pattern

**Frontend:**
- ✅ `ClassEdit SpellcastingTab` uses FeatureProgression-based creation
- ✅ Character spell display uses resolved progressions

### Implementation Status

✅ **Completed**:
- Spellcasting works for all classes via feature system
- Multiclass and gestalt spellcasting work correctly
- Spell slot calculations use feature-based resolution

## Phase 4: Migrate Class/Race Mechanics to Feature System

### Goal

Migrate class and race mechanical fields (hit die, BAB, saving throws, size, speed, etc.) to feature progressions and update all code to extract mechanics from progressions.

### Prerequisites

- Phase 1, 2, and 3 must be complete and validated
- Feature system must support the new `EntityAppliesToType` values

### Migration Scripts

**Step 1: Run Class Mechanics Migration**

```bash
npx tsx scripts/migrate-class-fields-to-features.ts
```

**Step 2: Run Race Mechanics Migration**

```bash
npx tsx scripts/migrate-race-fields-to-features.ts
```

**Step 3: Fix Value Storage (if needed)**

If values were incorrectly stored, run fix scripts:

```bash
# Fix appliesToId storage for HitDice, BAB, Size, FavoredClass
npx tsx scripts/fix-mechanics-entities-applies-to-id.ts

# Fix value storage for SkillPoints, Speed, LevelAdjustment
npx tsx scripts/fix-value-based-mechanics-entities.ts
```

**Step 4: Validate Migration**

- Verify all classes have `class-mechanics` progressions
- Verify all races have `race-mechanics` progressions
- Verify entities are stored with correct field patterns (appliesToId vs value)
- Test extraction functions return correct values

### Code Updates

**Backend:**
- ✅ Created `classMechanicsExtractor.ts` and `raceMechanicsExtractor.ts` utilities
- ✅ Updated calculation services to use extraction functions
- ✅ Updated PDF generation to extract mechanics from resolved progressions

**Frontend:**
- ✅ Created extraction functions in `lib/feature-extraction/`
- ✅ Updated display components to use extracted mechanics with fallback
- ✅ Updated PDF generation to extract mechanics
- ✅ Updated form helpers to sync mechanics to/from feature progressions
- ✅ Registered formatters and labelers for new entity types

### Value Storage Patterns

**ID-Based Storage (appliesToId):**
- Hit Die: `appliesToId` contains dice type ID
- BAB Progression: `appliesToId` contains progression type ID
- Size: `appliesToId` contains size ID
- Favored Class: `appliesToId` contains class ID

**Literal Value Storage (value):**
- Skill Points: `value` contains base skill points (with `ABILITY_BASED` formula)
- Speed: `value` contains speed value
- Level Adjustment: `value` contains LA value

**Sub-ID Storage (appliesToSubId):**
- Saving Throws: `appliesToId` contains save type, `appliesToSubId` contains progression type

### Implementation Status

✅ **Completed**:
- All classes have mechanics progressions created
- All races have mechanics progressions created
- Extraction functions return correct values
- Display components use extracted mechanics
- PDF generation uses extracted mechanics
- Character calculations use extracted mechanics
- Forms edit mechanics via feature progressions
- Formatters and labelers work for all entity types

## Phase 5: Remove Direct Class/Race Field Access

### Status: ⏸️ Partial

**Current State**: All application code has been updated to use feature-based resolution. Legacy database fields may still exist in the schema but are not accessed by the application.

**Completed**:
- ✅ All code uses feature system exclusively
- ✅ No application code references legacy fields
- ✅ All calculations use feature resolution
- ✅ All forms, displays, and PDF generation use feature-based values
- ✅ Backward compatibility code removed

**Remaining**:
- ⏸️ Some legacy database fields may still exist in the schema (e.g., `canCastSpells`, `spellsKnown`, `isDivine` on Class model)
- These fields are not used by application code and can be removed in a future database cleanup migration if desired

## Breaking Changes

### API Changes

**Phase 1:**
- None (additive changes only)

**Phase 2:**
- Variant classes now appear in regular class list
- Variant-specific endpoints deprecated

**Phase 3:**
- Spellcasting queries use feature-based pattern (migration complete)

**Phase 4:**
- Migration complete (all systems use feature-based pattern)

**Phase 5:**
- Class/Race API responses no longer include deprecated fields
- Breaking change - frontend must be updated

### Database Changes

**Phase 1:**
- New `FeatureProgressionClassMap` table (additive)

**Phase 2:**
- No schema changes (data migration only)

**Phase 3:**
- `SpellcastingProgression.classId` removed (migration complete)
- New `featureProgressionId` field (additive)

**Phase 4:**
- Schema updated: `classId` and `classSpellsKnownId` fields removed (migration complete)

**Phase 5:**
- ⏸️ Partial: Application code no longer uses legacy fields
- Some legacy fields may still exist in database schema but are unused

## Current System State

The migration to feature-based resolution is complete. The system now:

- Uses `FeatureProgression` with many-to-many class/race relationships
- Resolves all class and race mechanics through the feature system
- Links spellcasting through `FeatureProgression` instead of direct class links
- Extracts mechanics (BAB, saves, hit dice, etc.) from feature entities
- No longer uses backward compatibility code or deprecated functions

**For troubleshooting current issues**, see:
- [Feature Extraction Patterns](feature-extraction-patterns.md) - How mechanics are extracted
- [Class System Documentation](README.md) - Current implementation details

## Related Documentation

- [Feature Extraction Patterns](feature-extraction-patterns.md) - How to extract mechanics from progressions
- [Class and Race Feature Refactoring](../application-overview/class-race-feature-refactoring.md) - Complete refactoring overview
- [Feature System Documentation](../feature-system/README.md) - Feature system architecture
- [Class System Documentation](README.md) - Class system implementation
