# Schema Simplifications

*Recent schema changes and migration guide for the feature system.*

## Overview

The feature system schema has been significantly simplified to remove redundancy and align with actual usage patterns. This document explains what was changed and why.

## What Was Removed

### **Individual CRUD Schemas**
- `CreateFeatureModifierSchema`
- `UpdateFeatureModifierSchema`
- `CreateFeatureChoiceSchema`
- `UpdateFeatureChoiceSchema`
- `CreateFeatureSpecialEffectSchema`
- `UpdateFeatureSpecialEffectSchema`
- `CreateFeaturePrerequisiteSchema`
- `UpdateFeaturePrerequisiteSchema`

**Reason**: These schemas were never used since all feature modifications happen through bulk class/race operations.

### **Base/Full Schema Patterns**
- `BaseFeatureModifierSchema` → `FeatureModifierSchema`
- `BaseFeatureChoiceSchema` → `FeatureChoiceSchema`
- `BaseFeatureSpecialEffectSchema` → `FeatureSpecialEffectSchema`
- `BaseFeaturePrerequisiteSchema` → `FeaturePrerequisiteSchema`

**Reason**: The base/full pattern was redundant since we never need separate create/update schemas.

### **"ForBulk" Schemas**
- `CreateFeatureModifierForBulkSchema`
- `CreateFeatureChoiceForBulkSchema`
- `CreateFeatureSpecialEffectForBulkSchema`

**Reason**: These were duplicates of the main schemas with no functional difference.

### **Unused Response Schemas**
- `GetFeatureModifiersResponseSchema`
- `GetFeatureChoicesResponseSchema`
- `GetFeatureSpecialEffectsResponseSchema`

**Reason**: These endpoints don't exist since we only use bulk operations.

## What Was Kept

### **Core Schemas**
- `FeatureSchema` - Canonical feature definitions
- `FeatureProgressionSchema` - Level-based feature grants
- `FeatureModifierSchema` - Numeric bonuses/penalties
- `FeatureChoiceSchema` - Player selections
- `FeatureSpecialEffectSchema` - Non-numeric effects
- `FeaturePrerequisiteSchema` - Requirements (now at feature level)

### **Bulk Operation Schemas**
- `CreateFeatureProgressionSchema` - For class/race creation
- `UpdateFeatureProgressionSchema` - For class/race updates

### **Essential Routes**
- `POST /features` - Create feature
- `GET /features/:id` - Get feature by ID
- `PUT /features/:id` - Update feature
- `DELETE /features/:id` - Delete feature
- `POST /progressions/bulk` - Bulk create progressions

## Schema Changes

### **FeaturePrerequisite Moved to Feature Level**
```typescript
// Before: Prerequisites on FeatureProgression
const progression = {
    level: 4,
    prerequisites: [{ // Wrong place
        prerequisiteType: PrerequisiteType.Skill,
        skillId: SKILL_MAP.CLIMB,
        minimumRanks: 8
    }]
};

// After: Prerequisites on Feature
const feature = {
    slug: "weapon-specialization",
    name: "Weapon Specialization",
    prerequisites: [{ // Correct place
        prerequisiteType: PrerequisiteType.Skill,
        skillId: SKILL_MAP.CLIMB,
        minimumRanks: 8
    }]
};
```

### **Consolidated WithRelations Schemas**
```typescript
// Before: Separate schemas
FeatureProgressionWithRelationsSchema
FeatureModifierWithConditionsSchema
FeatureSpecialEffectWithRelationsSchema

// After: Single comprehensive schemas
FeatureProgressionSchema // Includes modifiers, choices, effects
FeatureModifierSchema // Includes conditions
FeatureSpecialEffectSchema // Includes all effect data
```

## Migration Guide

### **Frontend Changes**
```typescript
// Before
import { FeatureProgressionWithRelationsSchema } from './feature.js';

// After
import { FeatureProgressionSchema } from './feature.js';
```

### **Backend Changes**
```typescript
// Before
import { CreateFeatureModifierSchema, UpdateFeatureModifierSchema } from './feature.js';

// After
// No individual CRUD schemas needed - use bulk operations only
```

### **API Changes**
```typescript
// Before: Individual CRUD endpoints (removed)
POST /progressions/:id/modifiers
PUT /modifiers/:id
DELETE /modifiers/:id

// After: Bulk operations only
POST /progressions/bulk
PUT /classes/:id (with complete feature data)
```

## Benefits

### **Reduced Maintenance**
- **~50% less schema code** to maintain
- **Fewer files** to update when making changes
- **Simpler imports** and dependencies

### **Clearer Intent**
- **Schema reflects actual usage** patterns
- **No unused schemas** cluttering the codebase
- **Obvious what's needed** for implementation

### **Better Performance**
- **Fewer unused endpoints** in the API
- **Simpler validation** logic
- **Reduced bundle size**

### **Simplified Development**
- **Developers only need to understand** used schemas
- **Clearer documentation** requirements
- **Easier onboarding** for new team members

## Usage Patterns

### **Creating Features**
```typescript
// Single comprehensive schema for all feature data
const featureData = {
    slug: "barbarian-rage",
    name: "Rage",
    description: "A barbarian can fly into a rage...",
    prerequisites: [
        {
            prerequisiteType: PrerequisiteType.Level,
            minimumLevel: 1
        }
    ]
};

await FeatureSystemService.createFeature(featureData);
```

### **Creating Classes with Features**
```typescript
// Bulk operation with complete nested data
const classData = {
    name: "Barbarian",
    hitDie: 12,
    features: [
        {
            sourceType: FeatureSourceType.Class,
            level: 1,
            featureId: RAGE_FEATURE_ID,
            modifiers: [/* complete modifier data */],
            choices: [/* complete choice data */],
            effects: [/* complete effect data */]
        }
    ]
};

await ClassService.createClass(classData);
```

## Key Principles

1. **Bulk operations only** - No individual CRUD on sub-entities
2. **Complete data** - Send full nested feature data in single requests
3. **Simplified schemas** - Only schemas that are actually used
4. **Clear intent** - Schema structure reflects actual usage patterns

For implementation details, see **[bulk-operations.md](bulk-operations.md)** and **[component-selection.md](component-selection.md)**.
