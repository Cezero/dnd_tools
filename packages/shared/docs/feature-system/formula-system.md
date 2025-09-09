# Feature System Formula System

*Comprehensive documentation of mathematical formulas for feature progression, including formula definitions, calculations, and usage patterns.*

## 📋 **Overview**

The formula system provides mathematical progression patterns for features that scale with character level, ability scores, or other character attributes. These formulas enable complex feature calculations such as linear scaling, conditional upgrades, ability-based bonuses, and dice-based progression.

The formula system allows features to have dynamic values that change based on character advancement, providing sophisticated progression patterns that go beyond simple static bonuses.

**Source File**: `packages/shared/static-data/src/FormulaDefinitions.ts`

## 🏗️ **Formula Architecture**

### **Formula System Structure**

The formula system is built around a flexible architecture that supports various mathematical patterns:

**Formula Definitions**: Core mathematical formulas with standardized parameters
**Parameter System**: Flexible parameter system for formula customization
**Calculation Engine**: Centralized calculation logic for all formula types
**Integration Layer**: Integration with the feature system for seamless usage

### **Formula Integration**

The formula system integrates with other system layers:

**Database Integration**: Formula parameters stored in database with feature modifiers
**Validation Integration**: Formula parameters validated using Zod schemas
**Frontend Integration**: Formula configuration through user interfaces
**Calculation Integration**: Real-time calculation during character advancement

## 🎯 **Core Formula Types**

### **Linear Scaling**

Scales linearly since the feature started, providing a consistent progression pattern.

**Purpose**: Provides steady, predictable progression that increases by a fixed amount each level.

**Mathematical Pattern**: `(level - startLevel + 1) × scalingValue`

**Key Parameters**:
- **`level`**: Current character level
- **`startLevel`**: Level when the progression begins
- **`scalingValue`**: Value to scale by (from feature modifier)

**Calculation Logic**:
- **Before Start Level**: Returns 0 (no progression yet)
- **After Start Level**: Calculates levels since start and multiplies by scaling value
- **Progressive Growth**: Steady increase each level after the start level

**Common Uses**:
- **Skill Bonuses**: +2 bonus to skills every level
- **Sneak Attack**: +1d6 damage every level
- **Ability Bonuses**: +1 to ability scores every few levels
- **Resource Increases**: Additional uses per day every level

**Source File**: `packages/shared/static-data/src/FormulaDefinitions.ts` (LINEAR_SCALING definition)

### **Every N Levels**

Increases every N levels starting from a specific level, with optional formula start level.

**Purpose**: Provides progression that occurs at regular intervals rather than every level.

**Mathematical Pattern**: `scalingValue + (intervals since start) × scalingValue`

**Key Parameters**:
- **`level`**: Current character level
- **`startLevel`**: Level when the progression begins
- **`scalingValue`**: Base value to scale by
- **`interval`**: Level interval between increases
- **`formulaStartLevel`**: Optional level when formula progression begins

**Calculation Logic**:
- **Before Start Level**: Returns 0 (no progression yet)
- **Before Formula Start**: Returns base scaling value
- **After Formula Start**: Calculates intervals and applies progressive scaling
- **Interval-Based**: Increases occur at regular level intervals

**Common Uses**:
- **Sneak Attack**: +1d6 every 2 levels
- **Favored Enemy**: +1 favored enemy every 5 levels
- **Spell Resistance**: +1 SR every 3 levels
- **Special Abilities**: New abilities every few levels

**Source File**: `packages/shared/static-data/src/FormulaDefinitions.ts` (EVERY_N_LEVELS definition)

### **Conditional Scaling**

Different values based on level thresholds, providing step-based progression with enhanced cumulative and semantic options.

**Purpose**: Provides progression that changes at specific level thresholds rather than continuous scaling, with support for cumulative values and semantic value interpretation.

**Mathematical Pattern**: Value based on highest threshold that level is >= to (replacement) or array of all applicable values (cumulative)

