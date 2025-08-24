# Feat System Schema Reference

*Database schema and enum definitions for feat definitions, prerequisites, benefits, and feat mechanics.*

## Core Feat Models

### **Feat Schema**
**Source**: `packages/shared/schema/src/feat.ts`

The feat schema defines the core structure for feat definitions, including all feat properties, benefits, and prerequisites. This is the central schema for all feat-related functionality.

**Key Fields**:
- `name`: Feat name (required, max 200 characters)
- `typeId`: Feat type reference (required, positive integer)
- `description`: General feat description (optional, max 10000 characters)
- `benefit`: Feat benefit description (optional, max 2000 characters)
- `normalEffect`: Normal effect description (optional, max 2000 characters)
- `specialEffect`: Special effect description (optional, max 2000 characters)
- `prerequisites`: Prerequisites text (optional, max 2000 characters)
- `repeatable`: Whether feat can be taken multiple times (optional boolean)
- `fighterBonus`: Whether feat is a fighter bonus feat (optional boolean)
- `benefits`: Array of feat benefits
- `prereqs`: Array of feat prerequisites

## Feat Classification Models

### **Feat Types**
**Source**: `packages/shared/static-data/src/FeatData.ts`

The feat system supports three main types of feats:

#### **General Feats**
- Standard feats available to all characters
- Examples: Power Attack, Weapon Focus, Toughness
- `typeId: 1`

#### **Item Creation Feats**
- Feats for creating magic items
- Examples: Craft Magic Arms and Armor, Craft Wondrous Item
- `typeId: 2`

#### **Metamagic Feats**
- Feats that modify spellcasting
- Examples: Empower Spell, Extend Spell, Maximize Spell
- `typeId: 3`

### **Feat Benefit Types**
**Source**: `packages/shared/static-data/src/FeatData.ts`

Defines the types of benefits that feats can provide:

- **1 - Skill**: Skill bonuses and modifications
- **2 - Save**: Saving throw bonuses
- **3 - Proficiency**: Weapon and armor proficiencies

### **Feat Prerequisite Types**
**Source**: `packages/shared/static-data/src/FeatData.ts`

Defines the types of prerequisites that feats can have:

- **1 - Ability**: Ability score requirements
- **2 - Skill**: Skill rank requirements
- **3 - Feat**: Other feat requirements
- **4 - BAB**: Base Attack Bonus requirements
- **5 - Spellcasting**: Spellcasting level requirements
- **6 - Special**: Special requirements
- **7 - Class Level**: Class level requirements
- **8 - Proficiency**: Proficiency requirements
- **9 - Class Feature**: Class feature requirements

## Feat Benefit Models

### **FeatBenefitMap Schema**
**Source**: `packages/shared/schema/src/feat.ts`

Defines the benefits that a feat provides:

**Key Fields**:
- `typeId`: Benefit type reference (required, positive integer)
- `referenceId`: Reference to specific skill, save, or proficiency (optional, positive integer)
- `amount`: Benefit amount or value (optional, non-negative integer)
- `index`: Order index for multiple benefits (required, non-negative integer)

### **Benefit Examples**
```typescript
// Skill bonus benefit
{
    typeId: 1, // Skill
    referenceId: 1, // Climb skill
    amount: 2, // +2 bonus
    index: 0
}

// Save bonus benefit
{
    typeId: 2, // Save
    referenceId: 1, // Fortitude save
    amount: 1, // +1 bonus
    index: 0
}

// Proficiency benefit
{
    typeId: 3, // Proficiency
    referenceId: 1, // Longsword proficiency
    amount: null, // No amount needed
    index: 0
}
```

## Feat Prerequisite Models

### **FeatPrerequisiteMap Schema**
**Source**: `packages/shared/schema/src/feat.ts`

Defines the prerequisites that a feat requires:

**Key Fields**:
- `typeId`: Prerequisite type reference (required, positive integer)
- `referenceId`: Reference to specific ability, skill, feat, etc. (optional, integer)
- `amount`: Required amount or value (optional, non-negative integer)
- `featureSlug`: Feature slug for class feature prerequisites (optional, max 200 characters)
- `index`: Order index for multiple prerequisites (required, non-negative integer)

