# Feature System Static Data

*Comprehensive documentation of static data, enums, types, and formula definitions for the feature system.*

## 📋 **Overview**

The feature system static data provides enums, types, and utility functions that define the behavior and capabilities of the feature system. This includes entity types, applies-to types, bonus types, condition types, and various utility functions for feature calculations and management.

The static data layer serves as the foundation for type safety, validation, and consistent behavior across the feature system. It defines the vocabulary and rules that govern how features interact with characters and other game systems through the unified entity approach.

**Source File**: `packages/shared/static-data/src/FeatureData.ts`

## 🏗️ **Core Enums and Types**

### **FeatureSourceType**

Defines the source types for feature progressions, determining how features are granted to characters.

**Purpose**: Identifies the origin of features in the character system, affecting how they are applied and calculated.

**Values**:
- **`Race` (0)**: Features granted by character race
- **`Class` (1)**: Features granted by character class
- **`Template` (2)**: Features granted by character templates
- **`None` (3)**: Features with no specific source
- **`ClassVariant` (4)**: Features granted by class variants
- **`Domain` (5)**: Features granted by domains (e.g., cleric domains)
- **`Feat` (6)**: Features granted by feats
- **`Companion` (7)**: Features granted by companions (e.g., familiar benefits, animal companion benefits)

**Usage**: Used in the `sourceType` field of `FeatureProgression` models to determine feature application logic and source tracking. Companion-granted features use `FeatureSourceType.Companion` with `companionId` set to link to the specific companion.

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureSourceType definition)

### **SpecialFeatureId**

Defines special feature IDs used for container features and system-level features that don't represent traditional character abilities.

**Purpose**: Identifies special features that serve as containers or system-level features, such as companion benefits or class skills.

**Values**:
- **`ClassSkill` (1)**: Container feature for class skill grants
- **`ClassProficiency` (2)**: Container feature for class proficiency grants
- **`AutomaticLanguage` (3)**: Container feature for automatic language grants
- **`BonusLanguage` (4)**: Container feature for bonus language grants
- **`AbilityAdjustment` (5)**: Container feature for ability score adjustments
- **`CompanionBenefit` (6)**: Container feature for companion benefits (e.g., familiar benefits, animal companion benefits)

**Usage**: Used as `featureId` in `FeatureProgression` to create container features that group related entities. Companion benefits use `SpecialFeatureId.CompanionBenefit` with `sourceType: FeatureSourceType.Companion` and `companionId` set to the specific companion.

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (SpecialFeatureId definition)

### **EntityType**

Defines the types of entities that features can provide, affecting how they are calculated and applied through the unified entity approach.

**Purpose**: Categorizes different types of mechanical effects that features can provide to characters using a single, flexible model.

**Entity Categories**:

**Bonus Entities (0)**: Numerical bonuses and penalties that follow stacking rules
- **Examples**: +2 to attack rolls, +4 to Strength, -1 to AC, Wisdom modifier to AC (Monk AC Bonus)
- **Stacking**: Multiple bonuses of different types stack, same types don't
- **Compatibility**: Ability, Skill, SavingThrow, AC, Attack, Damage, DamageReduction, Initiative, SpellSvDC
- **Real Example**: Monk AC Bonus applies Wisdom modifier to AC (type: 0, appliesTo: 3=AC, formulaParams: ability-based)

**Quantity Entities (1)**: Counts, amounts, and resources that represent discrete values
- **Examples**: 30ft movement speed, 3d6 damage, 2 targets, +10ft movement (Monk Fast Movement)
- **Stacking**: Highest value applies (no stacking)
- **Compatibility**: MovementSpeed, HitDice, Uses, Targets, Distance, ExtraAttacks, Healing, SpellResistance, Damage
- **Real Example**: Monk Fast Movement adds +10ft to movement speed (type: 1, appliesTo: 8=MovementSpeed, value: 10)

**Replacement Entities (2)**: Values that replace existing character statistics
- **Examples**: Replace unarmed damage with 1d6, replace base speed with 40ft, progressive unarmed damage (Monk Unarmed Strike)
- **Stacking**: Overwrites existing values completely
- **Compatibility**: Damage, UnarmedDamage, MovementSpeed, Ability
- **Real Example**: Monk Unarmed Strike replaces unarmed damage with progressive dice (type: 2, appliesTo: 20=UnarmedDamage, formulaParams: threshold-based progression)

