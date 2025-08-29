# Modifier System

The modifier system is the core mechanism for implementing mechanical effects in the feature system. It provides a flexible framework for modeling everything from simple bonuses to complex, conditional effects that scale with character level.

## 📋 **Overview**

The modifier system enables features to provide mechanical effects that can be:
- **Applied conditionally** based on specific circumstances
- **Scaled dynamically** using mathematical formulas
- **Stacked properly** according to D&D rules
- **Targeted precisely** to specific character statistics

This system is used to model complex game mechanics like:
- **Monk's Unarmed Strike**: Replaces base unarmed damage with scaling dice
- **Fighter's Weapon Focus**: Provides attack bonuses with specific weapon types
- **Ranger's Favored Enemy**: Grants conditional bonuses against specific creature types
- **Cleric's Turn Undead**: Provides turn attempts that scale with level and Charisma

**Source Files**: 
- Database Schema: `apps/backend/prisma/schema.prisma` (FeatureModifier, FeatureModifierCondition, FeatureFormulaParams models)
- Validation Schemas: `packages/shared/schema/src/feature.ts` (FeatureModifierSchema, FeatureModifierConditionSchema)
- Static Data: `packages/shared/static-data/src/FeatureData.ts` (ModifierType, ModifierAppliesToType, FeatureBonusType enums)
- Backend Service: `apps/backend/src/features/featureSystem/featureSystemService.ts` (createMultipleFeatureProgressions)
- Formula System: `apps/backend/src/utils/formulaParamTransformers.ts` (formula parameter handling)

## 🏗️ **System Architecture**

### **Core Components**

The modifier system consists of three interconnected components:

**FeatureModifier**: The main modifier entity that defines what effect is applied
**FeatureModifierCondition**: Optional conditions that determine when the modifier applies
**FeatureFormulaParams**: Optional mathematical formulas for dynamic value calculation

### **Data Flow**

1. **Database Layer**: Modifiers stored with feature progressions, conditions, and formula parameters
2. **Validation Layer**: Zod schemas ensure type safety and data integrity
3. **Static Data Layer**: Enums define available types, targets, and bonus types
4. **Backend Layer**: Service methods create and manage modifiers with proper relationships
5. **Frontend Layer**: UI components allow configuration of modifiers with validation

## 🎯 **Modifier Types and Their Uses**

### **Bonus Modifiers (0)**

Modifiers that add to or subtract from existing values, following D&D stacking rules.

**Database Storage**: `type: 0, value: number, bonusType: number, appliesTo: number`

**Real Examples**:

**Fighter's Weapon Focus**:
```typescript
{
  type: ModifierType.Bonus,           // 0
  value: 1,                          // +1 bonus
  bonusType: FeatureBonusType.Feat,  // Feat bonus type
  appliesTo: ModifierAppliesToType.Attack,  // Attack rolls
  appliesToId: 15                    // Longsword weapon ID
}
```

**Ranger's Favored Enemy**:
```typescript
{
  type: ModifierType.Bonus,           // 0
  value: 2,                          // +2 bonus
  bonusType: FeatureBonusType.Racial, // Racial bonus type
  appliesTo: ModifierAppliesToType.Attack,  // Attack rolls
  conditions: [{
    conditionType: FeatureModifierConditionType.attack_type,
    conditionValue: ATTACK_TYPE_ENUM.MELEE  // Only melee attacks
  }]
}
```

**Compatible Targets**: Ability scores, Skills, Saving throws, AC, Attack rolls, Damage, Damage reduction, Initiative

### **Quantity Modifiers (1)**

Modifiers that set specific values rather than adding to existing ones.

**Database Storage**: `type: 1, value: number, appliesTo: number`

**Real Examples**:

**Monk's Movement Speed**:
```typescript
{
  type: ModifierType.Quantity,        // 1
  value: 30,                         // 30 feet
  appliesTo: ModifierAppliesToType.MovementSpeed  // Movement speed
}
```

**Rogue's Sneak Attack**: Uses `FormulaId.EVERY_N_LEVELS` for damage progression. See **[formula-system.md](./formula-system.md)** for complete formula examples.

**Compatible Targets**: Movement speed, Hit dice, Uses per day, Targets, Distance, Extra attacks, Damage, Healing, Spell resistance

### **Replacement Modifiers (2)**

Modifiers that completely replace existing values.

**Database Storage**: `type: 2, value: number, appliesTo: number`

**Real Examples**:

**Monk's Unarmed Strike**: Uses `FormulaId.CONDITIONAL_SCALING` for damage progression. See **[formula-system.md](./formula-system.md)** for complete formula examples.

**Compatible Targets**: Damage, Unarmed damage, Movement speed, Ability scores

### **Other Modifiers (3)**

Modifiers for special cases that don't fit the standard categories.

**Database Storage**: `type: 3, value: number, appliesTo: number`

**Real Examples**:

**Language Grant**:
```typescript
{
  type: ModifierType.Other,           // 3
  value: 1,                          // 1 language
  appliesTo: ModifierAppliesToType.BonusLanguage  // Bonus language
}
```

**Compatible Targets**: Other, Bonus languages, Automatic languages, Feats

## 🔧 **Conditional Modifiers**

Modifiers can be applied conditionally using the FeatureModifierCondition system.

### **Condition Types**

**trigger (0)**: Conditional triggers for modifier activation
**attack_type (1)**: Specific attack type requirements (melee, ranged, etc.)
**character_size (2)**: Character size requirements
**other (3)**: Other condition types
**feature (4)**: Feature-based conditions
**spell_school (5)**: Spell school requirements

