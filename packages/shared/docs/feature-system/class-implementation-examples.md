# Class Implementation Examples

*Comprehensive examples of feature system implementation using real D&D classes as case studies.*

## 📋 **Overview**

This document provides detailed analysis of how D&D class features are implemented using the feature system's database schema, validation rules, and static data enums. We examine the Monk, Bard, and Druid classes to demonstrate different implementation patterns and approaches.

**Source Data**: 
- Monk class object (ID: 22) with 25 feature progressions and 50+ feature entities
- Bard class object (ID: 18) with comprehensive feature implementations
- Druid class object (ID: 20) with complex feature progressions and cross-system integration

## 🏗️ **Monk Class Structure**

The Monk class demonstrates the complete feature system implementation:

**Class Information**:
- **ID**: 22
- **Name**: "Monk"
- **Abbreviation**: "Mnk"
- **Hit Die**: 2 (d8)
- **Skill Points**: 4 per level
- **Features**: 25 feature progressions covering levels 1-20

**Source File**: Class object data from database

## 🎯 **Entity Type Examples**

### **Bonus Entities (Type 0)**

#### **AC Bonus - Wisdom Modifier**
**FeatureProgression ID**: 16592 (Level 1)
**FeatureEntity ID**: 863

```json
{
  "type": 0,                    // Bonus entity
  "appliesTo": 3,               // AC (Armor Class)
  "appliesToId": null,          // No specific target
  "value": 0,                   // Base value (Wisdom modifier added via formula)
  "formulaParams": {
    "formulaId": 7,             // Ability-based formula
    "abilityId": 5,             // Wisdom (5)
    "includeProgressionLevel": true
  }
}
```

**Implementation**: Adds Wisdom modifier to AC when unarmored and unencumbered.

#### **AC Bonus - Level-Based Progression**
**FeatureProgression ID**: 16646 (Level 5)
**FeatureEntity ID**: 899

```json
{
  "type": 0,                    // Bonus entity
  "appliesTo": 3,               // AC (Armor Class)
  "appliesToId": null,          // No specific target
  "value": 1,                   // Base bonus value
  "formulaParams": {
    "formulaId": 2,             // Interval-based formula
    "interval": 5,              // Every 5 levels
    "includeProgressionLevel": true
  }
}
```

**Implementation**: +1 AC bonus at 5th level, increasing by 1 every 5 levels thereafter (+2 at 10th, +3 at 15th, +4 at 20th).

#### **Still Mind - Enchantment Save Bonus**
**FeatureProgression ID**: 16634 (Level 3)
**FeatureEntity ID**: 884

```json
{
  "type": 0,                    // Bonus entity
  "appliesTo": 2,               // SavingThrow
  "appliesToId": -1,            // All saving throws
  "value": 2,                   // +2 bonus
  "conditions": [{
    "conditionType": 5,         // Spell school condition
    "conditionValue": 4         // Enchantment school
  }]
}
```

**Implementation**: +2 bonus on saving throws against enchantment spells.

### **Quantity Entities (Type 1)**

#### **Fast Movement**
**FeatureProgression ID**: 16613 (Level 3)
**FeatureEntity ID**: 869

```json
{
  "type": 1,                    // Quantity entity
  "appliesTo": 8,               // MovementSpeed
  "appliesToId": null,          // No specific target
  "value": 10,                  // +10 feet
  "formulaParams": {
    "formulaId": 2,             // Interval-based formula
    "interval": 3,              // Every 3 levels
    "includeProgressionLevel": true
  }
}
```

**Implementation**: +10 feet enhancement bonus to movement speed.

#### **Extra Attacks (Flurry of Blows)**
**FeatureProgression ID**: 16616 (Level 1)
**FeatureEntity ID**: 875

```json
{
  "type": 1,                    // Quantity entity
  "appliesTo": 17,              // ExtraAttacks
  "appliesToId": null,          // No specific target
  "value": 0,                   // Base value (calculated via formula)
  "formulaParams": {
    "formulaId": 3,             // Threshold-based formula
    "thresholds": [1, 11],      // Level thresholds
    "values": [1, 2],           // Extra attacks at each threshold
    "includeProgressionLevel": true
  }
}
```

**Implementation**: 1 extra attack at 1st level, 2 extra attacks at 11th level.

#### **Spell Resistance (Diamond Soul)**
**FeatureProgression ID**: 16604 (Level 13)
**FeatureEntity ID**: 866

