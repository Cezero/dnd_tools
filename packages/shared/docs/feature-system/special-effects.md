# Special Effects

The special effects system is a component of the feature system that handles unique abilities, special attacks, extraordinary powers, and other non-standard character capabilities that don't fit into the standard modifier or choice frameworks.

## 📋 **Overview**

Special effects represent the most complex and unique aspects of character features, including:
- **Proficiencies**: Weapon, armor, and skill proficiencies
- **Favored Enemy**: Special bonuses against specific creature types
- **Turn Undead**: Cleric and paladin turn undead abilities
- **Wild Shape**: Druid wild shape forms and abilities
- **Weapon Familiarity**: Racial weapon familiarity effects
- **Custom Effects**: Arbitrary special rules and effects

The special effects system provides a flexible framework for implementing complex character abilities that require custom handling beyond simple modifiers.

**Source Files**: 
- Database Schema: `prisma/schema.prisma` (FeatureSpecialEffect model)
- Validation Schemas: `packages/shared/schema/src/feature.ts`
- Static Data: `packages/shared/static-data/src/FeatureData.ts`

## 🏗️ **System Architecture**

### **Special Effects System Structure**

The special effects system is built around a flexible architecture that supports various types of special abilities:

**Effect Types**: Different categories of special effects (Proficiency, FavoredEnemy, TurnUndead, etc.)
**Effect Values**: Flexible value storage for effect-specific data
**Related Entities**: Links to feats, items, and other game entities
**Integration Layer**: Integration with feature progressions and character data

### **Special Effects Integration**

The special effects system integrates with other system layers:

**Database Integration**: Special effects stored in database with feature progressions
**Validation Integration**: Special effects validated using Zod schemas
**Character Integration**: Special effects applied to character abilities
**Display Integration**: Special effects displayed on character sheets and UI

## 🎯 **Core Special Effect Types**

### **Proficiency Effects (0)**

Effects that grant proficiency with weapons, armor, or skills.

**Purpose**: Provides proficiency bonuses for equipment and skills.

**Key Characteristics**:
- **Proficiency Grant**: Grants proficiency with specific items or skills
- **Key-Value Storage**: Uses key and value fields for specific proficiency details
- **Equipment Integration**: Can reference specific weapons, armor, or items
- **Character Impact**: Affects character's ability to use equipment effectively

**Common Uses**:
- **Weapon Proficiency**: Grant proficiency with specific weapons
- **Armor Proficiency**: Grant proficiency with specific armor types
- **Skill Proficiency**: Grant proficiency with specific skills
- **Tool Proficiency**: Grant proficiency with specific tools

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureSpecialEffectType.Proficiency definition)

### **Favored Enemy Effects (1)**

Effects that provide bonuses against specific creature types.

**Purpose**: Provides special bonuses and abilities against specific creature types.

**Key Characteristics**:
- **Creature Type Targeting**: Provides bonuses against specific creature types
- **Key-Value Storage**: Uses key and value fields for creature type details
- **Combat Bonuses**: Typically provides attack and damage bonuses
- **Character Impact**: Affects combat effectiveness against specific enemies

**Common Uses**:
- **Ranger Favored Enemy**: Ranger favored enemy bonuses
- **Paladin Smite Evil**: Paladin smite evil against specific types
- **Special Abilities**: Creature type-specific special abilities

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureSpecialEffectType.FavoredEnemy definition)

### **Conditional Upgrade Effects (2)**

Effects that upgrade existing abilities under specific conditions.

**Purpose**: Provides conditional improvements to existing character abilities.

**Key Characteristics**:
- **Conditional Application**: Effects apply under specific conditions
- **Ability Upgrades**: Improves existing character abilities
- **Key-Value Storage**: Uses key and value fields for condition details
- **Character Impact**: Provides situational improvements to abilities

**Common Uses**:
- **Improved Critical**: Improved critical hit abilities
- **Greater Weapon Focus**: Enhanced weapon focus abilities
- **Conditional Bonuses**: Bonuses that apply under specific conditions

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureSpecialEffectType.ConditionalUpgrade definition)

### **Turn Undead Effects (3)**

Effects that grant turn undead abilities to clerics and paladins.

**Purpose**: Provides turn undead abilities with specific parameters.

**Key Characteristics**:
- **Turn Undead Ability**: Grants turn undead special ability
- **Numeric Values**: Uses numericValue for turn attempts and other parameters
- **Divine Integration**: Typically associated with divine spellcasters
- **Character Impact**: Provides powerful undead control abilities

**Common Uses**:
- **Cleric Turn Undead**: Cleric turn undead ability
- **Paladin Turn Undead**: Paladin turn undead ability
- **Turn Attempts**: Number of turn attempts per day
- **Turn Level**: Effective turn level for undead

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureSpecialEffectType.TurnUndead definition)

### **Wild Shape Form Effects (4)**

Effects that grant wild shape forms to druids.

**Purpose**: Provides wild shape form options for druid characters.

**Key Characteristics**:
- **Form Options**: Grants access to specific wild shape forms
- **Key-Value Storage**: Uses key and value fields for form details
- **Druid Integration**: Typically associated with druid class
- **Character Impact**: Provides powerful shape-changing abilities

**Common Uses**:
- **Animal Forms**: Wild shape into specific animals
- **Elemental Forms**: Wild shape into elemental forms
- **Plant Forms**: Wild shape into plant forms
- **Form Restrictions**: Limit available wild shape forms

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureSpecialEffectType.WildShapeForm definition)

