# Feature System Static Data

*Comprehensive documentation of static data, enums, types, and formula definitions for the feature system.*

## 📋 **Overview**

The feature system static data provides enums, types, and utility functions that define the behavior and capabilities of the feature system. This includes modifier types, bonus types, choice behaviors, formula definitions, and various utility functions for feature calculations and management.

The static data layer serves as the foundation for type safety, validation, and consistent behavior across the feature system. It defines the vocabulary and rules that govern how features interact with characters and other game systems.

**Source File**: `packages/shared/static-data/src/FeatureData.ts`

## 🏗️ **Core Enums and Types**

### **FeatureSourceType**

Defines the source types for feature progressions, determining how features are granted to characters.

**Purpose**: Identifies the origin of features in the character system, affecting how they are applied and calculated.

**Values**:
- **`Race` (0)**: Features granted by character race
- **`Class` (1)**: Features granted by character class
- **`Template` (2)**: Features granted by character templates

**Usage**: Used in the `sourceType` field of `FeatureProgression` models to determine feature application logic and source tracking.

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureSourceType definition)

### **ModifierType**

Defines the types of modifiers that features can provide, affecting how they are calculated and applied.

**Purpose**: Categorizes different types of mechanical effects that features can provide to characters.

**Modifier Categories**:

**Bonus Modifiers (0)**: Numerical bonuses and penalties that follow stacking rules
- **Examples**: +2 to attack rolls, +4 to Strength, -1 to AC
- **Stacking**: Multiple bonuses of different types stack, same types don't
- **Compatibility**: Ability, Skill, SavingThrow, AC, Attack, Damage, DamageReduction, Initiative

**Quantity Modifiers (1)**: Counts, amounts, and resources that represent discrete values
- **Examples**: 30ft movement speed, 3d6 damage, 2 targets
- **Stacking**: Highest value applies (no stacking)
- **Compatibility**: MovementSpeed, HitDice, Uses, Targets, Distance, ExtraAttacks, Healing, SpellResistance, UnarmedDamage

**Replacement Modifiers (2)**: Values that replace existing character statistics
- **Examples**: Replace unarmed damage with 1d6, replace base speed with 40ft
- **Stacking**: Overwrites existing values completely
- **Compatibility**: Damage, UnarmedDamage, MovementSpeed, Ability

**Other Modifiers (3)**: Special cases and complex effects that require custom handling
- **Examples**: Direct feat grants, language grants, special abilities
- **Stacking**: Custom logic per effect type
- **Compatibility**: Other, BonusLanguage, AutomaticLanguage, Feat

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (ModifierType definition)

### **ModifierAppliesToType**

Defines what a modifier applies to, determining the target of the modification.

**Purpose**: Specifies the target system or statistic that a modifier affects, enabling precise application of feature effects.

**Target Categories**:

**Combat Statistics**:
- **`Attack` (4)**: Attack rolls and combat accuracy
- **`Damage` (5)**: Damage rolls and weapon damage
- **`AC` (3)**: Armor Class and defensive bonuses
- **`DamageReduction` (6)**: Damage reduction and resistance
- **`Initiative` (7)**: Initiative rolls and turn order

**Character Abilities**:
- **`Ability` (0)**: Core ability scores (STR, DEX, CON, etc.)
- **`Skill` (1)**: Skill checks and skill ranks
- **`SavingThrow` (2)**: Saving throw bonuses (Fort, Ref, Will)

**Movement and Physical**:
- **`MovementSpeed` (8)**: Base movement speed in feet
- **`UnarmedDamage` (20)**: Unarmed strike damage dice
- **`Distance` (12)**: Range, reach, and distance-based effects

**Resources and Uses**:
- **`Uses` (10)**: Uses per day/week for abilities
- **`Targets` (11)**: Number of targets for area effects
- **`HitDice` (9)**: Hit dice for temporary HP and healing
- **`Healing` (18)**: Healing hit points per day
- **`ExtraAttacks` (17)**: Extra attacks per round/action

**Special Effects**:
- **`SpellResistance` (19)**: Spell Resistance (SR)
- **`Feat` (21)**: Direct feat grants
- **`BonusLanguage` (14)**: Languages requiring INT modifier
- **`AutomaticLanguage` (15)**: Languages granted automatically
- **`Other` (13)**: Special cases and complex effects

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (ModifierAppliesToType definition)