```json
{
  "type": 1,                    // Quantity entity
  "appliesTo": 19,              // SpellResistance
  "appliesToId": null,          // No specific target
  "value": 10,                  // Base SR value
  "formulaParams": {
    "formulaId": 10,            // Level-based formula
    "includeProgressionLevel": true
  }
}
```

**Implementation**: Spell Resistance equal to monk level + 10.

#### **Healing (Wholeness of Body)**
**FeatureProgression ID**: 16643 (Level 7)
**FeatureEntity ID**: 896

```json
{
  "type": 1,                    // Quantity entity
  "appliesTo": 18,              // Healing
  "appliesToId": null,          // No specific target
  "value": 2,                   // Multiplier (2x monk level)
  "formulaParams": {
    "formulaId": 9,             // Level-based formula
    "includeProgressionLevel": true
  }
}
```

**Implementation**: Heal 2x monk level hit points per day.

#### **Slow Fall Distance**
**FeatureProgression ID**: 16631 (Level 4)
**FeatureEntity ID**: 881

```json
{
  "type": 1,                    // Quantity entity
  "appliesTo": 12,              // Distance
  "appliesToId": null,          // No specific target
  "value": 10,                  // Base reduction
  "formulaParams": {
    "formulaId": 2,             // Interval-based formula
    "interval": 2,              // Every 2 levels
    "formulaStartLevel": 4,     // Starting at 4th level
    "includeProgressionLevel": true
  }
}
```

**Implementation**: Reduce falling damage by 20 feet at 4th level, improving by 10 feet every 2 levels.

### **Replacement Entities (Type 2)**

#### **Unarmed Strike Damage (Medium)**
**FeatureProgression ID**: 16640 (Level 1)
**FeatureEntity ID**: 887

```json
{
  "type": 2,                    // Replacement entity
  "appliesTo": 20,              // UnarmedDamage
  "appliesToId": null,          // No specific target
  "value": 0,                   // Base value (replaced via formula)
  "formulaParams": {
    "formulaId": 3,             // Threshold-based formula
    "thresholds": [1, 4, 8, 12, 16, 20],  // Level thresholds
    "values": ["1d6", "1d8", "1d10", "2d6", "2d8", "2d10"],  // Damage dice
    "includeProgressionLevel": true
  }
}
```

**Implementation**: Replaces unarmed damage with progressive dice: 1d6 (1st), 1d8 (4th), 1d10 (8th), 2d6 (12th), 2d8 (16th), 2d10 (20th).

#### **Unarmed Strike Damage (Small)**
**FeatureProgression ID**: 16640 (Level 1)
**FeatureEntity ID**: 890

```json
{
  "type": 2,                    // Replacement entity
  "appliesTo": 20,              // UnarmedDamage
  "appliesToId": null,          // No specific target
  "value": 0,                   // Base value (replaced via formula)
  "displayInDetail": false,     // Hidden from detail view
  "formulaParams": {
    "formulaId": 3,             // Threshold-based formula
    "thresholds": [1, 4, 8, 12, 16, 20],  // Level thresholds
    "values": ["1d4", "1d6", "1d8", "1d10", "2d6", "2d8"],  // Small creature damage
    "includeProgressionLevel": true
  }
}
```

**Implementation**: Small creature unarmed damage progression.

#### **Unarmed Strike Damage (Large)**
**FeatureProgression ID**: 16640 (Level 1)
**FeatureEntity ID**: 893

```json
{
  "type": 2,                    // Replacement entity
  "appliesTo": 20,              // UnarmedDamage
  "appliesToId": null,          // No specific target
  "value": 0,                   // Base value (replaced via formula)
  "displayInDetail": false,     // Hidden from detail view
  "formulaParams": {
    "formulaId": 3,             // Threshold-based formula
    "thresholds": [1, 4, 8, 12, 16, 20],  // Level thresholds
    "values": ["1d8", "2d6", "2d8", "3d6", "3d8", "4d8"],  // Large creature damage
    "includeProgressionLevel": true
  }
}
```

**Implementation**: Large creature unarmed damage progression.

### **Choice Entities (Type 5)**

#### **Bonus Feat - 1st Level Choices**
**FeatureProgression ID**: 16598 (Level 1)
**FeatureEntity IDs**: 1565, 1568

```json
{
  "type": 5,                    // Choice entity
  "appliesTo": 21,              // Feat
  "appliesToId": 141,           // Improved Grapple
  "appliesToSubId": null,       // No sub-target
  "value": 1,                   // Grant 1 feat
  "groupingId": 1,              // Grouped with other 1st level choices
  "feat": {
    "id": 141,
    "name": "Improved Grapple",
    "typeId": 1,
    "description": "You are skilled at grappling opponents."
  }
}
```

