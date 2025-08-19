# Formula System Analysis

*Comprehensive analysis of D&D 3.5 scaling patterns and the new formula system.*

## Overview

The formula system replaces the text-based `valueFormula` approach with a `formulaId` system that references pre-defined formulas in `shared/static-data/src/FormulaDefinitions.ts`. This provides:

- **Type Safety**: No runtime formula parsing errors
- **Maintainability**: Centralized formula definitions
- **Performance**: No string evaluation overhead
- **Clarity**: Clear, documented formulas with parameters

## D&D 3.5 Scaling Patterns Analysis

### **Barbarian Class Features**

#### Rage Uses per Day
```
Level 1:  1/day
Level 4:  2/day  
Level 8:  3/day
Level 12: 4/day
Level 16: 5/day
Level 20: 6/day
```
**Formula**: `uses_1_to_6` - Handles the exact progression pattern

#### Rage STR/CON Bonus
```
Level 1-10:  +4 to STR and CON
Level 11-20: +6 to STR and CON
```
**Formula**: `barbarian_rage_bonus` - Conditional scaling based on level

#### Trap Sense
```
Level 3:  +1
Level 6:  +2
Level 9:  +3
Level 12: +4
Level 15: +5
Level 18: +6
```
**Formula**: `every_3_levels` - Increases every 3 levels

#### Damage Reduction
```
Level 7:  1/-
Level 10: 2/-
Level 13: 3/-
Level 16: 4/-
Level 19: 5/-
```
**Formula**: `barbarian_damage_reduction` - Specific DR progression

### **Rogue Class Features**

#### Sneak Attack Damage
```
Level 1:  1d6
Level 3:  2d6
Level 5:  3d6
Level 7:  4d6
Level 9:  5d6
Level 11: 6d6
Level 13: 7d6
Level 15: 8d6
Level 17: 9d6
Level 19: 10d6
```
**Formula**: `sneak_attack_dice` - +1d6 every 2 levels

### **Monk Class Features**

#### Unarmed Damage
```
Level 1-3:  1d6
Level 4-7:  1d8
Level 8-11: 1d10
Level 12-15: 2d6
Level 16-19: 2d8
Level 20:    2d10
```
**Formula**: `monk_unarmed_damage` - Complex damage progression

#### AC Bonus
```
Level 1-4:  +0
Level 5-7:  +1
Level 8-10: +2
Level 11-13: +3
Level 14-16: +4
Level 17-20: +5
```
**Formula**: `monk_ac_bonus` - AC bonus progression

### **Fighter Class Features**

#### Bonus Feats
```
Level 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20: +1 bonus feat
```
**Formula**: `fighter_bonus_feats` - Counts feats at specific levels

## Formula Complexity Guidelines

### **Simple Formulas (Use Most Often)**
- **Linear scaling**: `linear_1`, `linear_2`
- **Every N levels**: `every_2_levels`, `every_3_levels`
- **Fixed values**: `fixed_1`, `fixed_2`
- **Common patterns**: `uses_1_to_6`, `sneak_attack_dice`

**When to use**: 90% of feature scaling should use simple formulas.

### **Medium Complexity (Use When Needed)**
- **Conditional scaling**: `barbarian_rage_bonus`, `barbarian_damage_reduction`
- **Class-specific patterns**: `monk_unarmed_damage`, `monk_ac_bonus`, `fighter_bonus_feats`

**When to use**: When simple formulas don't match the exact D&D pattern.

### **Complex Formulas (Use Sparingly)**
- **Multiclass calculations**: `multiclass_bab`
- **Size-based adjustments**: `size_damage_adjustment`

**When to use**: Only for truly complex calculations that can't be handled by explicit progressions.

## When to Use Formulas vs Explicit Progressions

### **Use Formulas When:**
1. **Clear mathematical pattern** exists (linear, every N levels)
2. **Common D&D pattern** (sneak attack, rage uses, etc.)
3. **Simple conditional logic** (level thresholds)
4. **Reusable across multiple features**

