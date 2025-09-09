# Weapon Familiarity System

This document outlines the implementation strategy for the Weapon Familiarity system, which handles racial weapon familiarity features like dwarf and gnome weapon familiarity.

## Overview

Weapon Familiarity allows certain races to treat specific exotic weapons as martial weapons for proficiency purposes. This does **not** grant proficiency with the weapons - it only changes how proficiency is calculated.

### Official D&D 3.5 Rules

**Dwarf Weapon Familiarity:**
- Dwarves may treat **dwarven waraxes** and **dwarven urgroshes** as **martial weapons** rather than **exotic weapons**

**Gnome Weapon Familiarity:**
- Gnomes may treat **gnome hooked hammers** as **martial weapons** rather than **exotic weapons**

### Key Concept

Weapon familiarity **does not grant proficiency**. For example:
- A **gnome wizard** is not proficient with all martial weapons, so even though they can treat the gnome hooked hammer as a martial weapon, they still need to take "Martial Weapon Proficiency (gnome hooked hammer)" to be proficient with it
- A **gnome fighter** gets "all martial weapons" as a class proficiency, and since they can treat the gnome hooked hammer as a martial weapon, they are also proficient with it

## Implementation Strategy

### 1. Unified Entity Approach

Use the unified `FeatureEntity` model with the existing `EntityAppliesToType.WeaponFamiliarity` to handle racial weapon familiarity. This approach leverages the existing entity system that already has proper support for weapon familiarity.

**Implementation Strategy**: Use `EntityType.Other` with `EntityAppliesToType.WeaponFamiliarity` to represent weapon familiarity effects.

### 2. Data Model

Use the existing `FeatureEntity` schema with:
- `type: EntityType.Other` - indicates this is a special ability
- `appliesTo: EntityAppliesToType.WeaponFamiliarity` - indicates this is weapon familiarity
- `appliesToId: itemId` - stores the ID of the weapon that benefits from familiarity
- No additional schema changes required

### 3. UI Implementation

#### FeatureProgressionDetailEdit.tsx Updates

Add exotic weapon selection when `EntityType.Other` with `EntityAppliesToType.WeaponFamiliarity` is selected:

**Implementation Approach**: The UI should detect when an entity is configured for weapon familiarity and provide appropriate weapon selection options.

**Key Components**:
- State management for exotic weapons list
- Loading mechanism for weapon data
- Filtering logic for exotic weapons only
- Integration with existing entity selection UI

**Source File**: See actual implementation in `apps/frontend/src/components/feature-system/FeatureProgressionDetailEdit.tsx`

#### UI Structure

**Implementation Approach**: The UI should provide weapon selection when the entity is configured for weapon familiarity.

**Key Components**:
- Weapon selection dropdown for exotic weapons
- Integration with existing entity configuration UI
- Proper validation and error handling
- Loading states for weapon data

**Source File**: See actual implementation in `apps/frontend/src/components/feature-system/FeatureProgressionDetailEdit.tsx`

### 4. Display Logic

#### Formatters.ts Updates

Update `formatProgression` function to handle weapon familiarity entities:

**Implementation Approach**: The formatter should detect weapon familiarity entities and display them appropriately.

**Key Components**:
- Detection of weapon familiarity entities
- Proper weapon name resolution
- Integration with existing formatting logic
- Consistent display format

**Source File**: See actual implementation in `apps/backend/src/utils/formatters.ts`

### 5. Racial Feature Implementation

#### Dwarf Weapon Familiarity

**Implementation Approach**: Create feature progressions with entities that grant weapon familiarity for dwarven weapons.

**Key Components**:
- Feature progression for dwarf race
- Entities with `EntityType.Other` and `EntityAppliesToType.WeaponFamiliarity`
- References to specific weapon item IDs
- Proper descriptions for display

**Source File**: See actual implementation in `apps/backend/src/features/featureSystem/featureSystemService.ts`

#### Gnome Weapon Familiarity

**Implementation Approach**: Create feature progressions with entities that grant weapon familiarity for gnome weapons.

**Key Components**:
- Feature progression for gnome race
- Entities with `EntityType.Other` and `EntityAppliesToType.WeaponFamiliarity`
- References to specific weapon item IDs
- Proper descriptions for display

**Source File**: See actual implementation in `apps/backend/src/features/featureSystem/featureSystemService.ts`

### 6. Runtime Logic (Future Implementation)

The character calculation system will need to handle weapon familiarity entities:

**Implementation Approach**: The character calculation system should detect weapon familiarity entities and adjust weapon proficiency calculations accordingly.

**Key Components**:
- Detection of weapon familiarity entities
- Weapon category adjustment logic
- Proficiency calculation integration
- Character sheet display updates

**Source File**: See actual implementation in `apps/backend/src/features/characterCalculation/characterCalculationService.ts`

## Benefits

1. **Unified Approach**: Uses existing `FeatureEntity` model without requiring new enum values
2. **Simple Data Model**: Uses existing `appliesToId` field for itemId
3. **Extensible**: Can handle future weapon familiarity rules
4. **Clear UI**: Dedicated dropdown for exotic weapons
5. **Consistent Display**: Uses existing formatting patterns
6. **No Breaking Changes**: Uses existing entity types without affecting existing functionality

## Success Criteria

- [ ] Dwarf weapon familiarity displays correctly in race details
- [ ] Gnome weapon familiarity displays correctly in race details
- [ ] UI allows selection of exotic weapons for familiarity effects
- [ ] Formatters show weapon familiarity in readable format
- [ ] No impact on existing feature system functionality
- [ ] Future character calculation system correctly applies weapon familiarity

## Related Documentation

- [Feature System Overview](../feature-system/README.md)
- [Examples](examples.md) - Comprehensive implementation examples
- [Project Management](../../project-mgmt/feature-system-implementation-plan.md)