```json
{
  "type": 5,                    // Choice entity
  "appliesTo": 21,              // Feat
  "appliesToId": 288,           // Stunning Fist
  "appliesToSubId": null,       // No sub-target
  "value": 1,                   // Grant 1 feat
  "groupingId": 1,              // Grouped with other 1st level choices
  "feat": {
    "id": 288,
    "name": "Stunning Fist",
    "typeId": 1,
    "description": "You know how to strike opponents in vulnerable areas."
  }
}
```

**Implementation**: Player chooses between Improved Grapple or Stunning Fist at 1st level.

#### **Bonus Feat - 2nd Level Choices**
**FeatureProgression ID**: 16649 (Level 2)
**FeatureEntity IDs**: 1571, 1574

```json
{
  "type": 5,                    // Choice entity
  "appliesTo": 21,              // Feat
  "appliesToId": 39,            // Combat Reflexes
  "appliesToSubId": null,       // No sub-target
  "value": 1,                   // Grant 1 feat
  "groupingId": 1,              // Grouped with other 2nd level choices
  "feat": {
    "id": 39,
    "name": "Combat Reflexes",
    "typeId": 1,
    "description": "You can respond quickly and repeatedly to opponents who let their defenses down."
  }
}
```

```json
{
  "type": 5,                    // Choice entity
  "appliesTo": 21,              // Feat
  "appliesToId": 60,            // Deflect Arrows
  "appliesToSubId": null,       // No sub-target
  "value": 1,                   // Grant 1 feat
  "groupingId": 1,              // Grouped with other 2nd level choices
  "feat": {
    "id": 60,
    "name": "Deflect Arrows",
    "typeId": 1,
    "description": "You can deflect incoming arrows, as well as crossbow bolts, spears, and other projectile or thrown weapons."
  }
}
```

**Implementation**: Player chooses between Combat Reflexes or Deflect Arrows at 2nd level.

#### **Bonus Feat - 6th Level Choices**
**FeatureProgression ID**: 16652 (Level 6)
**FeatureEntity IDs**: 1577, 1580

```json
{
  "type": 5,                    // Choice entity
  "appliesTo": 21,              // Feat
  "appliesToId": 135,           // Improved Disarm
  "appliesToSubId": null,       // No sub-target
  "value": 1,                   // Grant 1 feat
  "groupingId": 1,              // Grouped with other 6th level choices
  "feat": {
    "id": 135,
    "name": "Improved Disarm",
    "typeId": 1,
    "description": "You know how to disarm opponents in melee combat."
  }
}
```

```json
{
  "type": 5,                    // Choice entity
  "appliesTo": 21,              // Feat
  "appliesToId": 159,           // Improved Trip
  "appliesToSubId": null,       // No sub-target
  "value": 1,                   // Grant 1 feat
  "groupingId": 1,              // Grouped with other 6th level choices
  "feat": {
    "id": 159,
    "name": "Improved Trip",
    "typeId": 1,
    "description": "You are trained not only in tripping opponents safely but also in following through with an attack."
  }
}
```

**Implementation**: Player chooses between Improved Disarm or Improved Trip at 6th level.

### **Proficiency Entities (Type 4)**

#### **Class Skills**
**FeatureProgression ID**: 16655 (Level 1)
**FeatureEntity IDs**: 902-953 (18 entities)

```json
{
  "type": 4,                    // Proficiency entity
  "appliesTo": 1,               // Skill
  "appliesToId": 2,             // Balance
  "appliesToSubId": null,       // No sub-target
  "value": 0,                   // No additional value
  "groupingId": 1               // Grouped with other class skills
}
```

**Implementation**: Grants proficiency in Balance, Climb, Concentration, Craft, Diplomacy, Escape Artist, Hide, Jump, Knowledge (arcana), Knowledge (religion), Listen, Move Silently, Perform, Profession, Sense Motive, Spot, Swim, and Tumble.

#### **Class Proficiencies**
**FeatureProgression ID**: 16658 (Level 1)
**FeatureEntity IDs**: 956-992 (18 entities)

```json
{
  "type": 4,                    // Proficiency entity
  "appliesTo": 21,              // Feat (used as proficiency)
  "appliesToId": 258,           // Simple Weapon Proficiency
  "appliesToSubId": 24,         // Club
  "value": 0,                   // No additional value
  "groupingId": 1,              // Grouped with other proficiencies
  "item": {
    "id": 24,
    "name": "Club",
    "typeId": 2,
    "description": "A wooden club is so easy to find and fashion that it has no cost."
  },
  "feat": {
    "id": 258,
    "name": "Simple Weapon Proficiency",
    "typeId": 1,
    "description": "You understand how to use all types of simple weapons in combat."
  }
}
```