### **Wild Shape Size Effects (5)**

Effects that grant wild shape size options to druids.

**Purpose**: Provides size category options for wild shape abilities.

**Key Characteristics**:
- **Size Options**: Grants access to specific size categories
- **Key-Value Storage**: Uses key and value fields for size details
- **Druid Integration**: Typically associated with druid class
- **Character Impact**: Affects wild shape size capabilities

**Common Uses**:
- **Large Wild Shape**: Ability to wild shape into large forms
- **Tiny Wild Shape**: Ability to wild shape into tiny forms
- **Size Restrictions**: Limit available wild shape sizes
- **Size Progression**: Progressive size options with level

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureSpecialEffectType.WildShapeSize definition)

### **Weapon Familiarity Effects (7)**

Effects that grant weapon familiarity to characters.

**Purpose**: Provides racial or class-based weapon familiarity.

**Key Characteristics**:
- **Weapon Familiarity**: Grants familiarity with specific weapons
- **Key-Value Storage**: Uses key and value fields for weapon details
- **Racial Integration**: Often associated with racial traits
- **Character Impact**: Affects weapon proficiency and usage

**Common Uses**:
- **Dwarf Weapon Familiarity**: Dwarf familiarity with axes and hammers
- **Elf Weapon Familiarity**: Elf familiarity with bows and swords
- **Class Weapon Familiarity**: Class-based weapon familiarity
- **Cultural Weapon Familiarity**: Cultural weapon familiarity

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureSpecialEffectType.WeaponFamiliarity definition)

### **Other Effects (6)**

Effects for custom and special cases that don't fit other categories.

**Purpose**: Handles custom effects and special cases requiring unique handling.

**Key Characteristics**:
- **Custom Logic**: Requires custom handling and logic
- **Flexible Storage**: Uses key, value, and numericValue fields flexibly
- **Entity Integration**: Can reference feats, items, or other entities
- **Character Impact**: Provides unique character abilities

**Common Uses**:
- **Direct Feat Grants**: Grant specific feats directly
- **Item Grants**: Grant specific items or equipment
- **Custom Abilities**: Unique character abilities
- **Special Rules**: Special game rules and mechanics

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (FeatureSpecialEffectType.Other definition)

## 🔗 **Integration Points**

### **Database Integration**

The special effects system integrates with the database layer:

**FeatureSpecialEffect Model**: Stores special effect data with feature progressions
**Related Entity Links**: Links to feats, items, and other game entities
**Relationship Management**: Links special effects to feature progressions
**Data Integrity**: Ensures referential integrity across special effect relationships

### **Backend Integration**

The special effects system integrates with the backend service layer:

**createMultipleFeatureProgressions**: Creates special effects as part of feature progression creation
**Entity Integration**: Links special effects to feats and items
**Transaction Safety**: Special effects created within database transactions
**Bulk Operations**: Special effects created in bulk with feature progressions

**Source File**: `apps/backend/src/features/featureSystem/featureSystemService.ts`

### **Validation Integration**

The special effects system integrates with the validation layer:

**Schema Validation**: Special effects validated using Zod schemas
**Type Validation**: Ensures effect types match expected values
**Value Validation**: Validates effect values and parameters
**Entity Validation**: Validates related entity references

### **Character Integration**

The special effects system integrates with the character system:

**Ability Application**: Special effects applied to character abilities
**Effect Calculation**: Special effects included in character calculations
**Display Integration**: Special effects displayed on character sheets
**Real-time Updates**: Special effect changes reflected immediately in character data

## 📊 **Effect Management**

### **Effect Configuration**

Special effects are configured through the feature system:

**Type Selection**: Choose appropriate effect type
**Value Configuration**: Set effect values and parameters
**Entity Linking**: Link effects to related feats or items
**Parameter Setup**: Configure effect-specific parameters

### **Effect Application**

Special effects are applied to characters:

**Ability Granting**: Grant special abilities to characters
**Effect Calculation**: Calculate effect values and parameters
**Condition Checking**: Check conditions for effect application
**Integration**: Integrate effects with character systems

### **Effect Display**

Special effects are displayed through user interfaces:

**Effect Description**: Display effect descriptions and details
**Parameter Display**: Show effect parameters and values
**Related Entity Display**: Display related feats and items
**Effect Status**: Show effect activation status

## 🛠️ **Usage Patterns**

### **Common Effect Patterns**

The special effects system supports common usage patterns:

**Proficiency Grants**: Grant proficiency with equipment or skills
**Special Abilities**: Grant unique character abilities
**Conditional Effects**: Effects that apply under specific conditions
**Entity Integration**: Effects that reference other game entities

### **Effect Configuration**

Special effects are configured through the feature system:

**Type Selection**: Choose appropriate effect type
**Value Setup**: Configure effect values and parameters
**Entity Linking**: Link effects to related entities
**Parameter Configuration**: Set up effect-specific parameters

## 🔄 **Maintenance and Updates**

### **Effect Management**

The special effects system includes management capabilities:

**Effect Addition**: New effects can be added to features
**Value Updates**: Effect values can be modified
**Entity Updates**: Related entity links can be updated
**Type Changes**: Effect types can be changed when appropriate

### **Validation and Testing**

The special effects system includes comprehensive validation:

**Type Validation**: Ensures effect types are valid
**Value Validation**: Validates effect values and parameters
**Entity Validation**: Tests related entity references
**Integration Testing**: Tests effect integration with other systems