### **FeatureBonusType**

Defines bonus types for stacking rules, determining how multiple bonuses of the same type interact.

**Purpose**: Enables proper bonus stacking calculations by categorizing bonuses into types that may or may not stack together.

**Bonus Categories**:

**Combat Bonuses**:
- **`Dodge` (0)**: Dodge bonuses to AC (stack with all others)
- **`Armor` (6)**: Armor bonuses to AC
- **`Shield` (15)**: Shield bonuses to AC
- **`Deflection` (7)**: Deflection bonuses to AC
- **`NaturalArmor` (10)**: Natural armor bonuses to AC

**Circumstance Bonuses**:
- **`Circumstance` (1)**: Circumstance bonuses (stack with all others)
- **`Enhancement` (2)**: Enhancement bonuses
- **`Morale` (3)**: Morale bonuses
- **`Competence` (4)**: Competence bonuses
- **`Insight` (8)**: Insight bonuses
- **`Luck` (9)**: Luck bonuses
- **`Profane` (11)**: Profane bonuses
- **`Sacred` (14)**: Sacred bonuses

**Special Bonuses**:
- **`Alchemical` (5)**: Alchemical bonuses
- **`Racial` (12)**: Racial bonuses
- **`Resistance` (13)**: Resistance bonuses
- **`Size` (16)**: Size-based bonuses
- **`Other` (17)**: Other bonus types

**Stacking Rules**: Bonuses of the same type generally don't stack, but dodge and circumstance bonuses stack with all others.

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureBonusType definition)

## 🎯 **Choice System Enums**

### **FeatureChoiceType**

Defines the types of choices that features can provide to players.

**Purpose**: Categorizes different types of player choices for character customization.

**Choice Types**:
- **`Feat` (0)**: Feat selection choices
- **`Feature` (1)**: Feature selection choices
- **`CreatureType` (2)**: Creature type selection choices

**Usage**: Determines the available options and validation rules for player choices in feature progressions.

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureChoiceType definition)

### **FeatureChoiceBehavior**

Defines how choice selections behave and are managed.

**Purpose**: Specifies the behavior pattern for player choices, affecting selection logic and validation.

**Behavior Types**:
- **`Single` (0)**: Single selection from available options
- **`Multiple` (1)**: Multiple selections from available options
- **`Allocation` (2)**: Resource allocation choices with limited points

**Usage**: Determines the selection interface and validation rules for feature choices.

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureChoiceBehavior definition)

## ✨ **Special Effect Enums**

### **FeatureSpecialEffectType**

Defines the types of special effects that features can provide.

**Purpose**: Categorizes non-numeric effects that don't fit into the modifier system.

**Effect Types**:
- **`Proficiency` (0)**: Weapon, armor, or skill proficiencies
- **`FavoredEnemy` (1)**: Favored enemy bonuses and abilities
- **`ConditionalUpgrade` (2)**: Conditional feature upgrades
- **`TurnUndead` (3)**: Turn undead abilities
- **`WildShapeForm` (4)**: Wild shape form options
- **`WildShapeSize` (5)**: Wild shape size options
- **`WeaponFamiliarity` (7)**: Weapon familiarity effects
- **`Other` (6)**: Other special effects

**Usage**: Enables special abilities and traits that require custom handling beyond simple modifiers.

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureSpecialEffectType definition)

## 📋 **Prerequisite Enums**

### **FeaturePrerequisiteType**

Defines the types of prerequisites that features can require.

**Purpose**: Specifies the requirements that must be met before a feature can be acquired.

**Prerequisite Types**:
- **`SkillRanks` (0)**: Minimum ranks in a specific skill
- **`AbilityScore` (1)**: Minimum ability score requirement
- **`CharacterLevel` (2)**: Minimum character level
- **`ClassLevel` (3)**: Minimum class level
- **`BaseAttackBonus` (4)**: Minimum base attack bonus
- **`Other` (5)**: Other prerequisite types

**Usage**: Enforces character progression requirements and maintains game balance.

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeaturePrerequisiteType definition)

## 🔧 **Formula System Enums**

### **FormulaId**

Defines the mathematical formulas used for feature progression calculations.