**Other Entities (3)**: Special cases and complex effects that require custom handling
- **Examples**: Direct feat grants, language grants, special abilities
- **Stacking**: Custom logic per effect type
- **Compatibility**: Other, BonusLanguage, AutomaticLanguage, WeaponFamiliarity, Feat, SizeCategory, CreatureType, DamageType

**Proficiency Entities (EntityType.Other with EntityAppliesToType.Proficiency)**: Proficiency bonuses and abilities
- **Examples**: Weapon proficiencies, armor proficiencies (Monk Class Proficiencies)
- **Stacking**: Custom logic for proficiency handling
- **Compatibility**: Proficiency (weapon/armor proficiencies use EntityType.Other with appliesTo: Proficiency)
- **Real Example**: Monk Class Proficiencies grants proficiency with simple weapons and exotic monk weapons (type: 3=Other, appliesTo: 36=Proficiency, appliesToId: proficiency type ID, appliesToSubId: item ID or -1 for "all")
- **Note**: Class skills use EntityType.Other with appliesTo: Skill (1), not Proficiency. Weapon/armor proficiencies use appliesTo: Proficiency (36).

**Choice Entities (5)**: Player choice mechanics
- **Examples**: Feat choices, feature choices, creature type choices, bonus feat selection (Monk Bonus Feat)
- **Stacking**: N/A (choice-based)
- **Compatibility**: Feat, Feature, CreatureType
- **Real Example**: Monk Bonus Feat allows choice between Improved Grapple or Stunning Fist (type: 5, appliesTo: 21=Feat, appliesToId: specific feat IDs)

**Allocation Entities (6)**: Resource allocation mechanics
- **Examples**: Point allocation to feats, features, or creature types
- **Stacking**: N/A (allocation-based)
- **Compatibility**: Feat, Feature, CreatureType

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (EntityType definition)

### **EntityAppliesToType**

Defines what an entity applies to, determining the target of the modification through the unified entity approach.

**Purpose**: Specifies the target system or statistic that an entity affects, enabling precise application of feature effects.

**Target Categories**:

**Combat Statistics**:
- **`Attack` (4)**: Attack rolls and combat accuracy
- **`Damage` (5)**: Damage rolls and weapon damage
- **`AC` (3)**: Armor Class and defensive bonuses
- **`DamageReduction` (6)**: Damage reduction and resistance
- **`Initiative` (7)**: Initiative rolls and turn order
- **`SpellSvDC` (26)**: Spell Save DC

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
- **`Feature` (25)**: Direct feature grants
- **`BonusLanguage` (14)**: Languages requiring INT modifier
- **`AutomaticLanguage` (15)**: Languages granted automatically
- **`WeaponFamiliarity` (16)**: Weapon familiarity effects
- **`SizeCategory` (22)**: Size category effects
- **`CreatureType` (23)**: Creature type effects
- **`DamageType` (24)**: Damage type effects
- **`SpellbookSpell` (37)**: Spellbook spell grants for spellbook classes (e.g., Wizard)
- **`Other` (13)**: Special cases and complex effects

**SpellbookSpell (37)**: Spellbook spell grants for spellbook classes
- **Purpose**: Used for spellbook classes (e.g., Wizard) to grant free spells during level-up
- **Entity Types**: Used with `EntityType.Choice` for free spell grants, `EntityType.Other` for 0th level spell grants
- **Parameters**: 
  - `appliesToId`: Spell level (0-9) for level-specific grants, or 0 for 0th level grants
  - `appliesToSubId`: Specific spell ID, or -1 for "all spells" at the level
- **Formula Support**: Supports `ABILITY_BASED` and `STATIC_EVERY_N_LEVELS` formulas for dynamic spell grants
- **Usage**: 
  - `EntityType.Choice` + `SpellbookSpell`: Free spell grants with quantity formulas (e.g., "3 + INT" at 1st level, "2 spells per level")
  - `EntityType.Other` + `SpellbookSpell` + `appliesToId: 0` + `appliesToSubId: -1`: Feature-based 0th level spell grant (all 0th level spells)
