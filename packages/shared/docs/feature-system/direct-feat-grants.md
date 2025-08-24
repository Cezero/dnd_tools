# Direct Feat Grants

*Complete guide for modeling features that directly grant specific feats to characters.*

## Overview

Direct feat grants are features that automatically provide a specific feat to characters at certain levels. Examples include:
- **Ranger Track**: Grants the Track feat at 1st level
- **Ranger Endurance**: Grants the Endurance feat at 3rd level
- **Fighter Weapon Focus**: Grants Weapon Focus feat for specific weapons

## Implementation Pattern

### 1. FeatureProgression Setup

Create a `FeatureProgression` entry for the class at the appropriate level:

```typescript
{
  id: 1,
  featureId: 123, // The feature that grants the feat
  sourceType: 1, // Class
  classId: 24, // Ranger
  level: 1, // Level when feat is granted
  modifiers: [
    {
      type: 3, // ModifierType.Other
      value: 0,
      appliesTo: 21, // ModifierAppliesToType.Feat
      appliesToId: 78, // The specific feat ID (e.g., Track feat)
      bonusType: null
    }
  ],
  choices: [],
  effects: []
}
```

### 2. ModifierAppliesToType.Feat

Use `ModifierAppliesToType.Feat` (value: 21) to indicate this modifier grants a feat:

```typescript
// In FeatureData.ts
export const ModifierAppliesToType = {
  // ... existing types
  Feat: 21, // Direct feat grants
} as const;
```

### 3. Compatibility Mapping

Ensure `ModifierType.Other` includes `ModifierAppliesToType.Feat`:

```typescript
export const MODIFIER_TYPE_COMPATIBILITY = {
  [ModifierType.Other]: [
    ModifierAppliesToType.Other,
    ModifierAppliesToType.BonusLanguage,
    ModifierAppliesToType.AutomaticLanguage,
    ModifierAppliesToType.Choice,
    ModifierAppliesToType.Feat, // Direct feat grants are Other type modifiers
  ],
} as const;
```

## UI Implementation

### FeatureProgressionDetailEdit

The UI automatically provides feat selection when `ModifierAppliesToType.Feat` is selected:

1. **Applies To**: Select "Feat" from dropdown
2. **Target**: Select specific feat from populated dropdown
3. **Feat Data**: Automatically attached to modifier for display

### Display Components

Both `ClassDisplay` and `ClassEdit` automatically:
- Load feat data when feat modifiers are detected
- Enhance modifiers with feat information
- Display "Granted Feat: [Feat Name]" instead of "Granted Feat (ID: X)"

## Data Flow

### Frontend Enhancement
```typescript
// When feat modifiers are detected, load feats
const feats = await FeatService.getFeats({});

// Enhance modifiers with feat data
const enhancedModifiers = modifiers.map(modifier => {
  if (modifier.appliesTo === ModifierAppliesToType.Feat && modifier.appliesToId) {
    const feat = feats.find(f => f.id === modifier.appliesToId);
    return feat ? { ...modifier, feat } : modifier;
  }
  return modifier;
});
```

### Backend Storage
- **appliesToId**: Stores the feat ID for database linking
- **feat data**: Not stored in database, added by frontend for display

### Formatter Display
```typescript
[ModifierAppliesToType.Feat]: fmt((valueInt, appliesToId, bonusType, character, modifier) => {
  if (modifier?.feat?.name) {
    return `Granted Feat: ${modifier.feat.name}`;
  }
  return `Granted Feat (ID: ${appliesToId})`;
})
```

## Examples

### Ranger Track Feature
```typescript
{
  featureId: 246, // Track feature
  level: 1,
  modifiers: [
    {
      type: 3, // Other
      appliesTo: 21, // Feat
      appliesToId: 78, // Track feat ID
      value: 0
    }
  ]
}
```

### Ranger Endurance Feature
```typescript
{
  featureId: 249, // Endurance feature
  level: 3,
  modifiers: [
    {
      type: 3, // Other
      appliesTo: 21, // Feat
      appliesToId: 79, // Endurance feat ID
      value: 0
    }
  ]
}
```

## Best Practices

### 1. Use ModifierType.Other
Direct feat grants should use `ModifierType.Other` since they're not numeric bonuses.

### 2. Set Value to 0
The `value` field should be 0 since the feat grant is not a numeric bonus.

### 3. Use Specific Feat IDs
Always use the exact feat ID from the database for `appliesToId`.

### 4. Level-Specific Grants
Create separate `FeatureProgression` entries for each level where feats are granted.

### 5. Feature Description
Include clear descriptions in the feature that explain what feat is granted.

## Testing

### Verification Steps
1. **Create Feature**: Add direct feat grant feature to class
2. **Select Feat**: Choose specific feat from dropdown
3. **Save Class**: Verify feat grant is saved correctly
4. **Display Check**: Verify feat name displays correctly in both edit and detail views
5. **Character Integration**: Verify feat appears on character sheet (future)

### Expected Behavior
- **Edit View**: Shows "Granted Feat: [Feat Name]" in progression details
- **Detail View**: Shows "Granted Feat: [Feat Name]" in class features section
- **Consistency**: Same display format across all components

## Integration with Character System

### Future Implementation
When the character calculation system is implemented:
1. **Feature Resolution**: Detect feat grant features for character
2. **Feat Addition**: Automatically add granted feats to character's feat list
3. **Prerequisite Validation**: Ensure character meets feat prerequisites
4. **Character Sheet**: Display granted feats in character's feat section

### Current Status
- ✅ **Feature Creation**: Complete UI for creating direct feat grants
- ✅ **Display**: Complete display of feat names in class views
- ✅ **Data Storage**: Complete backend storage and retrieval
- 🔴 **Character Integration**: Pending character calculation system

## Related Components

- **[class-features.md](class-features.md)** - General class feature implementation
- **[component-selection.md](component-selection.md)** - When to use direct feat grants vs choices
- **[bulk-operations.md](bulk-operations.md)** - How to create features via API