### **Prerequisite Examples**
```typescript
// Ability score prerequisite
{
    typeId: 1, // Ability
    referenceId: 1, // Strength
    amount: 13, // Str 13 required
    index: 0
}

// Skill prerequisite
{
    typeId: 2, // Skill
    referenceId: 1, // Climb skill
    amount: 4, // 4 ranks required
    index: 0
}

// BAB prerequisite
{
    typeId: 4, // BAB
    referenceId: null, // No specific reference
    amount: 4, // BAB +4 required
    index: 0
}

// Class feature prerequisite
{
    typeId: 9, // Class Feature
    referenceId: null, // No specific reference
    amount: null, // No amount needed
    featureSlug: "rage", // Rage class feature required
    index: 0
}
```

## Character Feat Models

### **AdvancementFeat Schema**
**Source**: `packages/shared/schema/src/character.ts`

Defines the relationship between characters and their feat selections:

**Key Fields**:
- `characterId`: Reference to the character
- `classId`: Reference to the class (for multiclassing)
- `featId`: Reference to the feat
- `level`: Level when feat was gained
- `isFighterBonus`: Whether this is a fighter bonus feat

## Feat Query System

### **Feat Query Schema**
**Source**: `packages/shared/schema/src/feat.ts`

Defines the query system for character feat selection:

**Query Types**:
- **'proficiency'**: Query for proficiency-related feats
- **'all'**: Query for all available feats

### **Character Feat Selection**
The feat system provides advanced querying capabilities for character feat selection:

```typescript
// Query for proficiency feats
const proficiencyFeats = await FeatService.featQuery({
    queryType: 'proficiency'
});

// Query for all feats
const allFeats = await FeatService.featQuery({
    queryType: 'all'
});
```

## Integration with Character System

### **Prerequisite Validation**
Characters must meet all feat prerequisites before selecting a feat:

```typescript
const meetsPrerequisites = (character, feat) => {
    for (const prereq of feat.prereqs) {
        switch (prereq.typeId) {
            case 1: // Ability
                const abilityScore = getAbilityScore(character, prereq.referenceId);
                if (abilityScore < prereq.amount) return false;
                break;
            case 2: // Skill
                const skillRanks = getSkillRanks(character, prereq.referenceId);
                if (skillRanks < prereq.amount) return false;
                break;
            case 3: // Feat
                const hasFeat = character.feats.some(f => f.featId === prereq.referenceId);
                if (!hasFeat) return false;
                break;
            case 4: // BAB
                const bab = calculateBAB(character);
                if (bab < prereq.amount) return false;
                break;
            // ... other prerequisite types
        }
    }
    return true;
};
```

### **Feat Benefit Application**
Feat benefits are applied to character statistics:

```typescript
const applyFeatBenefits = (character, feat) => {
    for (const benefit of feat.benefits) {
        switch (benefit.typeId) {
            case 1: // Skill
                character.skills[benefit.referenceId].bonus += benefit.amount;
                break;
            case 2: // Save
                character.saves[benefit.referenceId].bonus += benefit.amount;
                break;
            case 3: // Proficiency
                character.proficiencies.push(benefit.referenceId);
                break;
        }
    }
};
```

## Key Relationships

### **Feat Definition Flow**
```
Feat (Feat Definition)
├── FeatBenefitMap (Feat Benefits)
├── FeatPrerequisiteMap (Feat Prerequisites)
├── Character Feats (Character Selections)
└── Feature Integration (Direct Feat Grants)
```

### **Character Feat Management**
```
Character → AdvancementFeat → Feat
├── Prerequisite Validation
├── Benefit Application
├── Feat Tracking
└── Level Progression
```

### **Feature System Integration**
```
Feature → FeatureModifier → Feat
├── Direct Feat Grants
├── Feat Prerequisites
└── Feat Choices
```

This schema provides a comprehensive foundation for all feat-related functionality, with excellent integration across the character, class, and feature systems.