**Key Parameters**:
- **`level`**: Current character level
- **`startLevel`**: Level when the progression begins
- **`scalingValue`**: Base scaling value
- **`thresholds`**: Array of level thresholds
- **`values`**: Array of corresponding values
- **`valuesRepresent`**: What the values represent (Value or AppliesToId)
- **`cumulative`**: Whether values accumulate instead of replacing

**Calculation Logic**:
- **Replacement Mode** (cumulative = false): Finds highest threshold that current level meets or exceeds, returns corresponding value
- **Cumulative Mode** (cumulative = true): Returns array of all values for thresholds that current level meets or exceeds
- **Default Value**: Returns first value if level is below all thresholds
- **Step Progression**: Provides discrete steps rather than continuous scaling

**Enhanced Features**:
- **Cumulative Behavior**: When enabled, values accumulate instead of replacing previous ones
- **Semantic Values**: Values can represent either direct values or appliesToId lookups
- **Backward Compatibility**: Default behavior unchanged (replacement mode, value semantics)

**Common Uses**:
- **Base Attack Bonus**: Different BAB values at specific levels
- **Saving Throws**: Different save bonuses at level thresholds
- **Special Abilities**: New abilities at specific levels
- **Proficiency Upgrades**: Improved proficiencies at level milestones
- **Wild Shape Sizes**: Cumulative size categories that unlock at different levels
- **Size Category Progression**: Multiple size options that accumulate over time

**Source File**: `packages/shared/static-data/src/FormulaDefinitions.ts` (CONDITIONAL_SCALING definition)

### **Dice Scaling**

Scales with dice-based progression, typically for damage or healing effects.

**Purpose**: Provides progression that increases dice values or quantities over time.

**Mathematical Pattern**: Dice-based calculation with level scaling

**Key Parameters**:
- **`level`**: Current character level
- **`startLevel`**: Level when the progression begins
- **`scalingValue`**: Base dice value
- **`interval`**: Level interval for dice increases

**Calculation Logic**:
- **Dice Progression**: Increases dice values at regular intervals
- **Level Scaling**: Dice values scale with character level
- **Interval-Based**: Increases occur at specific level intervals
- **Damage/Healing**: Typically used for damage or healing effects

**Common Uses**:
- **Sneak Attack**: Increasing dice for sneak attack damage
- **Healing**: Increasing healing dice values
- **Damage Spells**: Scaling damage dice with level
- **Special Attacks**: Increasing damage dice for special abilities

**Source File**: `packages/shared/static-data/src/FormulaDefinitions.ts` (DICE_SCALING definition)

### **Ability-Based Formulas**

Formulas that depend on character ability scores for their calculations.

**Purpose**: Provides progression that scales with character ability scores rather than just level.

**Formula Types**:

**Ability-Based**: Base value + ability modifier
- **Pattern**: `baseValue + abilityModifier`
- **Uses**: Skills, saves, and abilities that depend on ability scores

**Ability Modifier**: Just ability modifier
- **Pattern**: `abilityModifier`
- **Uses**: Effects that are purely based on ability scores

**Level Times Ability**: Level × ability modifier
- **Pattern**: `level × abilityModifier`
- **Uses**: Effects that scale with both level and ability

**Level Plus Ability**: Level + ability modifier
- **Pattern**: `level + abilityModifier`
- **Uses**: Effects that combine level and ability scaling

**Common Uses**:
- **Skill Checks**: Skills that depend on ability modifiers
- **Saving Throws**: Saves that scale with ability scores
- **Special Abilities**: Abilities that depend on character attributes
- **Resource Calculations**: Resources based on ability scores

**Source File**: `packages/shared/static-data/src/FormulaDefinitions.ts` (Ability-based formula definitions)

### **Value-Based Formulas**

Formulas that use fixed values combined with level-based scaling.

**Purpose**: Provides progression that combines fixed values with level-based increases.

**Formula Types**:

**Level Times Value**: Total level × base value
- **Pattern**: `level × baseValue`
- **Uses**: Effects that scale linearly with level

**Value Plus Level**: Fixed value + level
- **Pattern**: `fixedValue + level`
- **Uses**: Effects that have a base value plus level scaling