- **Related Documentation**: [Spell Scribing Feature](../character-management/spell-scribing.md) - Comprehensive spell scribing documentation

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (EntityAppliesToType definition)

### **FeatureBonusType**

Defines bonus types for stacking rules, determining how multiple bonuses of the same type interact.

**Purpose**: Enables proper bonus stacking calculations by categorizing bonuses into types that may or may not stack together.

**Bonus Categories**:

**Always Stacking Bonuses**:
- **`Dodge` (0)**: Dodge bonuses to AC (stack with all others)
- **`Circumstance` (1)**: Circumstance bonuses (stack with all others)

**Non-Stacking Bonuses** (highest applies):
- **`Enhancement` (2)**: Enhancement bonuses
- **`Morale` (3)**: Morale bonuses
- **`Competence` (4)**: Competence bonuses
- **`Alchemical` (5)**: Alchemical bonuses
- **`Armor` (6)**: Armor bonuses to AC
- **`Deflection` (7)**: Deflection bonuses to AC
- **`Insight` (8)**: Insight bonuses
- **`Luck` (9)**: Luck bonuses
- **`NaturalArmor` (10)**: Natural armor bonuses to AC
- **`Profane` (11)**: Profane bonuses
- **`Racial` (12)**: Racial bonuses
- **`Resistance` (13)**: Resistance bonuses
- **`Sacred` (14)**: Sacred bonuses
- **`Shield` (15)**: Shield bonuses to AC
- **`Size` (16)**: Size-based bonuses
- **`Other` (17)**: Other bonus types

**Stacking Rules**: Bonuses of the same type generally don't stack, but dodge and circumstance bonuses stack with all others.

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureBonusType definition)

## 🎯 **Condition System Enums**

### **FeatureEntityConditionType**

Defines the types of conditions that can be applied to feature entities.

**Purpose**: Enables conditional application of feature entities based on specific game conditions.

**Condition Types**:
- **`material` (0)**: Material-based conditions (metal, stone)
- **`attack_type` (1)**: Attack type conditions (melee, ranged, etc.)
- **`character_size` (2)**: Character size requirements
- **`target` (3)**: Target-based conditions (nearby allies, enemies, etc.)
- **`environment` (4)**: Environment-based conditions (forest, grassland, etc.)
- **`spell_school` (5)**: Spell school requirements
- **`creature_type` (6)**: Creature type conditions
- **`source` (7)**: Source-based conditions (traps, fear, spells, poison)
- **`lighting` (8)**: Lighting-based conditions (bright light, shadows, dim light, darkness) - consolidated from CompanionBenefitConditionType
- **`special` (9)**: Special conditions (e.g., "Casting Defensively")

**Usage**: Enables complex conditional logic for entity application based on various game conditions. The `lighting` condition type was consolidated from the old CompanionBenefitConditionType system when companion benefits were migrated to the unified Feature system.

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureEntityConditionType definition)

**Related Documentation**: [Companion Data](../reference-data/companion-data.md) for LightingConditionType values

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

### **ConditionalScalingValueType**

Defines what values represent in conditional scaling formulas.

**Purpose**: Specifies how values in formula parameters should be interpreted for complex scaling calculations.

**Value Types**:
- **`Value` (0)**: Values represent numeric values (default behavior)
- **`AppliesToId` (1)**: Values represent appliesToId lookups for complex entity relationships

**Usage**: Enables complex mathematical progression patterns for feature effects with different value interpretations.

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (ConditionalScalingValueType definition)

## 🎯 **Choice and Filter Enums**

### **FeatureFeatChoiceFilter**

Defines filtering options for feat choices in feature entities.

**Purpose**: Specifies how feat choices should be filtered when presenting options to players.

**Filter Types**:
- **`Any` (0)**: Any feat can be chosen
- **`FighterBonus` (1)**: Only fighter bonus feats can be chosen
- **`MetamagicOrItemCreation` (2)**: Only metamagic or item creation feats can be chosen

**Usage**: Enables specialized feat choice filtering for different feature types and class abilities.

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureFeatChoiceFilter definition)

## 🎯 **Condition Value Enums**