### **Real Example: Power Attack**

```typescript
{
  type: ModifierType.Bonus,
  value: -1,                         // -1 to attack
  bonusType: FeatureBonusType.Circumstance,
  appliesTo: ModifierAppliesToType.Attack,
  conditions: [{
    conditionType: FeatureModifierConditionType.attack_type,
    conditionValue: ATTACK_TYPE_ENUM.POWER_ATTACK  // Only with Power Attack
  }]
}
```

## 📊 **Formula-Based Modifiers**

Modifiers can use mathematical formulas for dynamic value calculation.

### **Formula Parameters**

**Database Storage**: Arrays stored as comma-separated strings, transformed for application use

**Real Example: Rogue's Sneak Attack Progression**: Uses `FormulaId.EVERY_N_LEVELS` for damage progression. See **[formula-system.md](./formula-system.md)** for complete formula examples.

### **Formula Transformation**

The system transforms formula parameters between database storage (strings) and application use (arrays):

```typescript
// Database storage
thresholds: "1,4,8,12,16,20"
values: "1,1,1,1,2,2"

// Application use
thresholds: [1, 4, 8, 12, 16, 20]
values: [1, 1, 1, 1, 2, 2]
```

## 🎮 **Complex Feature Examples**

### **Monk's Unarmed Strike Feature**

This feature combines multiple modifier types to create a complex ability. For complete implementation examples, see **[examples.md](./examples.md)**.

**Key Components**:
1. **Replacement Modifier**: Unarmed damage with conditional scaling formula
2. **Other Modifier**: Direct feat grant (Improved Unarmed Strike)
3. **Bonus Modifier**: Attack penalty with conditional activation

### **Fighter's Weapon Specialization**

For complete implementation examples, see **[examples.md](./examples.md)**.

**Key Components**:
1. **Bonus Modifier**: Attack bonus with specific weapon targeting
2. **Bonus Modifier**: Damage bonus with same weapon targeting
  appliesToId: 15  // Longsword weapon ID
}
```

### **Ranger's Favored Enemy**

```typescript
// 1. Attack bonus against specific creature type
{
  type: ModifierType.Bonus,
  value: 2,
  bonusType: FeatureBonusType.Racial,
  appliesTo: ModifierAppliesToType.Attack,
  conditions: [{
    conditionType: FeatureModifierConditionType.other,
    conditionValue: CreatureType.Undead  // Against undead
  }]
}

// 2. Damage bonus against same creature type
{
  type: ModifierType.Bonus,
  value: 2,
  bonusType: FeatureBonusType.Racial,
  appliesTo: ModifierAppliesToType.Damage,
  conditions: [{
    conditionType: FeatureModifierConditionType.other,
    conditionValue: CreatureType.Undead  // Against undead
  }]
}
```

## 🔗 **Integration with Other Systems**

### **Feature Progression Integration**

Modifiers are created as part of feature progressions:

```typescript
// Backend service creates modifiers with feature progressions
async createMultipleFeatureProgressions(progressions, context, tx) {
  for (const progression of progressions) {
    const featureProgression = await tx.featureProgression.create({
      data: { ...progressionData, classId: context.classId }
    });
    
    // Create modifiers for this progression
    for (const modifier of progression.modifiers) {
      const createdModifier = await tx.featureModifier.create({
        data: { ...modifierData, featureProgressionId: featureProgression.id }
      });
      
      // Create conditions and formula params if needed
      if (modifier.conditions) {
        await tx.featureModifierCondition.createMany({
          data: modifier.conditions.map(c => ({
            ...c, featureModifierId: createdModifier.id
          }))
        });
      }
    }
  }
}
```

### **Character Calculation Integration**

Modifiers are applied to character statistics during calculations:

1. **Retrieve Modifiers**: Get all modifiers for character's features
2. **Check Conditions**: Evaluate conditions for each modifier
3. **Apply Stacking**: Apply stacking rules based on bonus types
4. **Calculate Values**: Use formulas for dynamic value calculation
5. **Update Statistics**: Apply final values to character statistics

## 🛠️ **Usage Patterns**

### **Creating Modifiers**

Modifiers are typically created through the feature system:

1. **Define Feature Progression**: Set up when the feature is gained
2. **Configure Modifiers**: Define the mechanical effects
3. **Set Conditions**: Add conditional logic if needed
4. **Add Formulas**: Configure dynamic scaling if needed
5. **Validate**: Ensure all parameters are valid
6. **Create**: Use backend service to create with proper relationships

### **Modifier Validation**

The system validates modifiers at multiple levels:

1. **Type Validation**: Ensure modifier types are valid
2. **Target Validation**: Ensure targets are compatible with types
3. **Condition Validation**: Validate conditional logic
4. **Formula Validation**: Validate formula parameters
5. **Relationship Validation**: Ensure proper database relationships

## 🔄 **System Capabilities**

The modifier system can model:

- **Simple Bonuses**: +2 to attack rolls, +1 to AC
- **Conditional Effects**: Bonuses that only apply in specific circumstances
- **Scaling Abilities**: Effects that improve with character level
- **Complex Interactions**: Multiple modifiers working together
- **Game Rule Compliance**: Proper stacking and interaction rules
- **Dynamic Calculation**: Real-time value calculation based on character state

This system provides the foundation for implementing virtually any mechanical effect in the D&D system, from simple racial bonuses to complex class features with multiple interacting components.