**Purpose**: Provides standardized mathematical patterns for features that scale with character level or other factors.

**Formula Types**:
- **Linear Scaling**: Features that scale linearly with level
- **Conditional Scaling**: Features with level-based thresholds
- **Ability-Based**: Features dependent on ability scores
- **Dice Scaling**: Features with dice-based progression

**Usage**: Enables complex mathematical progression patterns for feature effects.

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FormulaId definition)

### **FeatureModifierConditionType**

Defines the types of conditions that can be applied to modifiers.

**Purpose**: Enables conditional application of modifiers based on specific game conditions.

**Condition Types**:
- **`Trigger` (0)**: Specific triggers or events
- **`AttackType` (1)**: Type of attack (melee, ranged, etc.)
- **`CharacterSize` (2)**: Character size requirements
- **`Feature` (4)**: Feature-based conditions
- **`SpellSchool` (5)**: Spell school requirements
- **`Other` (3)**: Other condition types

**Usage**: Enables complex conditional logic for modifier application.

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureModifierConditionType definition)

## 🎨 **Utility Functions**

### **Display Formatting**

The static data includes utility functions for formatting feature information:

**Name Select Options**: Functions for creating select option lists from enum data
**Display Name Mapping**: Maps enum values to user-friendly display names
**Type Compatibility**: Functions for checking modifier type compatibility
**Validation Helpers**: Utility functions for validating enum values

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (Utility function definitions)

### **Select Lists**

Pre-formatted select lists for user interface components:

**MODIFIER_SELECT_LIST**: Select options for modifier types
**MODIFIER_APPLIES_TO_SELECT_LIST**: Select options for modifier targets
**BONUS_TYPE_SELECT_LIST**: Select options for bonus types
**CHOICE_TYPE_SELECT_LIST**: Select options for choice types
**CHOICE_BEHAVIOR_SELECT_LIST**: Select options for choice behaviors
**SPECIAL_EFFECT_SELECT_LIST**: Select options for special effect types
**PREREQUISITE_SELECT_LIST**: Select options for prerequisite types

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (Select list definitions)

## 🔗 **Integration Points**

### **Database Integration**

The static data integrates with the database layer:

**Enum Validation**: Ensures database values match enum definitions
**Type Safety**: Provides TypeScript types for database operations
**Constraint Enforcement**: Enforces enum constraints in database operations
**Relationship Validation**: Validates enum-based relationships

### **Validation Integration**

The static data supports the validation layer:

**Schema Integration**: Provides enum values for Zod schemas
**Type Generation**: Generates TypeScript types for validation
**Error Messages**: Provides enum-specific error messages
**Constraint Validation**: Validates enum constraints in requests

### **Frontend Integration**

The static data supports frontend components:

**Select Components**: Provides formatted data for dropdowns
**Display Components**: Provides display names and formatting
**Form Validation**: Provides validation rules for forms
**Type Safety**: Ensures type safety in frontend components

### **Backend Integration**

The static data supports backend operations:

**Business Logic**: Provides enum values for business rules
**Calculation Logic**: Provides enum values for calculations
**API Responses**: Provides formatted data for API responses
**Error Handling**: Provides enum-specific error handling

## 📊 **Performance Considerations**

The feature system static data follows shared performance optimization principles.

**For complete documentation on performance optimization, see**: [Performance Optimization](../application-overview/performance-optimization.md)

**Feature-Specific Performance Benefits**:
- **Fast Enum Lookups**: Direct access to enum values for modifier types, bonus types, and choice behaviors
- **Efficient Select Lists**: Pre-formatted select lists for UI components
- **Optimized Validation**: Fast enum validation for feature data
- **Reduced API Calls**: Static data eliminates need for backend requests for enum definitions and select options

## 🔧 **Maintenance and Updates**

The feature system static data follows shared maintenance and extension practices.

**For complete documentation on maintenance and extension, see**: [Maintenance and Extension](../application-overview/maintenance-and-extension.md)

**Feature-Specific Maintenance Considerations**:
- **Enum Value Management**: Adding new enum values for modifier types, bonus types, and choice behaviors
- **Backward Compatibility**: Ensuring new enum values don't break existing feature data
- **Validation Updates**: Updating validation schemas when new enum values are added
- **UI Component Updates**: Updating select lists and form components when enum values change