### **MaterialType**

Defines material types for material-based conditions.

**Purpose**: Specifies material types that can be used in material-based feature entity conditions.

**Material Types**:
- **`metal` (0)**: Metal-based conditions
- **`stone` (1)**: Stone-based conditions

**Usage**: Enables material-specific feature effects and conditions.

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (MaterialType definition)

### **EnvironmentType**

Defines environment types for environment-based conditions.

**Purpose**: Specifies environment types that can be used in environment-based feature entity conditions.

**Environment Types**:
- **`forest` (0)**: Forest environments
- **`grassland` (1)**: Grassland environments
- **`mountains` (2)**: Mountain environments
- **`ocean` (3)**: Ocean environments
- **`plains` (4)**: Plains environments
- **`swamp` (5)**: Swamp environments
- **`underground` (6)**: Underground environments
- **`urban` (7)**: Urban environments

**Usage**: Enables environment-specific feature effects and conditions.

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (EnvironmentType definition)

### **SourceType**

Defines source types for source-based conditions.

**Purpose**: Specifies source types that can be used in source-based feature entity conditions.

**Source Types**:
- **`traps` (0)**: Trap-based conditions
- **`fear` (1)**: Fear-based conditions
- **`spells` (2)**: Spell-based conditions
- **`poison` (3)**: Poison-based conditions

**Usage**: Enables source-specific feature effects and conditions.

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (SourceType definition)

### **TargetType**

Defines target types for target-based conditions.

**Purpose**: Specifies target types that can be used in target-based feature entity conditions.

**Target Types**:
- **`nearby_allies` (0)**: Affects allies within range
- **`nearby_enemies` (1)**: Affects enemies within range
- **`touched_creature` (2)**: Affects a creature you touch
- **`line_of_sight` (3)**: Affects creatures you can see

**Usage**: Enables target-specific feature effects and conditions.

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (TargetType definition)

### **LightingConditionType**

Defines lighting condition values for lighting-based feature entity conditions.

**Purpose**: Specifies lighting conditions that can be used in lighting-based feature entity conditions (consolidated from CompanionBenefitConditionType).

**Lighting Types**:
- **`bright_light` (0)**: Bright light conditions
- **`shadows` (1)**: Shadow conditions
- **`dim_light` (2)**: Dim light conditions
- **`darkness` (3)**: Darkness conditions

**Usage**: Used with `FeatureEntityConditionType.lighting` (8) to create lighting-based conditional effects. This enum was consolidated from the old CompanionBenefitConditionType system when companion benefits were migrated to the unified Feature system.

**Source File**: `packages/shared/static-data/src/CompanionData.ts` (LightingConditionType definition)

### **SpecialType**

Defines special condition values for special-based feature entity conditions.

**Purpose**: Specifies special conditions that can be used in special-based feature entity conditions.

**Special Types**:
- **`casting_defensively` (0)**: Casting defensively condition

**Usage**: Used with `FeatureEntityConditionType.special` (9) to create special conditional effects such as "Casting Defensively".

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (SpecialType definition)

### **AttackType**

Defines attack types for attack-based conditions.

**Purpose**: Specifies attack types that can be used in attack-based feature entity conditions.

**Attack Types**:
- **`MELEE` (1)**: Melee attacks
- **`RANGED` (2)**: Ranged attacks
- **`SNEAK_ATTACK` (3)**: Sneak attacks
- **`CHARGE` (4)**: Charge attacks
- **`FLURRY_OF_BLOWS` (5)**: Flurry of blows
- **`POWER_ATTACK` (6)**: Power attacks
- **`TWO_WEAPON_FIGHTING` (7)**: Two-weapon fighting
- **`GRAPPLE` (8)**: Grapple attacks
- **`TRIP` (9)**: Trip attacks
- **`DISARM` (10)**: Disarm attacks
- **`SUNDER` (11)**: Sunder attacks
- **`BULL_RUSH` (12)**: Bull rush attacks
- **`OVERRUN` (13)**: Overrun attacks
- **`AID_ANOTHER` (14)**: Aid another actions
- **`FEINT` (15)**: Feint actions
- **`UNARMED_ATTACK` (16)**: Unarmed attacks
- **`THROWN` (17)**: Thrown attacks

