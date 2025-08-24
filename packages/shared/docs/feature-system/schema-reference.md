# Schema Reference

*Database schema and enum definitions for the feature system.*

## Core Entities

### **Feature**
A Feature represents a standalone game mechanic or ability that can be applied to characters. Features contain the basic definition of what the ability does, including its name, description, and any prerequisites.

**Key Properties:**
- **Name**: Human-readable name of the feature
- **Slug**: URL-friendly identifier used in routing and references
- **Description**: Detailed explanation of what the feature does
- **Prerequisites**: Optional requirements that must be met to use this feature

**Source**: `packages/shared/schema/src/feature.ts` - `FeatureSchema`

**Important Relationship Note**: Features are standalone entities that define the basic properties. FeatureProgressions reference Features via `featureId` to specify how that feature is applied in different contexts (classes, races, etc.).

### **FeatureProgression**
A FeatureProgression defines how a specific Feature is applied in a particular context, such as a class or race. It specifies when the feature is gained, what modifiers it provides, and any choices or special effects associated with it.

**Key Properties:**
- **Feature Reference**: Links to the base Feature via `featureId`
- **Source Type**: Indicates whether this progression comes from a Class, Race, or Template
- **Level**: The character level when this feature is gained
- **Source ID**: References the specific class, race, or template that provides this progression
- **Modifiers**: Numerical bonuses or penalties applied by this feature
- **Choices**: Optional selections the player must make when gaining this feature
- **Effects**: Special abilities or properties granted by this feature

**Relationship Direction**: FeatureProgressions → Features (many-to-one)
- FeatureProgressions have a `featureId` that links to a Feature
- Features do NOT have a direct reference to FeatureProgressions
- This allows the same Feature to be used in multiple contexts (classes, races, etc.) with different progression details

**Source**: `packages/shared/schema/src/feature.ts` - `FeatureProgressionSchema`

### **FeatureModifier**
A FeatureModifier represents a numerical bonus, penalty, or quantity that a feature provides. Modifiers can apply to various character attributes, skills, saving throws, and other game mechanics.

**Key Properties:**
- **Type**: The kind of modifier (bonus, penalty, quantity, uses)
- **Value**: The numerical value of the modifier
- **Applies To**: What game mechanic this modifier affects (attributes, skills, AC, etc.)
- **Bonus Type**: How this modifier stacks with other bonuses (circumstance, competence, enhancement, etc.)
- **Formula Parameters**: Optional complex calculation rules for the modifier value
- **Conditions**: Optional requirements that must be met for this modifier to apply

**Source**: `packages/shared/schema/src/feature.ts` - `FeatureModifierSchema`

### **FeatureModifierFormulaParams**
Formula parameters define complex calculation rules for modifier values that change based on character level, attributes, or other factors. This allows for dynamic modifiers that scale with character progression.

**Key Properties:**
- **Formula ID**: References the specific calculation formula to use
- **Interval**: Level interval for scaling (e.g., every 4 levels)
- **Start Level**: Level when formula progression begins
- **Attribute ID**: Attribute used in attribute-based calculations
- **Thresholds**: Level thresholds for conditional scaling (comma-separated)
- **Values**: Corresponding values for each threshold (comma-separated)

**Source**: `packages/shared/schema/src/feature.ts` - `FeatureModifierFormulaParamsSchema`

## Key Enums

### **ModifierType**
Defines the different types of numerical changes a modifier can represent:
- **Bonus**: Positive numerical adjustments (+2 to attack)
- **Penalty**: Negative numerical adjustments (-2 to AC)
- **Quantity**: Count-based values (+1d6 damage, 3/day uses)
- **Uses**: Usage limits (3/day, 1/week)

**Source**: `packages/shared/schema/src/feature.ts` - `ModifierType` enum

### **ModifierAppliesToType**
Specifies what game mechanic a modifier affects:
- **Core Attributes**: STR, DEX, CON, INT, WIS, CHA
- **Skills**: Climb, Jump, Diplomacy, etc.
- **Combat**: Attack rolls, damage, AC, initiative
- **Saving Throws**: Fortitude, Reflex, Will
- **Movement**: Speed, reach, range
- **Resources**: Hit dice, uses per day, targets

**Source**: `packages/shared/schema/src/feature.ts` - `ModifierAppliesToType` enum

### **FeatureBonusType**
Defines how bonuses stack with other bonuses of the same type:
- **Circumstance**: Stacks with everything
- **Competence**: Doesn't stack with other competence bonuses
- **Enhancement**: Doesn't stack with other enhancement bonuses
- **Dodge**: Stacks with other dodge bonuses
- **Size**: Doesn't stack with other size bonuses
- **Other**: Custom stacking rules

**Source**: `packages/shared/schema/src/feature.ts` - `FeatureBonusType` enum

### **FeatureSourceType**
Indicates where a feature progression comes from:
- **Class**: Features gained from character class levels
- **Race**: Features inherent to the character's race
- **Template**: Features from character templates or prestige classes