**Implementation**: Grants proficiency with simple weapons (Club, Crossbow light/heavy, Dagger, Javelin, Quarterstaff, Sling) and exotic monk weapons (Kama, Nunchaku, Sai, Shuriken, Siangham) plus Handaxe.

### **Other Entities (Type 3)**

#### **Ki Strike Enhancement**
**FeatureProgression ID**: 16619 (Level 4)
**FeatureEntity ID**: 878

```json
{
  "type": 3,                    // Other entity
  "appliesTo": 24,              // DamageType (special applies-to for enhancement)
  "appliesToId": null,          // No specific target
  "value": 0,                   // Base value (calculated via formula)
  "formulaParams": {
    "formulaId": 3,             // Threshold-based formula
    "thresholds": [4, 10, 16],  // Level thresholds
    "values": [12, 13, 18],     // Enhancement values
    "valuesRepresent": 1,       // AppliesToId lookup
    "cumulative": true,         // Values accumulate
    "includeProgressionLevel": true
  },
  "conditions": [{
    "conditionType": 1,         // Attack type condition
    "conditionValue": 16        // Unarmed attack
  }]
}
```

**Implementation**: Unarmed attacks treated as magic weapons (4th level), lawful weapons (10th level), and adamantine weapons (16th level).

## 🔧 **Formula System Examples**

### **Ability-Based Formulas (Formula ID 7)**

**Monk AC Bonus - Wisdom Modifier**:
- **Formula ID**: 7
- **Ability ID**: 5 (Wisdom)
- **Implementation**: Adds Wisdom modifier to AC calculation

### **Interval-Based Formulas (Formula ID 2)**

**Monk AC Bonus - Level Progression**:
- **Formula ID**: 2
- **Interval**: 5 (every 5 levels)
- **Implementation**: +1 AC at 5th, +2 at 10th, +3 at 15th, +4 at 20th

**Monk Fast Movement**:
- **Formula ID**: 2
- **Interval**: 3 (every 3 levels)
- **Implementation**: +10ft movement speed

**Monk Slow Fall**:
- **Formula ID**: 2
- **Interval**: 2 (every 2 levels)
- **Formula Start Level**: 4
- **Implementation**: 20ft reduction at 4th, improving by 10ft every 2 levels

### **Threshold-Based Formulas (Formula ID 3)**

**Monk Unarmed Damage**:
- **Formula ID**: 3
- **Thresholds**: [1, 4, 8, 12, 16, 20]
- **Values**: ["1d6", "1d8", "1d10", "2d6", "2d8", "2d10"]
- **Implementation**: Progressive damage dice based on level

**Monk Flurry Attack Penalty**:
- **Formula ID**: 3
- **Thresholds**: [1, 5, 9]
- **Values**: [-2, -1, 0]
- **Implementation**: Attack penalty reduction with level

**Monk Extra Attacks**:
- **Formula ID**: 3
- **Thresholds**: [1, 11]
- **Values**: [1, 2]
- **Implementation**: Extra attacks at specific levels

**Monk Ki Strike Enhancement**:
- **Formula ID**: 3
- **Thresholds**: [4, 10, 16]
- **Values**: [12, 13, 18]
- **Values Represent**: 1 (AppliesToId lookup)
- **Cumulative**: true
- **Implementation**: Progressive weapon enhancement types

### **Level-Based Formulas (Formula ID 9, 10)**

**Monk Healing (Wholeness of Body)**:
- **Formula ID**: 9
- **Value**: 2 (multiplier)
- **Implementation**: 2x monk level hit points per day

**Monk Spell Resistance (Diamond Soul)**:
- **Formula ID**: 10
- **Value**: 10 (base)
- **Implementation**: Monk level + 10

## 🎯 **Condition System Examples**

### **Spell School Conditions**

**Still Mind - Enchantment Resistance**:
- **Condition Type**: 5 (spell_school)
- **Condition Value**: 4 (enchantment)
- **Implementation**: +2 bonus on saves against enchantment spells

### **Attack Type Conditions**

**Ki Strike - Unarmed Attacks**:
- **Condition Type**: 1 (attack_type)
- **Condition Value**: 16 (unarmed attack)
- **Implementation**: Enhancement applies only to unarmed attacks

