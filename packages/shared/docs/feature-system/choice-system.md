# Choice System

*Complete guide to the choice system that allows features to present players with options and selections that affect character development and abilities.*

## 📋 **Overview**

The choice system enables features to offer:
- **Feat selections**: Choose from available feats
- **Feature selections**: Choose from available features  
- **Creature type selections**: Choose creature types for special abilities
- **Custom options**: Arbitrary choices with custom logic

The choice system provides a flexible framework for player customization within feature progressions, allowing characters to make meaningful choices that affect their development.

**Source Files**: 
- Database Schema: `prisma/schema.prisma` (FeatureChoice, CharacterFeatureChoice models)
- Validation Schemas: `packages/shared/schema/src/feature.ts`
- Static Data: `packages/shared/static-data/src/FeatureData.ts`

## 🏗️ **System Architecture**

### **Current State: Unified Choice System**

The system uses a **unified choice mechanism** through the `FeatureChoice` model that supports both direct choice selection and filtered choice selection.

### **FeatureChoice System (Unified Choice Selection)**
- **Purpose**: Define choices for players with support for both specific and filtered options
- **Components**: `FeatureChoice` model with `type` and `behavior` fields (using static data enums)
- **Examples**: 
  - **Monk Bonus Feats**: Choose between "Improved Grapple" or "Stunning Fist"
  - **Ranger Combat Style**: Choose between "Archery" or "Two-Weapon Combat" features
  - **Ranger Favored Enemy**: Choose creature types and allocate +2 bonuses
  - **Fighter Bonus Feats**: Choose from fighter bonus feat category

### **Choice Integration**

The choice system integrates with other system layers:

**Database Integration**: Choices stored in database with feature progressions
**Validation Integration**: Choices validated using Zod schemas
**Character Integration**: Player choices tracked and applied to characters
**Display Integration**: Choices presented through user interfaces

## 🎯 **Core Choice Types**

### **Feat Choices (0)**

Choices that allow players to select from available feats.

**Purpose**: Provides feat selection options for character customization.

**Key Characteristics**:
- **Feat Selection**: Choose from available feats
- **Filter Options**: Can be filtered by feat type (Any, Fighter Bonus, Metamagic/Item Creation)
- **Behavior Control**: Can be single selection or multiple selections
- **Character Tracking**: Player selections tracked in CharacterFeatureChoice

**Common Uses**:
- **Fighter Bonus Feats**: Choose from fighter bonus feat list
- **Wizard Bonus Feats**: Choose from wizard bonus feat list
- **Metamagic Feats**: Choose from metamagic feat options
- **Item Creation Feats**: Choose from item creation feat options

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureChoiceType.Feat definition)

### **Feature Choices (1)**

Choices that allow players to select from available features.

**Purpose**: Provides feature selection options for character customization.

**Key Characteristics**:
- **Feature Selection**: Choose from available features
- **Feature Reference**: Can reference specific features by ID
- **Behavior Control**: Can be single selection or multiple selections
- **Character Tracking**: Player selections tracked in CharacterFeatureChoice

**Common Uses**:
- **Domain Selection**: Choose cleric domains
- **School Specialization**: Choose wizard schools
- **Ranger Styles**: Choose ranger combat styles
- **Custom Features**: Choose from custom feature lists

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureChoiceType.Feature definition)

### **Creature Type Choices (2)**

Choices that allow players to select creature types for special abilities.

**Purpose**: Provides creature type selection for abilities like favored enemy.

**Key Characteristics**:
- **Creature Type Selection**: Choose from available creature types
- **Type Reference**: Uses CreatureType enum for available options
- **Behavior Control**: Can be single selection or multiple selections
- **Character Tracking**: Player selections tracked in CharacterFeatureChoice

**Available Creature Types**:
- **Aberration (1)**: Aberrations (mind flayers, beholders)
- **Animal (2)**: Animals (wolves, bears, horses)
- **Construct (3)**: Constructs (golems, animated objects)
- **Dragon (4)**: Dragons (red dragons, gold dragons)
- **Elemental (5)**: Elementals (fire elementals, earth elementals)
- **Fey (6)**: Fey creatures (dryads, pixies)
- **Giant (7)**: Giants (hill giants, frost giants)
- **Humanoid (8)**: Humanoids (humans, elves, orcs)
- **Magical Beast (9)**: Magical beasts (griffons, unicorns)
- **Monstrous Humanoid (10)**: Monstrous humanoids (minotaurs, centaurs)
- **Ooze (11)**: Oozes (gelatinous cubes, black puddings)
- **Outsider (12)**: Outsiders (demons, angels, devils)
- **Plant (13)**: Plants (treants, shambling mounds)
- **Undead (14)**: Undead (skeletons, zombies, vampires)
- **Vermin (15)**: Vermin (spiders, scorpions, centipedes)

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureChoiceType.CreatureType definition)