### **Use Explicit Progressions When:**
1. **Irregular progression** (no clear mathematical pattern)
2. **Complex conditional logic** (multiple factors)
3. **Unique feature** (not covered by existing formulas)
4. **Performance critical** (avoid formula calculation overhead)

## Implementation Examples

### **Barbarian Rage (Level 1)**
```typescript
{
    type: ModifierType.Bonus,
    appliesTo: ModifierAppliesToType.Attribute,
    appliesToId: ABILITY_MAP.STR,
    value: 4, // Base value
    formulaId: 'barbarian_rage_bonus', // Will calculate +4 or +6 based on level
    bonusType: FeatureBonusType.Morale,
    conditions: [{ type: 'trigger', value: 'rage_active' }]
}
```

### **Rogue Sneak Attack (Level 1)**
```typescript
{
    type: ModifierType.Quantity,
    appliesTo: ModifierAppliesToType.Damage,
    appliesToId: RpgDice.D6,
    value: 1, // Base value
    formulaId: 'sneak_attack_dice', // Will calculate actual dice based on level
    conditions: [{ type: 'attack_type', value: 'sneak_attack' }]
}
```

### **Fighter Bonus Feat (Level 1)**
```typescript
{
    type: ModifierType.Quantity,
    appliesTo: ModifierAppliesToType.Feat,
    value: 1, // Base value
    formulaId: 'fighter_bonus_feats', // Will count total bonus feats
    bonusType: FeatureBonusType.Other
}
```

## Formula Categories

### **Combat**
- Attack bonuses, damage, AC, DR
- Examples: `barbarian_rage_bonus`, `sneak_attack_dice`, `monk_ac_bonus`

### **Resource**
- Uses per day, charges, points
- Examples: `uses_1_to_6`

### **Utility**
- Skills, feats, abilities
- Examples: `fighter_bonus_feats`

### **Scaling**
- Level-based progression patterns
- Examples: `linear_1`, `every_2_levels`, `every_3_levels`

### **Conditional**
- Context-dependent calculations
- Examples: `multiclass_bab`, `size_damage_adjustment`

## Migration Strategy

### **Phase 1: Schema Update**
- ✅ Replace `valueFormula` with `formulaId` in schemas
- ✅ Create formula definitions in `shared/static-data/src/FormulaDefinitions.ts`
- ⏳ Update database schema (requires migration)

### **Phase 2: Frontend Updates**
- ⏳ Update `FeatureProgressionDetailEdit.tsx` to use formula selector
- ⏳ Add formula parameter input fields
- ⏳ Add formula preview/validation

### **Phase 3: Backend Updates**
- ⏳ Update calculation engine to use formulas
- ⏳ Add formula validation in API endpoints
- ⏳ Update existing data to use formulas where appropriate

### **Phase 4: Testing & Validation**
- ⏳ Test all formulas against D&D 3.5 rules
- ⏳ Validate performance impact
- ⏳ Update documentation and examples

## Benefits of the New System

### **For Developers**
- **Type Safety**: No runtime formula parsing errors
- **IntelliSense**: IDE support for formula parameters
- **Maintainability**: Centralized formula definitions
- **Testing**: Easy to unit test individual formulas

### **For Users**
- **Reliability**: No syntax errors in formulas
- **Clarity**: Clear parameter requirements
- **Performance**: Faster calculation than string evaluation
- **Documentation**: Built-in descriptions and examples

### **For the System**
- **Security**: No arbitrary code execution
- **Performance**: No string parsing overhead
- **Scalability**: Easy to add new formulas
- **Consistency**: Standardized calculation patterns

## Future Enhancements

### **Potential New Formulas**
- **Spellcasting**: Caster level calculations
- **Skills**: Maximum rank calculations
- **Saves**: Base save bonus calculations
- **Multiclass**: Experience point calculations

### **Formula Composition**
- **Chained formulas**: Output of one formula feeds into another
- **Conditional formulas**: Different formulas based on conditions
- **Parameter validation**: Runtime parameter type checking

### **Formula Management**
- **Formula versioning**: Track formula changes over time
- **Formula deprecation**: Mark formulas as obsolete
- **Formula testing**: Automated validation against D&D rules