## 📊 **Grouping System Examples**

### **Bonus Feat Grouping**

All bonus feat entities use `groupingId: 1` to group choices by level:
- **1st Level**: Improved Grapple vs Stunning Fist
- **2nd Level**: Combat Reflexes vs Deflect Arrows  
- **6th Level**: Improved Disarm vs Improved Trip

### **Class Skills Grouping**

All class skill entities use `groupingId: 1` to group related proficiencies together.

### **Class Proficiencies Grouping**

All class proficiency entities use `groupingId: 1` to group weapon proficiencies together.

## 🔗 **Integration Examples**

### **Feat System Integration**

The Monk's bonus feats demonstrate integration with the feat system:
- **FeatureEntity** references specific **Feat** records
- **appliesToId** points to the feat ID
- **feat** object contains complete feat information

### **Item System Integration**

The Monk's weapon proficiencies demonstrate integration with the item system:
- **FeatureEntity** references specific **Item** records
- **appliesToSubId** points to the item ID
- **item** object contains complete item information

### **Skill System Integration**

The Monk's class skills demonstrate integration with the skill system:
- **FeatureEntity** references specific **Skill** records
- **appliesToId** points to the skill ID
- **appliesTo: 1** indicates skill proficiency

## 🎯 **Key Implementation Patterns**

### **Progressive Features**

Many Monk features use threshold-based formulas for progressive improvement:
- **Unarmed Damage**: Progressive dice increases
- **AC Bonus**: Level-based AC improvements
- **Ki Strike**: Progressive weapon enhancement
- **Flurry of Blows**: Attack penalty reduction

### **Choice-Based Features**

The Monk's bonus feats demonstrate the choice system:
- **Multiple entities** with same `groupingId`
- **Different `appliesToId`** for each choice option
- **Complete feat information** in nested objects

### **Conditional Features**

Some Monk features have conditional application:
- **Still Mind**: Only applies to enchantment saves
- **Ki Strike**: Only applies to unarmed attacks

### **Multi-Target Features**

Some features affect multiple targets:
- **Unarmed Damage**: Separate entities for Small, Medium, Large creatures
- **Class Skills**: 18 separate entities for different skills
- **Class Proficiencies**: 18 separate entities for different weapons

## 🔧 **Best Practices Demonstrated**

### **Clear Entity Types**

Each entity has a clear, appropriate type:
- **Bonus (0)**: Numerical improvements
- **Quantity (1)**: Discrete values and resources
- **Replacement (2)**: Value replacements
- **Other (3)**: Special effects
- **Proficiency (4)**: Proficiency grants
- **Choice (5)**: Player choices

### **Appropriate Applies-To Types**

Each entity targets the correct system:
- **AC (3)**: Armor Class bonuses
- **MovementSpeed (8)**: Movement improvements
- **UnarmedDamage (20)**: Unarmed strike damage
- **Feat (21)**: Feat grants and choices
- **Skill (1)**: Skill proficiencies

### **Effective Formula Usage**

Formulas are used appropriately for different progression patterns:
- **Ability-based**: For ability score dependencies
- **Interval-based**: For regular level improvements
- **Threshold-based**: For specific level milestones
- **Level-based**: For direct level scaling

### **Proper Grouping**

Related entities are grouped together:
- **Bonus feats**: Grouped by level
- **Class skills**: All grouped together
- **Class proficiencies**: All grouped together

## 🎭 **Bard Class Examples**

### **Bard Class Structure**

The Bard class demonstrates different implementation patterns from the Monk:

**Class Information**:
- **ID**: 18
- **Name**: "Bard"
- **Abbreviation**: "Brd"
- **Hit Die**: 1 (d6)
- **Skill Points**: 6 per level
- **Features**: Comprehensive feature progressions covering levels 1-20

**Source File**: Bard class object data from database

### **Bardic Music Implementation**

#### **Bardic Music Uses Per Day**
**FeatureProgression ID**: 15138 (Level 1)
**FeatureEntity ID**: 314

```json
{
  "type": 1,                    // Quantity entity
  "appliesTo": 10,              // Uses
  "appliesToId": 1,             // Bardic Music uses
  "value": 1,                   // Base value
  "formulaParams": {
    "formulaId": 1,             // Linear scaling formula
    "interval": 1,              // Every level
    "includeProgressionLevel": true
  }
}
```

**Implementation**: Starts with 1 use per day, gains +1 use per bard level.

#### **Bardic Knowledge Bonus**
**FeatureProgression ID**: 15135 (Level 1)
**FeatureEntity ID**: 311