**Source**: `packages/shared/schema/src/feature.ts` - `FeatureSourceType` enum

## Formula System

The formula system provides dynamic calculation of modifier values based on character level, attributes, and other factors. This allows for complex scaling that matches D&D 3.5 progression patterns.

### **Formula Types**
The system includes 10 generic formulas covering common D&D 3.5 scaling patterns:
- **Linear Scaling**: Simple level-based multipliers
- **Every N Levels**: Incremental increases at specific level intervals
- **Conditional Scaling**: Different values based on level thresholds
- **Dice Scaling**: Dice-based damage that increases with level
- **Attribute-Based**: Modifiers that depend on character attributes
- **Level Times Value**: Multiplicative scaling with level

**Source**: `packages/shared/static-data/src/FormulaDefinitions.ts`

### **Formula Parameters**
Each formula type uses specific parameters to define its behavior:
- **Interval**: Level interval for scaling (used by EVERY_N_LEVELS, DICE_SCALING)
- **Start Level**: Level when formula progression begins
- **Attribute ID**: Attribute used in attribute-dependent calculations
- **Thresholds**: Level thresholds for conditional scaling
- **Values**: Corresponding values for each threshold

## Type Compatibility Rules

### **ModifierType Compatibility**
Different modifier types can only apply to compatible target types:
- **Bonus/Penalty** modifiers work with attributes, skills, saving throws, AC, attack, damage
- **Quantity** modifiers work with movement speed, hit dice, uses, targets, distance
- **Uses** modifiers work with usage limits and resource management

### **Bonus Type Stacking**
Bonus stacking follows D&D 3.5 rules:
- **Same type bonuses don't stack** (highest applies)
- **Different type bonuses stack** (add together)
- **Circumstance bonuses stack** with everything
- **Dodge bonuses stack** with other dodge bonuses

## FeatureProgression Management

The system now supports managing FeatureProgressions for individual features through dedicated endpoints:

### **Individual Feature Management**
- `GET /features/:id/progressions` - Get all progressions for a specific feature
- `PUT /features/:id/progressions` - Update progressions for a specific feature

### **Bulk Operations (Class/Race Management)**
- `POST /features/progressions/bulk` - Create progressions for class/race creation

### **Usage Patterns**
1. **Standalone Feature Management**: Use individual endpoints to manage FeatureProgressions for features
2. **Class/Race Integration**: Use bulk endpoints when creating/updating classes or races
3. **Feature Creation**: Create the feature first, then add progressions using the individual endpoints

**Source**: `packages/shared/schema/src/feature.ts` - `UpdateFeatureProgressionsRequestSchema`, `GetFeatureProgressionsResponseSchema`

**Related Documentation:**
- [Class System Documentation](../class-system/README.md) - How classes integrate with FeatureProgressions
- [Race System Documentation](../race-system/README.md) - How races integrate with FeatureProgressions
- [FeatureProgression Management](feature-progression-management.md) - Detailed management documentation

## API Usage Notes

### **Bulk Operations Only**
- **No Individual CRUD**: No endpoints for individual modifier/choice/effect operations
- **Complete Data**: Send full nested feature data in single requests
- **Backend Cleanup**: Backend handles deletion of old data during updates

### **Required Fields**
- `Feature`: slug, name, description
- `FeatureProgression`: featureId, sourceType, level, sourceId (classId/raceId/templateId)
- `FeatureModifier`: featureProgressionId, type, value, appliesTo
- `FeatureModifierFormulaParams`: formulaId (when using formulas)

### **Optional Fields**
- `formulaParamsId` and `formulaParams`: For formula-based calculations
- `appliesIfChoiceKey/Value`: For choice-dependent modifiers
- `conditions`: For runtime conditional application
- `spellcasting`: For spellcasting progression integration

## Schema Simplifications

The schema has been simplified to focus on actual usage patterns:

### **Removed Components**
- Individual CRUD schemas (CreateFeatureModifierSchema, UpdateFeatureModifierSchema, etc.)
- Base/Full patterns (BaseFeatureModifierSchema, FeatureModifierWithConditionsSchema, etc.)
- "ForBulk" schemas (CreateFeatureModifierForBulkSchema, etc.)
- Unused response schemas (GetFeatureModifiersResponseSchema, etc.)

### **Kept Components**
- Core schemas (FeatureSchema, FeatureProgressionSchema, FeatureModifierSchema, etc.)
- Bulk operation schemas (CreateFeatureProgressionSchema for class/race creation)
- Essential routes (only routes that are actually used)
- Core service methods (only methods that are actually called)

### **Benefits**
- **Reduced Maintenance**: ~50% less schema code to maintain
- **Clearer Intent**: Schema clearly reflects actual usage patterns
- **Better Performance**: Fewer unused endpoints and methods
- **Simplified Development**: Developers only need to understand used schemas