**Usage**: Enables attack-specific feature effects and conditions.

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (AttackType definition)

### **CreatureType**

Defines creature types for creature-based conditions.

**Purpose**: Specifies creature types that can be used in creature-based feature entity conditions.

**Creature Types**: Includes all standard D&D creature types such as Aberration, Animal, Construct, Dragon, Elemental, Fey, Giant, Humanoid subtypes, Magical Beast, Monstrous Humanoid, Ooze, Outsider subtypes, Plant, Undead, and Vermin.

**Usage**: Enables creature-specific feature effects and conditions, particularly useful for favored enemy abilities and similar features.

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (CreatureType definition)

## 🎯 **Feature Progression Patterns**

### **Common Implementation Patterns**

Based on analysis of actual class implementations (Monk, Bard, and Druid classes), several common patterns emerge for implementing D&D class features:

### **Uses/Day and Uses/Week Modeling Patterns**

#### **Linear Scaling Pattern**
**Use Case**: Features that scale linearly since the feature started
**Formula**: @FormulaId.LINEAR_SCALING (1)
**Real Example**: Bardic Music uses per day (1 use at 1st level, +1 per level)
**Implementation**: `formulaId: 1, interval: 1, includeProgressionLevel: true`

#### **Complex Threshold Pattern**
**Use Case**: Features with non-linear progression at specific level milestones
**Formula**: @FormulaId.THRESHOLD_BASED (3)
**Real Example**: Druid Wild Shape uses per day with complex progression [5,6,7,10,14,18] → [1,2,3,4,5,6]
**Implementation**: `formulaId: 3, thresholds: [5, 6, 7, 10, 14, 18], values: [1, 2, 3, 4, 5, 6]`

#### **Interval-Based Pattern**
**Use Case**: Features that improve at regular level intervals
**Formula**: @FormulaId.EVERY_N_LEVELS (2)
**Real Example**: Bardic Music abilities improving every 3 levels
**Implementation**: `formulaId: 2, interval: 3, includeProgressionLevel: true`

#### **Delayed Progression Pattern**
**Use Case**: Features that start at different levels than the base feature
**Formula**: Any formula type with `formulaStartLevel` parameter
**Real Example**: Bardic Music abilities starting at 8th level
**Implementation**: `formulaStartLevel: 8, includeProgressionLevel: true`

### **Cross-System Integration Patterns**

#### **Language System Integration**
**Use Case**: Features that grant language access
**Entity Type**: @EntityType.Other (3)
**AppliesTo Types**: @EntityAppliesToType.Language (14), @EntityAppliesToType.Language (15), @EntityAppliesToType.Language (22)
**Real Example**: Druid Bonus Languages (Sylvan, Druidic)
**Implementation**: `type: 3, appliesTo: 14/15/22, appliesToId: language ID`

#### **Skill System Integration**
**Use Case**: Features that provide skill bonuses or proficiencies
**Entity Type**: @EntityType.Bonus (0) or @EntityType.Other (3)
**AppliesTo Type**: @EntityAppliesToType.Skill (1)
**Real Example**: Druid Nature Sense (+2 to Knowledge nature and Survival)
**Implementation**: `type: 0, appliesTo: 1, appliesToId: skill ID, value: bonus amount`

#### **Use System Integration**
**Use Case**: Features that provide uses/day or uses/week resources
**Entity Type**: @EntityType.Quantity (1)
**AppliesTo Type**: @EntityAppliesToType.Uses (10)
**Real Example**: Bardic Music uses, Druid Wild Shape uses
**Implementation**: `type: 1, appliesTo: 10, appliesToId: use type ID, formulaParams: scaling formula`

### **Complex Scaling and Delayed Progression Patterns**

#### **Complex Threshold Progression**
**Use Case**: Features with non-linear progression at specific level milestones
**Formula**: @FormulaId.THRESHOLD_BASED (3)
**Real Example**: Druid Wild Shape uses per day with complex progression
**Implementation**: `formulaId: 3, thresholds: [5, 6, 7, 10, 14, 18], values: [1, 2, 3, 4, 5, 6]`