```json
{
  "type": 0,                    // Bonus entity
  "appliesTo": 1,               // Skill
  "appliesToId": 49,            // Bardic Knowledge skill
  "value": 0,                   // Base value (calculated via formula)
  "formulaParams": {
    "formulaId": 11,            // Level plus ability formula
    "abilityId": 4,             // Intelligence
    "includeProgressionLevel": true
  }
}
```

**Implementation**: Bardic Knowledge bonus = bard level + Intelligence modifier.

### **Bardic Music Abilities - Delayed Progression**

#### **Bardic Music Ability - Level 8 Start**
**FeatureProgression ID**: 15141 (Level 8)
**FeatureEntity IDs**: Multiple entities for different aspects

```json
{
  "type": 0,                    // Bonus entity
  "appliesTo": 2,               // SavingThrow
  "appliesToId": 2,             // Will saves
  "value": 1,                   // Base bonus
  "formulaParams": {
    "formulaId": 2,             // Every N levels formula
    "interval": 6,              // Every 6 levels
    "formulaStartLevel": 8,     // Starting at 8th level
    "includeProgressionLevel": true
  }
}
```

**Implementation**: +1 bonus to Will saves at 8th level, improving every 6 levels thereafter.

### **Class Skills Implementation**

#### **Bard Class Skills**
**FeatureProgression ID**: 15156 (Level 1)
**FeatureEntity IDs**: 7040-7650+ (Multiple entities)

```json
{
  "type": 3,                    // Other entity
  "appliesTo": 1,               // Skill
  "appliesToId": 32,            // Perform skill
  "value": null,                // No additional value
  "groupingId": 0               // Grouped with other class skills
}
```

**Implementation**: Grants access to all Bard class skills including Perform, Knowledge skills, Bluff, Diplomacy, etc.

### **Bardic Music Abilities - Multiple Components**

#### **Bardic Music Targets**
**FeatureProgression ID**: 15141 (Level 8)
**FeatureEntity ID**: 6806

```json
{
  "type": 0,                    // Bonus entity
  "appliesTo": 4,               // Attack
  "appliesToId": null,          // No specific target
  "value": 1,                   // Base bonus
  "formulaParams": {
    "formulaId": 2,             // Every N levels formula
    "interval": 6,              // Every 6 levels
    "formulaStartLevel": 8,     // Starting at 8th level
    "includeProgressionLevel": true
  }
}
```

#### **Bardic Music Distance**
**FeatureProgression ID**: 15141 (Level 8)
**FeatureEntity ID**: 6836

```json
{
  "type": 0,                    // Bonus entity
  "appliesTo": 5,               // Damage
  "appliesToId": null,          // No specific target
  "value": 1,                   // Base bonus
  "formulaParams": {
    "formulaId": 2,             // Every N levels formula
    "interval": 6,              // Every 6 levels
    "formulaStartLevel": 8,     // Starting at 8th level
    "includeProgressionLevel": true
  }
}
```

**Implementation**: Complex Bardic Music abilities with multiple components (uses, targets, distance) that all scale together.

### **Bardic Music Abilities - Every 3 Levels**

#### **Bardic Music Ability - Regular Progression**
**FeatureProgression ID**: 15144 (Level 1)
**FeatureEntity ID**: 6929

```json
{
  "type": 1,                    // Quantity entity
  "appliesTo": 11,              // Targets
  "appliesToId": null,          // No specific target
  "value": 1,                   // Base value
  "formulaParams": {
    "formulaId": 2,             // Every N levels formula
    "interval": 3,              // Every 3 levels
    "includeProgressionLevel": true
  }
}
```

**Implementation**: Number of targets for Bardic Music abilities increases every 3 levels.

### **Bard Formula System Examples**

#### **Linear Scaling Formula (Formula ID 1)**
**Bardic Music Uses**:
- **Formula ID**: 1
- **Implementation**: Uses per day = (level - startLevel + 1) × 1
- **Result**: 1 use at 1st level, 2 uses at 2nd level, etc.

#### **Every N Levels Formula (Formula ID 2)**
**Bardic Music Abilities**:
- **Formula ID**: 2
- **Interval**: 3, 6 (different abilities use different intervals)
- **Formula Start Level**: 8 (for delayed abilities)
- **Implementation**: Abilities improve at specific level intervals

#### **Level Plus Ability Formula (Formula ID 11)**
**Bardic Knowledge**:
- **Formula ID**: 11
- **Ability ID**: 4 (Intelligence)
- **Implementation**: Bonus = bard level + Intelligence modifier