## 🎭 **Choice Behaviors**

### **Single Choice (0)**

Allows players to select exactly one option from the available choices.

**Use Cases**:
- **Fighter Bonus Feats**: Choose one feat from the list
- **Ranger Combat Style**: Choose one combat style
- **Domain Selection**: Choose one cleric domain

**Example**:
```typescript
{
    type: FeatureChoiceType.Feat,
    behavior: FeatureChoiceBehavior.Single,
    label: "Choose a fighter bonus feat",
    filterType: FeatureFeatChoiceFilter.FighterBonus
}
```

### **Multiple Choice (1)**

Allows players to select multiple options from the available choices.

**Use Cases**:
- **Wizard Bonus Feats**: Choose multiple feats from different categories
- **Rogue Special Abilities**: Choose multiple special abilities
- **Character Background**: Choose multiple background features

**Example**:
```typescript
{
    type: FeatureChoiceType.Feature,
    behavior: FeatureChoiceBehavior.Multiple,
    label: "Choose rogue special abilities",
    pickCount: 2 // Can choose up to 2 abilities
}
```

### **Allocation Choice (2)**

Allows players to allocate bonuses or points across multiple options.

**Use Cases**:
- **Ranger Favored Enemy**: Allocate +2 bonuses across creature types
- **Skill Focus**: Allocate skill points across multiple skills
- **Attribute Bonuses**: Allocate ability score increases

**Example**:
```typescript
{
    type: FeatureChoiceType.CreatureType,
    behavior: FeatureChoiceBehavior.Allocation,
    label: "Choose favored enemy types",
    // +2 bonus can be allocated across chosen creature types
}
```

## 🏗️ **Implementation Architecture**

### **Database Schema**
**Source**: `apps/backend/prisma/schema.prisma`

The choice system uses the FeatureChoice table to define available options for feature progressions. Each choice can reference either a specific feat or feature, and includes metadata for choice behavior and selection rules.

**Key Fields**:
- `id`: Choice ID (required, auto-increment)
- `progressionId`: Reference to the feature progression (required)
- `label`: Display label for the choice group (optional)
- `pickCount`: Number of options that can be selected (optional)
- `type`: Type of choice - using static data enum values (required)
- `behavior`: How the choice behaves - using static data enum values (required)
- `featId`: Reference to specific feat (optional)
- `featureId`: Reference to specific feature (optional)
- `formulaParamsId`: Reference to formula parameters for progression-based choices (optional)
- `filterType`: Filter type for category-based choices (optional)

**Choice Type Relationships**:
- **ChoiceType.Feat**: Uses `featId` field for feat-based choices
- **ChoiceType.Feature**: Uses `featureId` field for feature-based choices
- **ChoiceType.CreatureType**: Uses `featureId` field for creature type ID
- **Filtered Choices**: Use `filterType` field for category-based filtering

### **Validation Schema**
**Source**: `packages/shared/schema/src/feature.ts`

The choice system uses Zod schemas for validation:

**FeatureChoiceSchema**: Validates choice data structure and relationships
**CreateFeatureChoiceSchema**: Validates choice creation data
**Choice Type Validation**: Ensures choice types match expected enum values
**Relationship Validation**: Validates relationships between choices and related entities

### **Frontend Display**
Choices are displayed in pipe-delimited format:
- **Feat Choices**: `Power Attack|Cleave|Weapon Focus`
- **Feature Choices**: `Archery|Two-Weapon Combat`
- **Creature Type Choices**: `Choose Creature Type|Allocate Bonus` (generic labels, specific types chosen in character editor)

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

#### **2. Create Ranger Feature with Choice**
Create the main ranger feature that offers the choice:

```typescript
{
    name: "Combat Style",
    slug: "combat-style",
    description: "Choose a combat style specialization",
    progressions: [{
        level: 2,
        sourceType: FeatureSourceType.Class,
        classId: RANGER_CLASS_ID,
        choices: [{
            type: FeatureChoiceType.Feature,
            behavior: FeatureChoiceBehavior.Single,
            label: "Choose a combat style",
            // No filterType needed - specific features referenced
        }],
        modifiers: [],
        effects: []
    }]
}
```

#### **3. Link Choices to Features**
In the UI, link the choice to the available features:

```typescript
// In FeatureProgressionDetailEdit.tsx
const availableFeatures = [
    { id: ARCHERY_COMBAT_STYLE_ID, name: "Archery Combat Style" },
    { id: TWO_WEAPON_COMBAT_STYLE_ID, name: "Two-Weapon Combat Style" }
];
```