**Common Uses**:
- **Healing**: Healing effects that scale with level
- **Spell Resistance**: SR that increases with level
- **Resource Generation**: Resources that scale with level
- **Special Effects**: Effects that combine fixed and scaling values

**Source File**: `packages/shared/static-data/src/FormulaDefinitions.ts` (Value-based formula definitions)

## 🔧 **Formula Parameters**

### **Parameter System**

The formula system uses a flexible parameter system for customization:

**Core Parameters**:
- **`formulaId`**: Identifies the specific formula type
- **`formulaStartLevel`**: Level when formula progression begins
- **`interval`**: Interval for interval-based formulas
- **`abilityId`**: Ability score for ability-based formulas
- **`thresholds`**: Level thresholds for conditional scaling
- **`values`**: Values corresponding to thresholds

**Parameter Validation**:
- **Type Validation**: Ensures parameters match expected types
- **Range Validation**: Validates parameter ranges and constraints
- **Relationship Validation**: Ensures parameter relationships are valid
- **Default Values**: Provides sensible defaults for missing parameters

### **Parameter Storage**

Formula parameters are stored in the database:

**FeatureFormulaParams Model**: Stores formula parameters with feature modifiers
**Parameter Serialization**: Complex parameters stored as serialized data
**Parameter Relationships**: Parameters linked to specific feature modifiers
**Parameter Validation**: Database-level validation of parameter integrity

## 📊 **Calculation Engine**

### **Calculation Process**

The formula calculation engine follows a structured process:

**Parameter Retrieval**: Retrieves formula parameters from database
**Parameter Validation**: Validates parameters before calculation
**Formula Selection**: Selects appropriate formula based on formula ID
**Calculation Execution**: Executes mathematical calculation
**Result Validation**: Validates calculation results
**Result Formatting**: Formats results for display and use

### **Calculation Context**

Calculations are performed within specific contexts:

**Character Context**: Character level, ability scores, and other attributes
**Feature Context**: Feature progression and associated data
**Level Context**: Current character level and progression
**Ability Context**: Relevant ability scores for ability-based formulas

### **Error Handling**

The calculation engine includes comprehensive error handling:

**Parameter Errors**: Handles missing or invalid parameters
**Calculation Errors**: Handles mathematical calculation errors
**Context Errors**: Handles missing context information
**Validation Errors**: Handles validation failures

## 🔗 **Integration Points**

### **Feature System Integration**

The formula system integrates with the feature system:

**Modifier Integration**: Formulas used with feature modifiers
**Progression Integration**: Formulas applied to feature progressions
**Calculation Integration**: Real-time calculation during feature application
**Display Integration**: Formula results displayed in feature descriptions

### **Character System Integration**

The formula system integrates with the character system:

**Level Integration**: Character level used in formula calculations
**Ability Integration**: Character ability scores used in ability-based formulas
**Progression Integration**: Formula results applied to character statistics
**Display Integration**: Formula results displayed on character sheets

### **Validation Integration**

The formula system integrates with the validation system:

**Parameter Validation**: Formula parameters validated using Zod schemas
**Calculation Validation**: Calculation results validated for reasonableness
**Context Validation**: Calculation context validated before execution
**Error Validation**: Formula errors handled and reported appropriately

## 📈 **Performance Considerations**

### **Calculation Optimization**

The formula system is optimized for performance:

**Caching**: Calculation results cached where appropriate
**Efficient Algorithms**: Optimized mathematical algorithms
**Batch Processing**: Batch calculations for multiple formulas
**Lazy Evaluation**: Calculations performed only when needed

### **Memory Management**

The formula system manages memory efficiently:

**Parameter Reuse**: Formula parameters reused across calculations
**Result Caching**: Calculation results cached to avoid recalculation
**Memory Pooling**: Memory pooled for calculation objects
**Garbage Collection**: Proper cleanup of calculation objects

## 🛠️ **Usage Patterns**

### **Common Formula Patterns**

The formula system supports common progression patterns:

**Linear Progression**: Steady increases over time
**Step Progression**: Discrete increases at specific levels
**Ability-Based Progression**: Progression based on character abilities
**Hybrid Progression**: Combinations of different progression types

### **Formula Configuration**

Formulas are configured through the feature system:

**Parameter Setup**: Formula parameters configured through UI
**Validation**: Parameters validated before saving
**Testing**: Formulas tested with sample data
**Documentation**: Formula behavior documented for users

## 🔄 **Maintenance and Updates**

### **Formula Management**

The formula system includes management capabilities:

**Formula Addition**: New formulas can be added to the system
**Parameter Extension**: Formula parameters can be extended
**Calculation Updates**: Calculation logic can be updated
**Backward Compatibility**: Changes maintain backward compatibility

## 🔧 **Enhanced Formula Parameters**

### **ConditionalScalingValueType Enum**

The enhanced formula system introduces semantic value interpretation through the `ConditionalScalingValueType` enum.

**Purpose**: Defines what formula values represent, enabling more sophisticated progression patterns.

**Values**:
- **`Value` (0)**: Default behavior - values represent direct numeric or string values
- **`AppliesToId` (1)**: Values represent IDs to look up in appliesTo enums (e.g., size categories, creature types)

**Source File**: `packages/shared/static-data/src/FeatureData.ts` (ConditionalScalingValueType definition)

### **Enhanced FeatureFormulaParams**

The `FeatureFormulaParams` model has been extended with new fields for complex scaling patterns.

**New Fields**:
- **`valuesRepresent`**: ConditionalScalingValueType enum indicating what values represent
- **`cumulative`**: Boolean flag indicating whether values accumulate or replace

**Database Schema**: `backend/prisma/schema.prisma` (FeatureFormulaParams model)
**Validation Schema**: `packages/shared/schema/src/feature.ts` (FeatureFormulaParamsSchema)

### **Cumulative Behavior**

When `cumulative` is enabled, formulas return arrays of applicable values instead of single replacement values.

**Replacement Mode** (cumulative = false):
- Returns single value based on highest applicable threshold
- Used for traditional progression (e.g., BAB, save bonuses)
- Maintains backward compatibility

**Cumulative Mode** (cumulative = true):
- Returns array of all values for applicable thresholds
- Used for accumulating abilities (e.g., Wild Shape sizes)
- Enables complex progression patterns

### **Implementation Examples**

#### **Wild Shape Size Progression**
```typescript
// FeatureFormulaParams for cumulative size categories
{
    formulaId: FormulaId.CONDITIONAL_SCALING,
    thresholds: [1, 4, 8, 11, 15, 20],
    values: [1, 2, 3, 4, 5, 6], // Size category IDs
    valuesRepresent: ConditionalScalingValueType.AppliesToId,
    cumulative: true
}

// Level 8 druid gets: [1, 2, 3] (Small, Medium, Large)
// Level 11 druid gets: [1, 2, 3, 4] (Small, Medium, Large, Huge)
```

#### **Traditional BAB Progression** (Backward Compatible)
```typescript
// FeatureFormulaParams for traditional BAB
{
    formulaId: FormulaId.CONDITIONAL_SCALING,
    thresholds: [1, 6, 11, 16],
    values: [1, 2, 3, 4], // BAB values
    valuesRepresent: ConditionalScalingValueType.Value, // Default
    cumulative: false // Default
}

// Level 8 fighter gets: 2 (single BAB value)
```

### **Frontend Integration**

The enhanced parameters are fully integrated into the frontend UI:

**FormulaParamsEditor**: Updated to include controls for `valuesRepresent` and `cumulative` fields
**Validation**: Zod schemas validate the new fields
**User Experience**: Clear labels and help text explain the new options

**Source File**: `frontend/src/components/feature-system/FeatureProgressionDetailEdit/FormulaParamsEditor.tsx`

### **Testing and Validation**

The formula system includes comprehensive testing:

**Unit Testing**: Individual formula calculations tested
**Integration Testing**: Formula integration with other systems tested
**Performance Testing**: Formula performance tested with large datasets
**Validation Testing**: Formula validation logic tested 