### **Bard Cross-System Integration**

#### **Skill System Integration**
**Bardic Knowledge**:
- **appliesToId**: 49 (Bardic Knowledge skill ID from skill system)
- **appliesTo**: 1 (Skill)
- **Implementation**: References specific skill from skill system

#### **Use System Integration**
**Bardic Music Uses**:
- **appliesToId**: 1 (Bardic Music use type from uses system)
- **appliesTo**: 10 (Uses)
- **Implementation**: References specific use type from uses system

#### **Ability System Integration**
**Bardic Knowledge Formula**:
- **abilityId**: 4 (Intelligence from ability system)
- **Implementation**: References specific ability from ability system

### **Bard Implementation Patterns**

#### **Delayed Progression Pattern**
Many Bardic Music abilities use `formulaStartLevel: 8` to delay progression until 8th level, demonstrating how to implement features that start at different levels than the base feature.

#### **Multiple Entity Pattern**
Bardic Music abilities often have multiple entities for different aspects (uses, targets, distance), showing how to model complex features with multiple components.

#### **Cross-System Reference Pattern**
Bard features extensively reference other systems (skills, uses, abilities), demonstrating proper cross-system integration.

## 🌿 **Druid Class Examples**

### **Druid Class Structure**

The Druid class demonstrates complex feature modeling with cross-system integration:

**Class Information**:
- **ID**: 20
- **Name**: "Druid"
- **Abbreviation**: "Drd"
- **Hit Die**: 2 (d8)
- **Skill Points**: 4 per level
- **Features**: Complex feature progressions with cross-system integration

**Source File**: Druid class object data from database

### **Wild Shape Implementation**

#### **Wild Shape Uses Per Day - Complex Threshold Progression**
**FeatureProgression ID**: 16085 (Level 5)
**FeatureEntity ID**: 695

```json
{
  "type": 1,                    // Quantity entity
  "appliesTo": 10,              // Uses
  "appliesToId": 1,             // Wild Shape uses
  "value": 0,                   // Base value (calculated via formula)
  "formulaParams": {
    "formulaId": 3,             // Threshold-based formula
    "thresholds": [5, 6, 7, 10, 14, 18],  // Level thresholds
    "values": [1, 2, 3, 4, 5, 6],         // Uses per day
    "includeProgressionLevel": true
  }
}
```

**Implementation**: Wild Shape uses per day with complex non-linear progression: 1 use at 5th level, 2 at 6th, 3 at 7th, 4 at 10th, 5 at 14th, 6 at 18th level.

#### **Wild Shape Size Restrictions - Threshold Progression**
**FeatureProgression ID**: 16085 (Level 5)
**FeatureEntity ID**: 698

```json
{
  "type": 0,                    // Bonus entity
  "appliesTo": 24,              // DamageType (special applies-to)
  "appliesToId": null,          // No specific target
  "value": 0,                   // Base value (calculated via formula)
  "formulaParams": {
    "formulaId": 3,             // Threshold-based formula
    "thresholds": [8, 11, 15],  // Level thresholds
    "values": [6, 3, 7],        // Size category values
    "includeProgressionLevel": true
  }
}
```

**Implementation**: Wild Shape size restrictions that change at specific levels, allowing larger forms as the druid advances.

### **Nature Sense Implementation**

#### **Nature Sense - Multiple Skill Bonuses**
**FeatureProgression ID**: 16058 (Level 1)
**FeatureEntity IDs**: 686, 689

```json
{
  "type": 0,                    // Bonus entity
  "appliesTo": 1,               // Skill
  "appliesToId": 25,            // Knowledge (nature)
  "value": 2,                   // +2 bonus
  "groupingId": 1,              // Grouped with other Nature Sense bonuses
  "formulaParams": null         // No formula needed for static bonus
}
```

```json
{
  "type": 0,                    // Bonus entity
  "appliesTo": 1,               // Skill
  "appliesToId": 41,            // Survival
  "value": 2,                   // +2 bonus
  "groupingId": 1,              // Grouped with other Nature Sense bonuses
  "formulaParams": null         // No formula needed for static bonus
}
```

**Implementation**: +2 bonus to both Knowledge (nature) and Survival checks, grouped together with `groupingId: 1`.

### **Wild Empathy Implementation**

#### **Wild Empathy - Level Plus Ability Formula**
**FeatureProgression ID**: 16088 (Level 1)
**FeatureEntity ID**: 704