### **Monk Bonus Feats Implementation**

#### **1. Create Feat Choice**
```typescript
{
    name: "Bonus Feat",
    slug: "bonus-feat",
    description: "Choose a bonus feat from the monk feat list",
    progressions: [{
        level: 1,
        sourceType: FeatureSourceType.Class,
        classId: MONK_CLASS_ID,
        choices: [{
            type: FeatureChoiceType.Feat,
            behavior: FeatureChoiceBehavior.Single,
            label: "Choose a monk bonus feat",
            filterType: FeatureFeatChoiceFilter.MonkBonus
        }],
        modifiers: [],
        effects: []
    }]
}
```

#### **2. Define Available Feats**
The available feats are defined in the feat system and filtered by the `filterType`:

```typescript
// Available monk bonus feats
const MONK_BONUS_FEATS = [
    FEAT_ID.IMPROVED_GRAPPLE,
    FEAT_ID.STUNNING_FIST,
    FEAT_ID.DEFLECT_ARROWS,
    FEAT_ID.DODGE,
    FEAT_ID.IMPROVED_TRIP,
    FEAT_ID.COMBAT_REFLEXES
];
```

### **Ranger Favored Enemy Implementation**

#### **1. Create Creature Type Choice**
```typescript
{
    name: "Favored Enemy",
    slug: "favored-enemy",
    description: "Choose creature types as favored enemies",
    progressions: [{
        level: 1,
        sourceType: FeatureSourceType.Class,
        classId: RANGER_CLASS_ID,
        choices: [{
            type: FeatureChoiceType.CreatureType,
            behavior: FeatureChoiceBehavior.Allocation,
            label: "Choose favored enemy types",
            // +2 bonus allocated across chosen creature types
        }],
        modifiers: [{
            type: ModifierType.Bonus,
            appliesTo: ModifierAppliesToType.Attack,
            value: 2,
            bonusType: FeatureBonusType.Other
            // Applied to attacks against chosen creature types
        }],
        effects: []
    }]
}
```

## 🎨 **Frontend UI Implementation**

### **Current UI Capabilities**

The current frontend implementation provides:

#### **✅ Implemented Features**
- **Basic Choice Configuration**: Set choice type, behavior, and label
- **Feat Selection**: Choose from available feats with filtering
- **Feature Selection**: Choose from available features
- **Creature Type Selection**: Choose from creature type options
- **Choice Display**: Show available choices in UI
- **Character Choice Tracking**: Track player selections

#### **⚠️ UI Gaps Identified**
- **Complex Choice Scenarios**: Limited support for multi-step choice processes
- **Choice Dependencies**: No UI for choices that depend on other choices
- **Dynamic Choice Updates**: Limited support for choices that change based on character state
- **Choice Validation**: No real-time validation of choice combinations
- **Choice Preview**: No preview of how choices affect character abilities

### **UI Enhancement Strategy**

#### **Phase 1: Basic Choice Improvements**
- **Enhanced Choice Display**: Better formatting and organization of choice options
- **Choice Validation**: Real-time validation of choice selections
- **Choice Preview**: Show how choices affect character abilities

#### **Phase 2: Advanced Choice Features**
- **Multi-Step Choices**: Support for complex choice workflows
- **Choice Dependencies**: UI for choices that depend on other choices
- **Dynamic Choices**: Choices that update based on character state
- **Choice Templates**: Predefined choice configurations for common patterns

## 🔗 **Integration with Other Systems**

### **Formula System Integration**
Choices can use formulas for progression-based options:

```typescript
{
    type: FeatureChoiceType.Feat,
    behavior: FeatureChoiceBehavior.Single,
    formulaParamsId: 123, // Links to formula parameters
    // Choice availability scales with level
}
```

### **Modifier System Integration**
Choices can trigger modifiers based on selections:

```typescript
// Modifier applied when specific choice is made
{
    type: ModifierType.Bonus,
    appliesTo: ModifierAppliesToType.Attack,
    value: 2,
    // Applied when specific creature type is chosen as favored enemy
}
```

### **Character System Integration**
Player choices are tracked in the character system:

```typescript
// CharacterFeatureChoice tracks player selections
{
    characterId: 123,
    featureChoiceId: 456,
    selectedValue: "dragon", // Chosen creature type
    // Used for character calculations
}
```

## 📚 **Related Documentation**

- **[Modifier System](./modifier-system.md)** - How choices integrate with modifiers
- **[Formula System](./formula-system.md)** - How choices use formulas for progression
- **[Examples](./examples.md)** - Comprehensive implementation examples
- **[Frontend Components](./frontend-components.md)** - UI implementation details
