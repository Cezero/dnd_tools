# Class and Race Feature System Migration Guide

*Step-by-step guide for migrating from direct class/race fields to feature-based system.*

## Overview

This migration guide provides detailed instructions for migrating the class and race systems to use the feature system exclusively. The migration is implemented in four phases to ensure data integrity and minimize risk.

**Critical Principle**: Database fields and relations CANNOT be removed until migrations to new models are successfully completed.

## Migration Strategy

### Phased Approach

The migration is divided into four phases:

1. **Phase 1**: FeatureProgression many-to-many support
2. **Phase 2**: Variant-to-class migration
3. **Phase 3**: Spellcasting via FeatureProgression links
4. **Phase 4**: Remove direct class/race field access

Each phase must be completed and validated before proceeding to the next.

### Validation Requirements

After each phase:
- Run validation scripts
- Test all affected functionality
- Verify data integrity
- Compare before/after behavior
- Document any issues

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

### Validation Checklist

- [ ] All existing classes still work (backward compatibility)
- [ ] Clone feature creates shared progressions correctly
- [ ] Fork feature creates class-specific copies correctly
- [ ] Queries return correct progressions for both patterns
- [ ] Performance is acceptable

### Rollback Procedure

If issues occur:
1. Remove `FeatureProgressionClassMap` entries (data only, keep table)
2. Revert code changes
3. System will work with direct `classId` pattern only

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
- Update `ClassService.getAllClasses()` to include migrated variants
- Deprecate `VariantClassService` (keep for backward compatibility)
- Remove variant resolution logic

**Frontend:**
- Update `ClassList` to show variants as regular classes
- Update `ClassEdit` to add clone feature
- Remove variant-specific UI logic

### Validation Checklist

- [ ] All variants resolve correctly as classes
- [ ] Character creation works with migrated variants
- [ ] Gestalt characters work with migrated variants
- [ ] Character calculations match before/after migration
- [ ] No data loss

### Rollback Procedure

If issues occur:
1. Restore ClassVariant entries from backup
2. Revert code changes
3. System will work with old variant system

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
- Update `ClassService.createClass()` to create FeatureProgression for spellcasting
- Update `CharacterService.getAvailableSpellsForClass()` to get spellcasting from resolved features
- Support both old and new patterns during transition

**Frontend:**
- Update `ClassEdit SpellcastingTab` to support FeatureProgression-based creation
- Update character spell display to get spellcasting from resolved progressions

### Validation Checklist

- [ ] Spellcasting works for existing classes
- [ ] New spellcasting creation via FeatureProgression works
- [ ] Multiclass spellcasting works (multiple progressions)
- [ ] Gestalt spellcasting works (multiple progressions)
- [ ] Spell slot calculations match before/after

### Rollback Procedure

If issues occur:
1. Restore `SpellcastingProgression.classId` values from backup
2. Revert code changes
3. System will work with direct classId links

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

### Validation Checklist

- [ ] All classes have mechanics progressions created
- [ ] All races have mechanics progressions created
- [ ] Extraction functions return correct values
- [ ] Display components show correct mechanics
- [ ] PDF generation uses extracted mechanics
- [ ] Character calculations use extracted mechanics
- [ ] Forms can edit mechanics via feature progressions
- [ ] Formatters and labelers work for new entity types

### Rollback Procedure

If issues occur:
1. Direct fields still exist in database (not removed yet)
2. Revert code changes to use direct fields
3. System will work with direct field access
4. Feature progressions remain but are unused

## Phase 5: Remove Direct Class/Race Field Access

### Goal

Remove deprecated database fields and update all code to use feature system exclusively.

### ⚠️ CRITICAL: Prerequisites

This phase can ONLY proceed after:
- Phase 1, 2, 3, and 4 are complete and validated
- All data has been successfully migrated to feature progressions
- All code has been updated to use extraction functions
- Comprehensive testing has passed
- No references to removed fields remain
- All forms, displays, calculations, and PDF generation use feature-based values

### Final Validation

**Step 1: Run Final Validation Script**

```bash
npx tsx scripts/final-validation.ts
```

**Step 2: Review Validation Report**

- Verify NO code references removed fields
- Verify all calculations use feature system
- Verify all queries use new patterns
- Generate report of any remaining references

**Step 3: Fix Any Remaining References**

- Update any code that still references removed fields
- Re-run validation until clean

### Database Cleanup

**Step 1: Remove Deprecated Fields**

Update Prisma schema to remove:
- Class: `hitDie`, `skillPoints`, `babProgression`, `fortProgression`, `refProgression`, `willProgression`, `canCastSpells`, `spellsKnown`, `isDivine`, `castingAbilityId`, `castingType`
- Race: `sizeId`, `speed`, `favoredClassId`, `levelAdjustment`
- ClassVariant: Entire model
- SpellcastingProgression: `classId`, `classSpellsKnownId`

**Step 2: Create Prisma Migration**

```bash
npx prisma migrate dev --name remove_deprecated_class_race_fields
```

**Step 3: Verify Migration**

- Check that fields are removed
- Verify no data loss
- Test that system still works

### Code Updates

**Backend:**
- Remove all direct field access
- Update calculation systems to use feature resolution
- Remove `VariantClassService` entirely

**Frontend:**
- Remove all direct field access
- Update Zod schemas to remove deprecated fields
- Update all components to use feature resolution

### Validation Checklist

- [ ] Comprehensive testing of all calculations
- [ ] No references to removed fields
- [ ] Performance testing passed
- [ ] User acceptance testing passed
- [ ] All documentation updated

### Rollback Procedure

**⚠️ CRITICAL**: This phase cannot be easily rolled back once fields are removed.

If critical issues occur:
1. Restore database from backup
2. Revert all code changes
3. Re-run Phases 1-3 if needed

## Breaking Changes

### API Changes

**Phase 1:**
- None (additive changes only)

**Phase 2:**
- Variant classes now appear in regular class list
- Variant-specific endpoints deprecated

**Phase 3:**
- Spellcasting queries support both patterns (backward compatible)

**Phase 4:**
- None (additive changes only, backward compatible)

**Phase 5:**
- Class/Race API responses no longer include deprecated fields
- Breaking change - frontend must be updated

### Database Changes

**Phase 1:**
- New `FeatureProgressionClassMap` table (additive)

**Phase 2:**
- No schema changes (data migration only)

**Phase 3:**
- `SpellcastingProgression.classId` made nullable (backward compatible)
- New `featureProgressionId` field (additive)

**Phase 4:**
- No schema changes (data migration only, fields remain for backward compatibility)

**Phase 5:**
- Removed fields (breaking change)
- Removed `ClassVariant` model (breaking change)

## Troubleshooting

### Common Issues

**Issue**: Progressions not found after migration
- **Solution**: Check FeatureProgressionClassMap entries were created
- **Check**: Run validation script

**Issue**: Variants not resolving correctly
- **Solution**: Verify Class entries were created for variants
- **Check**: Verify progression links in FeatureProgressionClassMap

**Issue**: Spellcasting not working
- **Solution**: Verify FeatureProgression links were created
- **Check**: Verify feature entities reference SpellcastingProgression

### Getting Help

- Review validation script output
- Check migration logs
- Compare before/after data
- Test with known working examples

## Related Documentation

- [Feature Extraction Patterns](feature-extraction-patterns.md) - How to extract mechanics from progressions
- [Class and Race Feature Refactoring](../application-overview/class-race-feature-refactoring.md) - Complete refactoring overview
- [Feature System Documentation](../feature-system/README.md) - Feature system architecture
- [Class System Documentation](README.md) - Class system implementation
