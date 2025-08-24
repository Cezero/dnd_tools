# Choice System Implementation Guide

*Complete guide for implementing complex choice systems in the D&D Tools feature system, including Ranger fighting styles and other choice-dependent features.*

## 🎯 **Overview**

The choice system allows features to present players with selections from available options. This is used for features like:
- **Ranger Combat Style**: Choose between "Archery" and "Two-Weapon Combat" styles
- **Monk Bonus Feats**: Select from available feat options at specific levels
- **Rogue Special Abilities**: Choose from rogue ability options
- **Character Backgrounds**: Select character background features

## 📋 **Current State: Two Choice Mechanisms**

The system currently has **two separate but overlapping choice mechanisms** that serve different purposes:

### **1. FeatureChoice System (Direct Choice Selection)**
- **Purpose**: Define specific, predefined choices for players
- **Components**: `FeatureChoice` model with `ChoiceType` and `ChoiceBehavior` enums
- **Examples**: 
  - **Monk Bonus Feats**: Choose between "Improved Grapple" or "Stunning Fist"
  - **Ranger Combat Style**: Choose between "Archery" or "Two-Weapon Combat" features
  - **Ranger Favored Enemy**: Choose creature types and allocate +2 bonuses

### **2. FeatureModifier Choice System (Filtered Choice Selection)**
- **Purpose**: Enable filtered choice selection with formula-based progression
- **Components**: `FeatureModifier` with `ModifierType.Other` + `ModifierAppliesToType.Choice`
- **Examples**:
  - **Fighter Bonus Feats**: Choose from fighter bonus feat category every 2 levels
  - **Wizard Bonus Feats**: Choose from metamagic/item creation feat category at levels 5, 10, 15, 20
  - **Rogue Special Abilities**: Choose from rogue ability category every 3 levels starting at level 10

## 🔄 **Planned Refactoring: Unified Choice System**

**Strategy**: Unify both choice mechanisms under a single `FeatureChoice` system while preserving existing functionality and adding formula support for progression-based choices.

### **Schema Changes**
1. **Convert Prisma Enums to Static-Data Enums**: Convert `ChoiceType` and `ChoiceBehavior` from Prisma enums to `Int` fields referencing `@FeatureData.ts` enums
2. **Rename Formula System**: Rename `FeatureModifierFormulaParams` to `FeatureFormulaParams` and extend to support both `FeatureModifier` and `FeatureChoice`
3. **Add New Fields to FeatureChoice**: Add `filterType` and `formulaParamsId` fields for filtered choice support
4. **Preserve Existing Fields**: Keep `pickCount` and `ChoiceBehavior.Multiple` for future epic level features

### **Benefits**
- ✅ **Unified Choice System**: Single choice mechanism for all features
- ✅ **Shared Formula System**: Reuses existing formula infrastructure
- ✅ **Consistent Modeling**: All choice-based features use same approach
- ✅ **Future Flexibility**: Preserves fields for epic level "pick 2 feats" scenarios
- ✅ **Better Maintainability**: One system to understand and maintain

### **Migration Strategy**
1. **Phase 1**: Schema updates and static-data enum additions
2. **Phase 2**: Data migration and code updates
3. **Phase 3**: Feature migration (Fighter, Wizard, Rogue bonus feats)
4. **Phase 4**: Cleanup and documentation updates

## 📋 **Choice Types**

### **ChoiceType.Feat**
Used when players select from available feats:
- **Monk Bonus Feats**: Choose from specific feats like Improved Grapple, Stunning Fist, Deflect Arrows, Evasion
- **Fighter Bonus Feats**: Select from combat-oriented feats
- **Character Creation**: Choose starting feats

### **ChoiceType.Feature** 
Used when players select from available features:
- **Ranger Combat Style**: Choose between "Archery" and "Two-Weapon Combat" features ✅ **IMPLEMENTED**
- **Rogue Special Abilities**: Select from rogue ability features
- **Character Templates**: Choose template-specific features

### **ChoiceType.CreatureType** ✅ **NEW - IMPLEMENTED**
Used when players select from available creature types:
- **Ranger Favored Enemy**: Choose creature types and allocate +2 bonuses ✅ **IMPLEMENTED**
- **Other creature type-based features**: Future features that require creature type selection

## 🏗️ **Implementation Architecture**

### **Database Schema**
**Source**: `packages/shared/schema/src/feature.ts`

The choice system uses the FeatureChoice table to define available options for feature progressions. Each choice can reference either a specific feat or feature, and includes metadata for choice behavior and selection rules.