```json
{
  "type": 0,                    // Bonus entity
  "appliesTo": 1,               // Skill
  "appliesToId": 48,            // Wild Empathy skill
  "value": 0,                   // Base value (calculated via formula)
  "formulaParams": {
    "formulaId": 11,            // Level plus ability formula
    "abilityId": 6,             // Charisma
    "includeProgressionLevel": true
  }
}
```

**Implementation**: Wild Empathy bonus = druid level + Charisma modifier, demonstrating ability-based scaling.

### **Bonus Languages Implementation**

#### **Bonus Languages - Language System Integration**
**FeatureProgression ID**: 16052 (Level 1)
**FeatureEntity IDs**: 680, 683

```json
{
  "type": 3,                    // Other entity
  "appliesTo": 14,              // Language
  "appliesToId": 18,            // Sylvan language
  "value": 0,                   // No additional value
  "formulaParams": null         // No formula needed for language grant
}
```

```json
{
  "type": 3,                    // Other entity
  "appliesTo": 15,              // Special Language
  "appliesToId": 7,             // Druidic language
  "value": 0,                   // No additional value
  "formulaParams": null         // No formula needed for language grant
}
```

**Implementation**: Grants access to Sylvan (bonus language) and Druidic (special language), demonstrating language system integration.

### **Resist Nature's Lure Implementation**

#### **Resist Nature's Lure - Conditional Bonus**
**FeatureProgression ID**: 16064 (Level 4)
**FeatureEntity ID**: 692

```json
{
  "type": 0,                    // Bonus entity
  "appliesTo": 2,               // SavingThrow
  "appliesToId": -1,            // All saving throws
  "value": 4,                   // +4 bonus
  "conditions": [{
    "conditionType": 6,         // Level-based condition
    "conditionValue": 6         // 4th level and above
  }]
}
```

**Implementation**: +4 bonus on saving throws against fey spell-like abilities, starting at 4th level.

### **Druid Formula System Examples**

#### **Complex Threshold Formula (Formula ID 3)**
**Wild Shape Uses**:
- **Formula ID**: 3
- **Thresholds**: [5, 6, 7, 10, 14, 18]
- **Values**: [1, 2, 3, 4, 5, 6]
- **Implementation**: Non-linear progression with irregular intervals

#### **Level Plus Ability Formula (Formula ID 11)**
**Wild Empathy**:
- **Formula ID**: 11
- **Ability ID**: 6 (Charisma)
- **Implementation**: Bonus = druid level + Charisma modifier

#### **Every N Levels Formula (Formula ID 2)**
**Druid Features**:
- **Formula ID**: 2
- **Interval**: 2 (every 2 levels)
- **Implementation**: Regular interval improvements

### **Druid Cross-System Integration**

#### **Language System Integration**
**Bonus Languages**:
- **appliesToId**: 18 (Sylvan), 7 (Druidic)
- **appliesTo**: 14 (Language), 15 (Special Language)
- **Implementation**: References language system IDs for proper integration

#### **Skill System Integration**
**Nature Sense**:
- **appliesToId**: 25 (Knowledge nature), 41 (Survival)
- **appliesTo**: 1 (Skill)
- **Implementation**: References skill system IDs for proper integration

#### **Use System Integration**
**Wild Shape Uses**:
- **appliesToId**: 1 (Wild Shape uses)
- **appliesTo**: 10 (Uses)
- **Implementation**: References use system for uses/day patterns

### **Druid Implementation Patterns**

#### **Complex Threshold Progression Pattern**
Druid Wild Shape demonstrates complex threshold progressions with non-linear intervals, showing how to model features that don't follow simple patterns.

#### **Cross-System Integration Pattern**
Druid features extensively integrate with language, skill, and use systems, demonstrating proper cross-system reference patterns.

#### **Grouped Entity Pattern**
Druid Nature Sense uses `groupingId: 1` to group related skill bonuses, showing how to organize related effects.

#### **Conditional Feature Pattern**
Druid Resist Nature's Lure uses conditions to apply features only at specific levels, demonstrating delayed feature activation.

#### **Uses/Day Modeling Pattern**
Druid Wild Shape demonstrates how to model uses/day features with complex scaling patterns using threshold-based formulas.

## 📚 **Related Documentation**

- **[Database Schema](database-schema.md)** - Complete database model documentation
- **[Validation Schemas](validation-schemas.md)** - Zod validation rules and types
- **[Static Data](static-data.md)** - Enums and type definitions
- **[Backend Implementation](backend-implementation.md)** - Service and controller implementation
- **[Frontend Components](frontend-components.md)** - React component implementation