#### **Delayed Progression Pattern**
**Use Case**: Features that start at different levels than the base feature
**Formula**: Any formula type with `formulaStartLevel` parameter
**Real Example**: Bardic Music abilities starting at 8th level
**Implementation**: `formulaStartLevel: 8, includeProgressionLevel: true`

#### **Ability-Based Scaling Pattern**
**Use Case**: Features that scale with level plus ability modifier
**Formula**: @FormulaId.LEVEL_PLUS_ABILITY (11)
**Real Example**: Druid Wild Empathy bonus = druid level + Charisma modifier
**Implementation**: `formulaId: 11, abilityId: 6, includeProgressionLevel: true`

## 🎨 **Utility Functions**

### **Display Formatting**

The static data includes utility functions for formatting feature information:

**Name Select Options**: Functions for creating select option lists from enum data
**Display Name Mapping**: Maps enum values to user-friendly display names
**Type Compatibility**: Functions for checking entity type compatibility with applies-to types
**Validation Helpers**: Utility functions for validating enum values

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (Utility function definitions)

## 🔗 **Integration Points**

### **Database Integration**

The static data integrates with the database layer:

**Enum Validation**: Ensures database values match enum definitions for entity types, applies-to types, and bonus types
**Type Safety**: Provides TypeScript types for database operations with unified entity approach
**Constraint Enforcement**: Enforces enum constraints in database operations
**Relationship Validation**: Validates enum-based relationships between entity types and applies-to types

### **Validation Integration**

The static data supports the validation layer:

**Schema Integration**: Provides enum values for Zod schemas including entity types and applies-to types
**Type Generation**: Generates TypeScript types for validation with unified entity approach
**Error Messages**: Provides enum-specific error messages for entity validation
**Cross-System Validation**: Validates cross-system references (skill IDs, language IDs, etc.)

### **Frontend Integration**

The static data supports frontend operations:

**Select Components**: Provides formatted data for dropdowns including entity types, applies-to types, and condition types
**Display Components**: Provides display names and formatting for all enum types
**Form Validation**: Provides validation rules for forms with unified entity approach
**Type Safety**: Ensures type safety in frontend components with entity type compatibility

### **Backend Integration**

The static data supports backend operations:

**Business Logic**: Provides enum values for business rules including entity type compatibility
**Calculation Logic**: Provides enum values for calculations with unified entity approach
**API Responses**: Provides formatted data for API responses including all enum types
**Error Handling**: Provides enum-specific error handling for entity validation

## 📚 **Related Documentation**

- **[Database Schema](database-schema.md)** - Feature system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Zod validation rules and types
- **[Class Implementation Examples](class-implementation-examples.md)** - Real-world implementation analysis using Monk, Bard, and Druid classes
- **[Backend Implementation](backend-implementation.md)** - Feature system backend implementation
- **[Frontend Components](frontend-components.md)** - Feature system frontend implementation

## 📊 **Performance Considerations**

The feature system static data follows shared performance optimization principles.

**For complete documentation on performance optimization, see**: [Performance Optimization](../application-overview/performance-optimization.md)

**Feature-Specific Performance Benefits**:
- **Fast Enum Lookups**: Direct access to enum values for entity types, applies-to types, and bonus types
- **Efficient Select Lists**: Pre-formatted select lists for UI components including all enum types
- **Optimized Validation**: Fast enum validation for feature data with unified entity approach
- **Reduced API Calls**: Static data eliminates need for backend requests for enum definitions and select options
- **Type Compatibility Matrix**: Pre-computed compatibility matrix for entity types and applies-to types

## 🔧 **Maintenance and Updates**

The feature system static data follows shared maintenance and extension practices.

**For complete documentation on maintenance and extension, see**: [Maintenance and Extension](../application-overview/maintenance-and-extension.md)

**Feature-Specific Maintenance Considerations**:
- **Enum Value Management**: Adding new enum values for entity types, applies-to types, and condition types
- **Backward Compatibility**: Ensuring new enum values don't break existing feature data
- **Validation Updates**: Updating validation schemas when new enum values are added
- **UI Component Updates**: Updating select lists and form components when enum values change
- **Type Compatibility Updates**: Updating the entity type compatibility matrix when new applies-to types are added