**Key Fields**:
- `id`: Choice ID (required, positive integer)
- `progressionId`: Reference to the feature progression (required, positive integer)
- `label`: Display label for the choice group (optional, max 200 characters)
- `pickCount`: Number of options that can be selected (optional, non-negative integer)
- `choiceType`: Type of choice - 'Feat', 'Feature', or 'CreatureType' (required)
- `choiceBehavior`: How the choice behaves - 'Single', 'Multiple', or 'Allocation' (required)
- `featId`: Reference to specific feat (optional, positive integer)
- `chosenFeatureId`: Reference to specific feature or creature type (optional, positive integer)
- `feat`: Related feat data (optional, includes id, name)
- `feature`: Related feature data (optional, includes id, name, slug)

**Choice Type Relationships**:
- **ChoiceType.Feat**: Uses `featId` and `feat` fields for feat-based choices
- **ChoiceType.Feature**: Uses `chosenFeatureId` and `feature` fields for feature-based choices
- **ChoiceType.CreatureType**: Uses `chosenFeatureId` field for creature type ID (character sheet maps to names)
- **Filtered Choices**: Leave `featId`/`chosenFeatureId` null for category-based filtering

### **Filtered Choice Schema**
**Source**: `packages/shared/schema/src/feature.ts`

For filtered choice selection (like Fighter Bonus Feats), the system uses FeatureModifier entries with specific appliesTo types:

**Key Fields**:
- `type`: Modifier type - 'Other' for choice modifiers (required)
- `appliesTo`: AppliesTo type - 'Choice' for filtered choices (required)
- `appliesToId`: Filter category ID (required, positive integer)
- `value`: Always 0 for choice modifiers (required, non-negative integer)

**Filter Categories**:
- **FeatureFeatChoiceFilter.FighterBonus**: Fighter bonus feat category
- **FeatureFeatChoiceFilter.MetamagicOrItemCreation**: Metamagic or item creation feat category
- **FeatureFeatChoiceFilter.Any**: Any feat category

**Source**: `packages/shared/static-data/src/FeatureData.ts` - `FeatureFeatChoiceFilter` enum

### **Frontend Display**
Choices are displayed in pipe-delimited format:
- **Feat Choices**: `Power Attack|Cleave|Weapon Focus`
- **Feature Choices**: `Archery|Two-Weapon Combat`
- **Creature Type Choices**: `Choose Creature Type|Allocate Bonus` (generic labels, specific types chosen in character editor)

### **Choice Modifier Relationships**
The choice system has two distinct patterns for modeling choice-based features:

#### **1. Direct Choice Selection (Monk Bonus Feats, Ranger Combat Style)**
Uses `FeatureChoice` entries to define available options:
- **Monk Bonus Feats**: Specific feats like Improved Grapple, Stunning Fist
- **Ranger Combat Style**: Specific features like Archery, Two-Weapon Combat
- **Player selects**: One option from the defined choices

#### **2. Filtered Choice Selection (Fighter Bonus Feats, Wizard Metamagic)**
Uses `FeatureModifier` with `ModifierType.Other` and `ModifierAppliesToType.Choice`:
- **Fighter Bonus Feats**: Player can select from fighter bonus feat category
- **Wizard Metamagic/Item Creation**: Player can select from metamagic or item creation feat categories
- **Player selects**: Any feat that matches the category filter
- **No predefined list**: Choices are filtered by feat category at runtime

**Source**: `packages/shared/static-data/src/FeatureData.ts` - `ModifierAppliesToType.Choice` and related filter types

## 🚀 **Implementation Examples**

### **Ranger Combat Style Implementation**

#### **1. Create Standalone Features**
First, create the individual combat style features:

**Archery Combat Style Feature:**
```typescript
{
    name: "Archery Combat Style",
    slug: "archery-combat-style",
    description: "Specialized training in archery combat techniques...",
    // No prerequisites - available as a choice
}
```

**Two-Weapon Combat Style Feature:**
```typescript
{
    name: "Two-Weapon Combat Style", 
    slug: "two-weapon-combat-style",
    description: "Specialized training in two-weapon combat techniques...",
    // No prerequisites - available as a choice
}
```

#### **2. Create FeatureProgression with Feature Choices**
```typescript
const rangerCombatStyle: FeatureProgression = {
    featureId: "combat-style",
    level: 2,
    sourceType: FeatureSourceType.Class,
    classId: RANGER_CLASS_ID,
    choices: [
        {
            choiceType: ChoiceType.Feature,
            choiceBehavior: ChoiceBehavior.Single,
            label: "Choose a combat style",
            chosenFeatureId: archeryCombatStyleId,
            feature: {
                id: archeryCombatStyleId,
                name: "Archery Combat Style",
                slug: "archery-combat-style"
            }
        },
        {
            choiceType: ChoiceType.Feature,
            choiceBehavior: ChoiceBehavior.Single,
            label: "Choose a combat style",
            chosenFeatureId: twoWeaponCombatStyleId,
            feature: {
                id: twoWeaponCombatStyleId,
                name: "Two-Weapon Combat Style",
                slug: "two-weapon-combat-style"
            }
        }
    ],
    modifiers: [],
    effects: []
};
```

### **Monk Bonus Feat Implementation**

#### **1. Create FeatureProgression with Specific Feat Choices**
```typescript
{
    featureId: "bonus-feat",
    level: 1,
    sourceType: FeatureSourceType.Class,
    classId: monkClassId,
    choices: [
        {
            label: "Bonus Feat",
            pickCount: 1,
            choiceType: ChoiceType.Feat,
            choiceBehavior: ChoiceBehavior.Single,
            featId: improvedGrappleFeatId,
            feat: {
                id: improvedGrappleFeatId,
                name: "Improved Grapple"
            }
        },
        {
            label: "Bonus Feat", 
            pickCount: 1,
            choiceType: ChoiceType.Feat,
            choiceBehavior: ChoiceBehavior.Single,
            featId: stunningFistFeatId,
            feat: {
                id: stunningFistFeatId,
                name: "Stunning Fist"
            }
        }
    ]
}
```

### **Fighter Bonus Feat Implementation (Filtered Choice Selection)**

#### **1. Create FeatureProgression with Filtered Choice Modifier**
```typescript
{
    featureId: "bonus-feat",
    level: 1,
    sourceType: FeatureSourceType.Class,
    classId: fighterClassId,
    modifiers: [
        {
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.Choice,
            appliesToId: FeatureFeatChoiceFilter.FighterBonus,
            value: 0
        }
    ]
}
```

**Key Differences**:
- **Direct Choice**: Uses `choices` array with specific `featId` values
- **Filtered Choice**: Uses `modifiers` with `ModifierAppliesToType.Choice` and filter ID
- **Direct Choice**: Player sees specific options like "Improved Grapple|Stunning Fist"
- **Filtered Choice**: Player can select any feat that matches the fighter bonus category

## 🎨 **UI Implementation**

### **FeatureProgressionDetailEdit Component**
The choice editing interface supports both direct choice selection and filtered choice selection:

#### **Direct Choice Selection (FeatureChoice)**
```typescript
// For ChoiceType.Feat
<ValidatedCustomSelect
    field={`choices.${index}.featId`}
    label="Specific Feat (Optional)"
    options={availableFeats.map(feat => ({ value: feat.id, label: feat.name }))}
    placeholder="Select a specific feat or leave empty for filtered choice"
    nested
/>

// For ChoiceType.Feature
<ValidatedCustomSelect
    field={`choices.${index}.chosenFeatureId`}
    label="Specific Feature (Optional)"
    options={availableFeatures.map(feature => ({ value: feature.id, label: feature.name }))}
    placeholder="Select a specific feature or leave empty for filtered choice"
    nested
/>

// For ChoiceType.CreatureType
<ValidatedCustomSelect
    field={`choices.${index}.chosenFeatureId`}
    label="Creature Type (Optional)"
    options={creatureTypeOptions}
    placeholder="Select a specific creature type or leave empty for generic choice"
    nested
/>
```

#### **Filtered Choice Selection (FeatureModifier)**
```typescript
// For ModifierAppliesToType.Choice
<ValidatedCustomSelect
    field={`modifiers.${index}.appliesToId`}
    label="Choice Filter"
    options={FEATURE_FEAT_CHOICE_FILTER_SELECT_LIST}
    placeholder="Select choice filter type"
    nested
/>
```

## 🔧 **Backend Implementation**

### **Choice Data Access**
```typescript
// Get choices for a feature progression
const choices = await prisma.featureChoice.findMany({
    where: { progressionId: featureProgressionId },
    include: {
        feat: true,
        feature: true
    }
});

// Get character's specific choices
const characterChoices = await prisma.characterFeatureChoice.findMany({
    where: { 
        characterId: characterId,
        progressionId: featureProgressionId 
    },
    include: {
        featureChoice: {
            include: {
                feat: true,
                feature: true
            }
        }
    }
});
```

### **Choice Validation**
```typescript
// Validate that character's choice is valid for the feature
const isValidChoice = (characterChoice: CharacterFeatureChoice, featureChoice: FeatureChoice): boolean => {
    if (featureChoice.choiceType === 'Feat' && featureChoice.featId) {
        return characterChoice.value === featureChoice.featId.toString();
    }
    if (featureChoice.choiceType === 'Feature' && featureChoice.chosenFeatureId) {
        return characterChoice.value === featureChoice.chosenFeatureId.toString();
    }
    return true; // For filtered choices, validation happens at runtime
};
```

## 📊 **Choice Behavior Patterns**

### **ChoiceBehavior.Single**
Used for most choice scenarios:
- **Monk Bonus Feats**: Choose one feat from available options
- **Ranger Combat Style**: Choose one combat style
- **Character Creation**: Choose starting feats

### **ChoiceBehavior.Multiple**
Used for scenarios where multiple selections are allowed:
- **Epic Level Features**: "Choose 2 feats from this list"
- **Multiple Proficiencies**: Choose several weapon proficiencies
- **Future Features**: Any feature allowing multiple simultaneous choices

### **ChoiceBehavior.Allocation**
Used for distributing bonuses or points:
- **Ranger Favored Enemy**: Distribute +2 bonuses among chosen creature types
- **Skill Point Allocation**: Distribute skill points among skills
- **Bonus Distribution**: Any feature requiring point allocation

## 🔮 **Future Enhancements**

### **Planned Unified Choice System**
After the refactoring is complete, all choice-based features will use the unified `FeatureChoice` system:

#### **Fighter Bonus Feats (Unified Approach)**
```typescript
// FeatureChoice with formula
{
    choiceType: ChoiceType.Feat,
    choiceBehavior: ChoiceBehavior.Single,
    label: "Choose a fighter bonus feat",
    filterType: FeatureFeatChoiceFilter.FighterBonus,
    formulaParamsId: 123
}

// FeatureFormulaParams
{
    id: 123,
    formulaId: 2, // EVERY_N_LEVELS
    interval: 2,  // Every 2 levels
    formulaStartLevel: 2 // Start at level 2
}
```

#### **Wizard Bonus Feats (Unified Approach)**
```typescript
// FeatureChoice with formula
{
    choiceType: ChoiceType.Feat,
    choiceBehavior: ChoiceBehavior.Single,
    label: "Choose a metamagic or item creation feat",
    filterType: FeatureFeatChoiceFilter.MetamagicOrItemCreation,
    formulaParamsId: 456
}

// FeatureFormulaParams
{
    id: 456,
    formulaId: 2, // EVERY_N_LEVELS
    interval: 5,  // Every 5 levels
    formulaStartLevel: 5 // Start at level 5
}
```

### **Epic Level "Pick 2 Feats" (Future Use)**
```typescript
// FeatureChoice for epic level features
{
    choiceType: ChoiceType.Feat,
    choiceBehavior: ChoiceBehavior.Multiple,
    pickCount: 2,
    label: "Choose 2 epic feats from the following list",
    filterType: FeatureFeatChoiceFilter.EpicFeats, // Future enum value
    formulaParamsId: 789
}
```

## ✅ **Success Criteria**

### **Current Implementation**
- [x] **Direct Choice Selection**: FeatureChoice system working for Monk bonus feats and Ranger combat style
- [x] **Filtered Choice Selection**: FeatureModifier choice system working for Fighter bonus feats
- [x] **Choice Display**: Choices display correctly in all UI components
- [x] **Choice Validation**: Basic choice validation working
- [x] **Choice Persistence**: Character choices stored and retrieved correctly

### **Planned Unified System**
- [ ] **Schema Updates**: Convert enums to static-data and add new fields
- [ ] **Data Migration**: Migrate existing enum values and formula references
- [ ] **Feature Migration**: Migrate Fighter, Wizard, Rogue bonus feats to unified system
- [ ] **Testing and Validation**: Ensure all existing functionality continues to work
- [ ] **Documentation Updates**: Update all documentation to reflect unified system

### **Future Enhancements**
- [ ] **Epic Level Support**: Support for "pick 2 feats" scenarios
- [ ] **Advanced Choice Dependencies**: Complex choice dependencies and validation
- [ ] **Choice History**: Track and display character's choice history
- [ ] **Choice Templates**: Predefined choice templates for common scenarios

## 📚 **Related Documentation**

- **[Feature System Implementation Plan](../../project-mgmt/feature-system-implementation-plan.md)**: Overall feature system strategy
- **[Feature System Pending Tasks](../../project-mgmt/feature-system-pending-tasks.md)**: Current implementation priorities
- **[Class Features Guide](class-features.md)**: Detailed class feature implementation examples
- **[Formula System Guide](formula-system-analysis.md)**: Formula system for choice progression
- **[Schema Reference](schema-reference.md)**: Complete schema documentation

This guide provides comprehensive coverage of the choice system implementation, from current state to planned unified system, ensuring consistent and maintainable choice-based features across the D&D Tools system.

