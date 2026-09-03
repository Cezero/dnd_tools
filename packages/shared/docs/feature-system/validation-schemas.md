# Feature System Validation Schemas

*Comprehensive documentation of Zod validation schemas for the feature system, covering type safety, validation rules, and error handling.*

## 📋 **Overview**

The feature system uses Zod validation schemas to ensure type safety and data integrity across all API operations. These schemas provide runtime validation, automatic error messages, and TypeScript type generation for the feature system's complex data structures.

The validation layer follows the shared [Validation Schema Patterns](../application-overview/validation-schemas.md) with feature-specific validation rules and constraints. The system uses a unified entity approach where all feature effects are handled through a single `FeatureEntitySchema`.

**Source File**: `packages/shared/schema/src/feature.ts`

## 🏗️ **Schema Architecture**

The feature system validation follows the shared [Layered Validation Architecture](../application-overview/validation-schemas.md#layered-validation-architecture) with feature-specific implementations:

**Schema Layer**: Zod schemas for runtime validation and type safety
**Type Layer**: TypeScript types generated from schemas for compile-time safety
**Error Layer**: Comprehensive error handling and user feedback
**Integration Layer**: API integration and frontend form validation

### **Schema Hierarchy Pattern**

The feature system uses the shared [Schema Hierarchy Pattern](../application-overview/validation-schemas.md#schema-hierarchy-pattern) with feature-specific variations:

**Base Schemas**: Core validation for individual entities
**Creation Schemas**: Validation for creating new entities (omitting read-only fields)
**Update Schemas**: Validation for updating existing entities (making fields optional)
**Response Schemas**: Validation for API responses (including computed fields)

### **Static Data Integration**

The feature system integrates with static data following the shared [Static Data Integration](../application-overview/validation-schemas.md#static-data-integration) patterns:

**Enum Validation**: Validates against static data enums for type safety (@EntityType, @EntityAppliesToType, @FeatureBonusType)
**Reference Validation**: Validates foreign key references against existing data
**Range Validation**: Validates numeric ranges against business rules
**Format Validation**: Validates string formats and patterns

## 🎯 **Core Feature Schemas**

### **FeatureSchema**

The base schema for feature validation, defining all required and optional fields with proper validation rules. This schema includes both the core feature definition and progression-specific fields (merged from the previous Feature and FeatureProgression models).

**Purpose**: Validates core feature data including name, description, prerequisites, and progression details (level, source type, source references).

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`slug`**: Required string, 1-100 characters, trimmed, unique identifier
- **`name`**: Required string, 1-100 characters, trimmed for display
- **`description`**: Required string, maximum 10000 characters for detailed descriptions
- **`summary`**: Optional string for summary text (can contain template placeholders)
- **`displayInCharacterSheet`**: Optional boolean for display control (default: true)
- **`sourceType`**: Required integer, references @FeatureSourceType enum (Race, Class, Domain, Feat, Companion, Edition, etc.)
- **`level`**: Required integer, 1-20 range for character level when feature is granted
- **`domainId`**: Optional integer for domain-granted features
- **`featId`**: Optional integer for feat-granted features
- **`companionId`**: Optional integer for companion-granted features
- **`editionId`**: Optional integer for edition-granted features
- **`prerequisites`**: Optional array of prerequisite schemas for requirements

**Usage**: Primary validation for feature data in API requests and responses. This schema now includes all fields that were previously split between Feature and FeatureProgression.

**Source File**: `packages/shared/schema/src/feature.ts` (FeatureSchema definition)

### **FeaturePrerequisiteSchema**

Schema for feature prerequisites, defining requirements that must be met before a feature can be acquired.

**Purpose**: Validates prerequisite data including type, minimum values, and skill requirements.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`featureId`**: Required positive integer linking to the feature
- **`type`**: Required enum value from @FeaturePrerequisiteType
- **`skillId`**: Optional positive integer or null for skill-based prerequisites
- **`minValue`**: Required integer for minimum required value

**Prerequisite Types** (see [Static Data](static-data.md) for complete enum):
- **SkillRanks**: Minimum ranks in a specific skill
- **AbilityScore**: Minimum ability score requirement
- **CharacterLevel**: Minimum character level
- **ClassLevel**: Minimum class level
- **BaseAttackBonus**: Minimum base attack bonus
- **Other**: Custom prerequisite types

**Usage**: Validates prerequisite data for feature requirements and character progression.

**Source File**: `packages/shared/schema/src/feature.ts` (FeaturePrerequisiteSchema definition)

## 🔧 **Feature Progression Schemas**

### **FeatureProgressionSchema** (Alias for FeatureWithRelationsSchema)

The main schema for feature validation with relations, used for bulk operations and complex feature definitions. This schema includes the feature definition along with related entities, classes, races, and other relationships.

**Purpose**: Validates feature data including source tracking, level requirements, and associated entities. This schema is used when features are returned with their full relationship data.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`slug`**: Required string, 1-100 characters, trimmed, unique identifier
- **`name`**: Required string, 1-100 characters, trimmed for display
- **`description`**: Required string, maximum 10000 characters for detailed descriptions
- **`summary`**: Optional string for summary text
- **`displayInCharacterSheet`**: Optional boolean for display control (default: true)
- **`sourceType`**: Required integer, references @FeatureSourceType enum
- **`level`**: Required integer, 1-20 range for character level
- **`domainId`**: Optional integer for domain-granted features
- **`featId`**: Optional integer for feat-granted features
- **`companionId`**: Optional integer for companion-granted features
- **`editionId`**: Optional integer for edition-granted features
- **`classes`**: Optional array of class mappings via `FeatureClassMap` (for shared features)
- **`races`**: Optional array of race mappings via `FeatureRaceMap` (for shared features)
- **`entities`**: Optional array of feature entity schemas (unified approach)
- **`spellcasting`**: Optional spellcasting link schema

**Note**: `FeatureProgressionSchema` is maintained as a backward-compatibility alias for `FeatureWithRelationsSchema`. The schema now represents the unified Feature model with all progression fields included directly.

**Usage**: Primary validation for feature data with relations in complex operations and API responses.

**Source File**: `packages/shared/schema/src/feature.ts` (FeatureProgressionSchema definition, alias for FeatureWithRelationsSchema)

### **CreateFeatureProgressionSchema**

Schema for creating new feature progressions, omitting read-only fields and including nested creation schemas.

**Purpose**: Validates data for creating new feature progressions without requiring existing IDs or computed fields.

**Key Differences from Base Schema**:
- **Omits**: `id`, `feature`, `class`, `spellcasting` (read-only or computed)
- **Includes**: Nested creation schemas for entities (unified approach)
- **Validation**: Ensures proper source type and level constraints

**Usage**: Validates feature progression creation requests in API endpoints.

**Source File**: `packages/shared/schema/src/feature.ts` (CreateFeatureProgressionSchema definition)

### **CreateFeatureProgressionFormSchema**

Schema for creating feature progressions in frontend forms, allowing featureId to be 0 for new features.

**Purpose**: Validates data for frontend form submissions where new features can be created alongside progressions.

**Key Characteristics**:
- **Flexible Feature ID**: Allows `featureId` to be 0 for new features
- **Form Integration**: Designed for frontend form validation
- **Creation Support**: Supports creating both features and progressions in one operation

**Usage**: Validates feature progression form submissions in frontend applications.

**Source File**: `packages/shared/schema/src/feature.ts` (CreateFeatureProgressionFormSchema definition)

## 🔧 **Unified Entity Schemas**

### **FeatureEntitySchema**

The unified schema that handles all types of feature effects including modifiers, choices, and special effects through a single, flexible structure.

**Purpose**: Validates all feature effects using a unified approach, whether they are numerical bonuses, player choices, or special abilities.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`featureId`**: Required positive integer linking to the feature
- **`type`**: Required enum value from @EntityType (Bonus, Quantity, Replacement, Other, Choice, Allocation). Note: Proficiencies use EntityType.Other (3) with appliesTo = EntityAppliesToType.Proficiency (36)
- **`appliesTo`**: Required enum value from @EntityAppliesToType for target specification
- **`appliesToId`**: Optional positive integer for specific target ID (references other system IDs)
- **`appliesToSubId`**: Optional positive integer for sub-target ID
- **`value`**: Optional integer for numerical value (if applicable)
- **`bonusType`**: Optional enum value from @FeatureBonusType for stacking rules
- **`formulaParamsId`**: Optional positive integer linking to formula parameters
- **`groupingId`**: Optional integer for grouping related entities (default: 0)
- **`displayInDetail`**: Optional boolean for display control (default: true)
- **`showFullProgression`**: Optional boolean; when true, progression previews show every level from formula start to 20 (default: false)
- **`filterType`**: Optional integer for choice filtering
- **`conditions`**: Optional array of condition schemas
- **`formulaParams`**: Optional nested formula parameters schema
- **`item`**: Optional nested item schema (when appliesTo === Item)
- **`feat`**: Optional nested feat schema (when appliesTo === Feat)
- **`feature`**: Optional nested feature schema (when appliesTo === Feature)

**Entity Type Usage Patterns**:

#### **@EntityType.Bonus (0) - Numeric Bonuses**
**Purpose**: Numerical bonuses and penalties that follow stacking rules
**Real Examples**: 
- Bardic Knowledge skill bonus (level + Intelligence modifier)
- Druid Nature Sense (+2 to Knowledge (nature) and Survival checks)
- Druid Resist Nature's Lure (+4 to saves against fey spell-like abilities)
**Usage**: `type: 0, appliesTo: 1 (Skill), appliesToId: skill ID, value: bonus amount`

#### **@EntityType.Quantity (1) - Countable Resources**
**Purpose**: Counts, amounts, and resources that represent discrete values
**Real Examples**:
- Bardic Music uses per day (scales with level)
- Druid Wild Shape uses per day (complex threshold progression)
**Usage**: `type: 1, appliesTo: 10 (Uses), appliesToId: use type ID, formulaParams: scaling formula`

#### **@EntityType.Other (3) - Non-Numeric Features**
**Purpose**: Special cases and complex effects that require custom handling
**Real Examples**:
- Weapon and armor proficiencies (appliesTo: Proficiency (36), appliesToId: PROFICIENCY_TYPE_ENUM value)
- Class skills (appliesTo: Skill (1), appliesToId: skill ID)
- Direct feat grants (appliesTo: Feat (21), appliesToId: feat ID)
- Druid Bonus Languages (Sylvan language access) (appliesTo: Language (14), appliesToId: language ID)
- Druid Druidic language grants (appliesTo: AutomaticLanguage (15), appliesToId: language ID)
**Usage**: `type: 3, appliesTo: target type, appliesToId: target ID`
**Proficiency Usage**: `type: 3, appliesTo: 36 (Proficiency), appliesToId: proficiency type ID (1-8), appliesToSubId: item ID or -1 for "all"`

#### **@EntityType.Choice (5) - Player Choices**
**Purpose**: Player choice mechanics between different options
**Real Examples**: Feat choices, feature choices, creature type choices
**Usage**: `type: 5, appliesTo: 21 (Feat), appliesToId: feat ID, groupingId: choice group`

#### **@EntityType.Allocation (6) - Resource Allocation**
**Purpose**: Resource allocation mechanics for point-based systems
**Real Examples**: Skill point distributions, feat point allocations
**Usage**: `type: 6, appliesTo: allocation target, appliesToId: target ID`

**AppliesTo Cross-System Integration**:

#### **Skill System Integration**
- **@EntityAppliesToType.Skill (1)**: `appliesToId` references skill IDs from skill system
- **Real Example**: Bardic Knowledge (appliesToId: 49), Druid Nature Sense (appliesToId: 25, 41)
- **Usage**: `appliesTo: 1, appliesToId: skill ID from skill system`

#### **Uses System Integration**
- **@EntityAppliesToType.Uses (10)**: `appliesToId` references use types for uses/day patterns
- **Real Example**: Bardic Music uses (appliesToId: 1), Druid Wild Shape uses (appliesToId: 1)
- **Usage**: `appliesTo: 10, appliesToId: use type ID, formulaParams: scaling formula`

#### **Language System Integration**
- **@EntityAppliesToType.Language (14)**: `appliesToId` references language IDs from language system
- **Real Example**: Druid Bonus Languages (appliesToId: 18 = Sylvan)
- **Usage**: `appliesTo: 14, appliesToId: language ID from language system`

#### **Special Language System Integration**
- **@EntityAppliesToType.Language (15)**: `appliesToId` references special language IDs
- **Real Example**: Druid Druidic language (appliesToId: 7 = Druidic)
- **Usage**: `appliesTo: 15, appliesToId: special language ID`

#### **Advanced Language System Integration**
- **@EntityAppliesToType.Language (22)**: `appliesToId` references advanced language features
- **Real Example**: Druid advanced Druidic features (appliesToId: 7 = Druidic)
- **Usage**: `appliesTo: 22, appliesToId: advanced language feature ID`

#### **Other System Integrations**
- **@EntityAppliesToType.SavingThrow (2)**: `appliesToId` references saving throw types (@SavingThrowId enum)
- **@EntityAppliesToType.Ability (0)**: `appliesToId` references ability types (@AbilityId enum)
- **@EntityAppliesToType.Feat (21)**: `appliesToId` references feat IDs from feat system
- **@EntityAppliesToType.Proficiency (36)**: `appliesToId` references PROFICIENCY_TYPE_ENUM values (1-8: SimpleWeapon, MartialWeapon, ExoticWeapon, LightArmor, MediumArmor, HeavyArmor, Shield, TowerShield)

**Usage**: The unified approach allows a single feature to have multiple effects of different types, all managed through one consistent schema. This eliminates the need for separate modifier, choice, and special effect schemas while providing the same functionality.

**Real-World Examples**:

#### **Bard's "Bardic Music" Feature**
Demonstrates the unified entity approach with multiple entities:
- **Quantity Entity**: Uses per day scaling with @FormulaId.LINEAR_SCALING (type: 1, appliesTo: 10, appliesToId: 1)
- **Bonus Entity**: Skill bonus with @FormulaId.LEVEL_PLUS_ABILITY for Bardic Knowledge (type: 0, appliesTo: 1, appliesToId: 49)
- **Other Entities**: Class skills and weapon proficiencies (type: 3, appliesTo: 1, appliesToId: skill IDs)

#### **Druid's "Wild Shape" Feature**
Demonstrates complex threshold progression and uses/day patterns:
- **Quantity Entity**: Uses per day with @FormulaId.THRESHOLD_BASED complex progression (type: 1, appliesTo: 10, appliesToId: 1)
- **Threshold Pattern**: [5,6,7,10,14,18] → [1,2,3,4,5,6] uses per day
- **Formula Parameters**: `thresholds: [5, 6, 7, 10, 14, 18], values: [1, 2, 3, 4, 5, 6]`

#### **Druid's "Nature Sense" Feature**
Demonstrates multiple bonus entities with grouping:
- **Bonus Entities**: +2 to Knowledge (nature) and Survival checks (type: 0, appliesTo: 1, appliesToId: 25, 41)
- **Grouping**: Both entities use `groupingId: 1` to group related bonuses
- **Fixed Values**: No formula parameters needed for static bonuses

#### **Druid's "Bonus Languages" Feature**
Demonstrates language system integration:
- **Language Entity**: Sylvan language access (type: 3, appliesTo: 14, appliesToId: 18)
- **Special Language Entity**: Druidic language grant (type: 3, appliesTo: 15, appliesToId: 7)
- **Cross-System Integration**: References language system IDs for proper integration

**Source File**: `packages/shared/schema/src/feature.ts` (FeatureEntitySchema definition)

### **CreateFeatureEntitySchema**

Schema for creating new feature entities, omitting read-only fields and including nested creation schemas.

**Purpose**: Validates data for creating new feature entities without requiring existing IDs or computed fields.

**Key Differences from Base Schema**:
- **Omits**: `id`, `featureId`, `conditions`, `formulaParams`, `formulaParamsId`, `item`
- **Includes**: Nested creation schemas for conditions and formula parameters
- **Validation**: Ensures proper entity type and appliesTo constraints

**Usage**: Validates feature entity creation requests in API endpoints.

**Source File**: `packages/shared/schema/src/feature.ts` (CreateFeatureEntitySchema definition)

### **FeatureEntityConditionSchema**

Schema for feature entity conditions, defining when entities apply.

**Purpose**: Validates condition data for conditional entity application.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`featureEntityId`**: Required positive integer linking to the feature entity
- **`conditionType`**: Required enum value from @FeatureEntityConditionType
- **`conditionValue`**: Required integer for condition value

**Usage**: Validates condition data for conditional entity application.

**Source File**: `packages/shared/schema/src/feature.ts` (FeatureEntityConditionSchema definition)

### **CreateFeatureEntityConditionSchema**

Schema for creating new feature entity conditions, omitting read-only fields.

**Purpose**: Validates data for creating new feature entity conditions without requiring existing IDs.

**Key Differences from Base Schema**:
- **Omits**: `id`, `featureEntityId` (read-only fields)
- **Validation**: Ensures proper condition type and value constraints

**Usage**: Validates feature entity condition creation requests in API endpoints.

**Source File**: `packages/shared/schema/src/feature.ts` (CreateFeatureEntityConditionSchema definition)

### **FeatureConditionSchema**

Schema for feature conditions (display conditions), defining when features should be displayed.

**Purpose**: Validates condition data for conditional feature display.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`featureId`**: Required positive integer linking to the feature
- **`conditionType`**: Required enum value from @FeatureEntityConditionType (reuses the same enum as FeatureEntityCondition)
- **`conditionValue`**: Required integer for condition value

**Usage**: Validates condition data for conditional feature display.

**Source File**: `packages/shared/schema/src/feature.ts` (FeatureConditionSchema definition)

### **CreateFeatureConditionSchema**

Schema for creating new feature conditions (display conditions), omitting read-only fields.

**Purpose**: Validates data for creating new feature conditions without requiring existing IDs.

**Key Differences from Base Schema**:
- **Omits**: `id`, `featureId` (read-only fields)
- **Validation**: Ensures proper condition type and value constraints

**Usage**: Validates feature condition creation requests in API endpoints.

**Source File**: `packages/shared/schema/src/feature.ts` (CreateFeatureConditionSchema definition)

### **FeatureFormulaParamsSchema**

Schema for formula parameters, defining mathematical progression calculations.

**Purpose**: Validates formula parameter data for dynamic feature calculations.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`formulaId`**: Required positive integer linking to formula definition (@FormulaId enum)
- **`interval`**: Optional positive integer for calculation intervals (used with @FormulaId.EVERY_N_LEVELS)
- **`formulaStartLevel`**: Optional positive integer for delayed progression start level
- **`abilityId`**: Optional positive integer for ability-based formulas (@AbilityId enum)
- **`thresholds`**: Optional array of integers for level thresholds (@FormulaId.CONDITIONAL_SCALING)
- **`values`**: Optional array of strings/numbers for threshold values
- **`valuesRepresent`**: Optional enum value from @ConditionalScalingValueType
- **`cumulative`**: Optional boolean for value accumulation (default: false)
- **`includeProgressionLevel`**: Optional boolean for progression level inclusion (default: true)
- **`featureLevelZero`**: Optional boolean that returns 0 for levels below formulaStartLevel instead of null or scalingValue (default: false)
- **`divisor`**: Optional positive integer for division-based formulas (e.g., floor(level / divisor))
- **`baseValue`**: Optional integer for base value in division-based formulas (e.g., floor(level / divisor) + baseValue)
- **`startingValue`**: Optional integer for starting value in formulas that need a different starting value than the increment (e.g., @FormulaId.EVERY_N_LEVELS). Defaults to entity.value if not set.
- **`maxValue`**: Optional integer cap for formulas that have an upper bound. Unused by spell-table `CONDITIONAL_SCALING` columns.

**Formula Types and Usage Patterns**:

#### **@FormulaId.LINEAR_SCALING (1) - Linear Progression**
**Purpose**: Features that scale linearly with level since the feature started
**Parameters**: `interval` (usually 1), `includeProgressionLevel: true`
**Real Example**: Bardic Music uses per day (1 use at 1st level, +1 per level)
**Usage**: `formulaId: 1, interval: 1, includeProgressionLevel: true`

#### **@FormulaId.EVERY_N_LEVELS (2) - Interval-Based Progression**
**Purpose**: Features that improve at regular level intervals
**Parameters**: `interval` (e.g., 3 for every 3 levels), `formulaStartLevel` (optional for delayed progressions), `startingValue` (optional starting value, defaults to entity.value)
**Real Example**: Bardic Music abilities improving every 3 levels, Druid features improving every 2 levels
**Usage**: `formulaId: 2, interval: 3, includeProgressionLevel: true`
**Advanced Usage**: Use `startingValue` to create progressions like "start at 2 and then add 1 every 2 levels": `formulaId: 2, interval: 2, startingValue: 2` with `entity.value: 1`

#### **@FormulaId.THRESHOLD_BASED (3) - Complex Threshold Progression**
**Purpose**: Features with non-linear progression at specific level milestones
**Parameters**: `thresholds` array, `values` array, `valuesRepresent` (optional for AppliesToId lookups)
**Real Example**: Druid Wild Shape uses per day with complex progression [5,6,7,10,14,18] → [1,2,3,4,5,6]
**Usage**: `formulaId: 3, thresholds: [5, 6, 7, 10, 14, 18], values: [1, 2, 3, 4, 5, 6]`

#### **@FormulaId.LEVEL_PLUS_ABILITY (11) - Ability-Based Scaling**
**Purpose**: Features that scale with level plus ability modifier
**Parameters**: `abilityId` (ability score), `includeProgressionLevel: true`
**Real Example**: Druid Wild Empathy bonus = druid level + Charisma modifier, Bardic Knowledge bonus
**Usage**: `formulaId: 11, abilityId: 6, includeProgressionLevel: true`

#### **Other Formula Types**:
- **@FormulaId.ABILITY_BASED (6)**: Base value + ability modifier
- **@FormulaId.ABILITY_MODIFIER (7)**: Just ability modifier
- **@FormulaId.LEVEL_TIMES_ABILITY (8)**: Level × ability modifier
- **@FormulaId.LEVEL_TIMES_VALUE (9)**: Total level × base value
- **@FormulaId.VALUE_PLUS_LEVEL (10)**: Fixed value + level

**Complex Threshold Patterns**:
- **Non-linear Progressions**: Use different threshold intervals (e.g., [5, 6, 7, 10, 14, 18])
- **ValuesRepresent Parameter**: When `valuesRepresent: 1`, values are treated as AppliesToId lookups
- **Cumulative Values**: When `cumulative: true`, values accumulate rather than replace

**Delayed Progression Patterns**:
- **Formula Start Level**: Use `formulaStartLevel` to delay feature progression
- **Example**: Feature starts at 8th level but scales from that point
- **Usage**: `formulaStartLevel: 8, includeProgressionLevel: true`
- **Feature Level Zero**: Use `featureLevelZero: true` to return 0 for levels below formulaStartLevel
- **Example**: Feature at level 1, formulaStartLevel: 2, featureLevelZero: true → L1: 0, L2: 1, L4: 2
- **Usage**: `formulaStartLevel: 2, featureLevelZero: true, includeProgressionLevel: false`

**Usage**: Validates formula parameter data for dynamic feature calculations.

**Source File**: `packages/shared/schema/src/feature.ts` (FeatureFormulaParamsSchema definition)

### **CreateFeatureFormulaParamsSchema**

Schema for creating new formula parameters when creating or saving feature entities. Used for both API create requests and draft-to-create payloads.

**Purpose**: Validates formula parameter data for new feature entities without requiring existing IDs or formula-specific fields that are optional in the database.

**Required vs optional**:
- **Required**: Only `formulaId` is required.
- **Not required**: `id` is not present (create payloads omit it). `thresholds` and `values` are optional and nullable; they are optional in the database and unused by many formula types (e.g. EVERY_N_LEVELS). All other fields (interval, formulaStartLevel, abilityId, baseValue, startingValue, maxValue, divisor, includeProgressionLevel, featureLevelZero, valuesRepresent, cumulative) are optional or optional+nullable.

**Key differences from base schema**:
- No `id` field (create-only).
- `thresholds` and `values` are `.nullable().optional()` so minimal payloads (e.g. `{ formulaId: 2, formulaStartLevel: 3 }`) are valid.

**Usage**: Validates formula params in `CreateFeatureEntitySchema` when creating features or when saving feature drafts to the database.

**Source File**: `packages/shared/schema/src/feature.ts` (CreateFeatureFormulaParamsSchema definition)

## 📋 **Creation and Update Schemas**

### **CreateFeatureSchema**

Schema for creating new features, omitting read-only fields.

**Purpose**: Validates feature creation data without requiring existing IDs.

**Key Characteristics**:
- **Omits**: `id` (auto-generated)
- **Includes**: All required fields for feature creation
- **Validation**: Ensures proper field constraints and relationships

**Usage**: Validates feature creation requests in API endpoints.

**Source File**: `packages/shared/schema/src/feature.ts` (CreateFeatureSchema definition)

### **UpdateFeatureSchema**

Schema for updating existing features, making fields optional.

**Purpose**: Validates feature update data with flexible field requirements.

**Key Characteristics**:
- **Optional Fields**: All fields except ID are optional for partial updates
- **Validation**: Maintains constraints for provided fields
- **Flexibility**: Allows updating individual fields without full data

**Usage**: Validates feature update requests in API endpoints.

**Source File**: `packages/shared/schema/src/feature.ts` (UpdateFeatureSchema definition)

### **UpdateFeatureProgressionsRequestSchema**

Schema for updating multiple feature progressions in bulk operations.

**Purpose**: Validates bulk feature progression update requests including all related entities.

**Key Characteristics**:
- **Includes**: Array of feature progression creation schemas
- **Validation**: Ensures proper relationships and constraints for all progressions
- **Bulk Operations**: Supports updating multiple progressions in a single request

**Usage**: Validates bulk feature progression update requests.

**Source File**: `packages/shared/schema/src/feature.ts` (UpdateFeatureProgressionsRequestSchema definition)

## 🔗 **Cross-System Integration**

### **Skill System Integration**

The feature system integrates with the skill system through the unified entity approach:

**Skill Reference Validation**: `appliesToId` references skill IDs from the skill system (e.g., 49 = Bardic Knowledge)
**Class Skills**: @EntityType.Other with @EntityAppliesToType.Skill for granting class skill access
**Skill Bonuses**: @EntityType.Bonus with @EntityAppliesToType.Skill for skill bonuses
**Cross-Reference Validation**: Ensures valid skill IDs in `appliesToId` fields

### **Ability System Integration**

The feature system integrates with the ability system through formula parameters:

**Ability Reference Validation**: `abilityId` references ability IDs from the ability system (@AbilityId enum)
**Ability-Based Formulas**: @FormulaId.ABILITY_BASED, @FormulaId.ABILITY_MODIFIER, @FormulaId.LEVEL_PLUS_ABILITY
**Cross-Reference Validation**: Ensures valid ability IDs in formula parameters

### **Use System Integration**

The feature system integrates with the use system through the unified entity approach:

**Use Reference Validation**: `appliesToId` references use types within the uses system (e.g., 1 = Bardic Music uses)
**Resource Tracking**: @EntityType.Quantity with @EntityAppliesToType.Uses for tracking uses per day
**Cross-Reference Validation**: Ensures valid use types in `appliesToId` fields

### **Spellcasting Integration**

The feature system integrates with the spellcasting system through validation schemas:

**SpellcastingLinkSchema**: Validates spellcasting links in feature progressions
**SpellcastingProgressionSchema**: Validates spellcasting progression data
**Integration Validation**: Ensures proper spellcasting integration constraints

### **Feat System Integration**

The feature system integrates with the feat system through the unified entity approach:

**FeatSchema**: Validates feat data in feature entities (when appliesTo === Feat)
**FeatReferenceValidation**: Ensures valid feat references in feature entities
**FeatTypeValidation**: Validates feat types and categories through entity relationships

### **Item System Integration**

The feature system integrates with the item system through the unified entity approach:

**ItemSchema**: Validates item data in feature entities (when appliesTo === Item)
**ItemReferenceValidation**: Ensures valid item references in feature entities
**ItemTypeValidation**: Validates item types and categories through entity relationships

### **Feature System Self-Integration**

The feature system supports self-referential relationships through the unified entity approach:

**FeatureSchema**: Validates feature data in feature entities (when appliesTo === Feature)
**FeatureReferenceValidation**: Ensures valid feature references in feature entities
**FeatureTypeValidation**: Validates feature types and categories through entity relationships

## 📊 **Error Handling**

The feature system follows the shared [Error Handling Patterns](../application-overview/validation-schemas.md#error-handling) with feature-specific error scenarios:

**Validation Errors**: Detailed field-specific error messages for all entity types
**Business Logic Errors**: Feature-specific business rule violations including entity type constraints
**Cross-System Errors**: Integration errors with related systems (spellcasting, feats, items)
**Type Safety Errors**: TypeScript type safety violations for unified entity approach
**Entity Validation Errors**: Specific validation errors for entity type and appliesTo combinations

### **Cross-System Validation Errors**

#### **Skill System Integration Errors**
**Invalid Skill ID**: When `appliesToId` references non-existent skill IDs
**Example**: `appliesToId: 999` when skill system only has IDs 1-49
**Error Message**: "Invalid skill ID: 999. Valid skill IDs range from 1-49."

#### **Ability System Integration Errors**
**Invalid Ability ID**: When `abilityId` references non-existent ability IDs
**Example**: `abilityId: 7` when ability system only has IDs 1-6
**Error Message**: "Invalid ability ID: 7. Valid ability IDs are: 1=Strength, 2=Dexterity, 3=Constitution, 4=Intelligence, 5=Wisdom, 6=Charisma."

#### **Use System Integration Errors**
**Invalid Use Type**: When `appliesToId` references non-existent use types
**Example**: `appliesToId: 5` when uses system only has types 1-3
**Error Message**: "Invalid use type: 5. Valid use types range from 1-3."

### **Formula Validation Errors**

#### **Formula Parameter Validation**
**Missing Required Parameters**: When formula requires parameters that aren't provided
**Example**: @FormulaId.LEVEL_PLUS_ABILITY without `abilityId`
**Error Message**: "Formula LEVEL_PLUS_ABILITY requires abilityId parameter."

**Invalid Parameter Values**: When formula parameters have invalid values
**Example**: `interval: 0` for @FormulaId.EVERY_N_LEVELS
**Error Message**: "Interval must be a positive integer for EVERY_N_LEVELS formula."

#### **Formula Calculation Errors**
**Character Context Missing**: When character-dependent formulas lack character context
**Example**: @FormulaId.ABILITY_BASED without character ability scores
**Error Message**: "Character context required for ability-based formula calculations."

### **Entity Type Validation Errors**

#### **Type Compatibility Errors**
**Invalid Type-AppliesTo Combination**: When entity type is incompatible with appliesTo type
**Example**: @EntityType.Bonus with @EntityAppliesToType.Other
**Error Message**: "Entity type Bonus is not compatible with appliesTo type Other."

#### **Required Field Validation**
**Missing Required Fields**: When required fields are missing for specific entity types
**Example**: @EntityType.Choice without `appliesToId`
**Error Message**: "Choice entities require appliesToId to specify choice options."

### **Cross-Reference Validation**

#### **Foreign Key Validation**
**Invalid Feature ID**: When `featureId` references non-existent feature
**Example**: `featureId: 99999` when feature doesn't exist
**Error Message**: "Feature with ID 99999 does not exist."

**Invalid Formula Params ID**: When `formulaParamsId` references non-existent formula parameters
**Example**: `formulaParamsId: 99999` when formula parameters don't exist
**Error Message**: "Formula parameters with ID 99999 do not exist."

### **Business Logic Validation**

#### **Level Range Validation**
**Invalid Level Range**: When level is outside valid range (1-20)
**Example**: `level: 25` for feature progression
**Error Message**: "Level must be between 1 and 20."

#### **Feature Logic Validation**
**Invalid Feature Order**: When features don't follow logical level order
**Example**: Level 5 feature before Level 1 feature for the same source
**Error Message**: "Features should be in ascending level order for consistent progression."

### **Data Integrity Validation**

#### **Circular Reference Detection**
**Self-Referencing Features**: When features reference themselves
**Example**: Feature A references Feature A in appliesToId
**Error Message**: "Circular reference detected: Feature cannot reference itself."

#### **Orphaned Entity Detection**
**Entities Without Features**: When entities exist without valid features
**Example**: Entity with `featureId: null` or invalid featureId
**Error Message**: "Feature entities must be associated with valid features."

### **Performance Validation**

#### **Large Dataset Validation**
**Excessive Entity Count**: When features have too many entities
**Example**: Feature with 100+ entities
**Error Message**: "Feature has excessive number of entities (100+). Consider splitting into multiple features."

#### **Complex Formula Validation**
**Nested Formula Dependencies**: When formulas create complex dependency chains
**Example**: Formula A depends on Formula B which depends on Formula A
**Error Message**: "Circular formula dependency detected."

### **Error Recovery and Handling**

#### **Graceful Degradation**
**Partial Validation Failure**: When some entities fail validation but others pass
**Example**: 5 out of 10 entities fail validation
**Error Message**: "Partial validation failure: 5 entities failed validation. Valid entities will be processed."

#### **Validation Rollback**
**Transaction Rollback**: When validation fails after partial processing
**Example**: Database transaction fails after some entities are created
**Error Message**: "Validation failed. Rolling back all changes to maintain data integrity."

### **User-Friendly Error Messages**

#### **Contextual Error Messages**
**Feature-Specific Context**: Error messages include feature context
**Example**: "Bardic Music feature: Invalid skill ID 999 for Bardic Knowledge bonus."

#### **Actionable Error Messages**
**Clear Resolution Steps**: Error messages provide clear steps to resolve issues
**Example**: "Invalid ability ID 7. Use one of: 1=Strength, 2=Dexterity, 3=Constitution, 4=Intelligence, 5=Wisdom, 6=Charisma."

#### **Validation Summary**
**Batch Validation Results**: Summary of all validation errors in batch operations
**Example**: "Validation completed: 3 errors found in 15 entities. See detailed error messages below."

## 🔧 **Performance Considerations**

The feature system implements validation performance optimizations following the shared [Performance Optimization](../application-overview/performance-optimization.md) patterns:

**Efficient Validation**: Optimized validation logic for unified entity schemas
**Caching**: Appropriate caching for validation results and entity type lookups
**Lazy Validation**: Lazy validation for large datasets with complex entity relationships
**Batch Validation**: Batch validation for bulk operations with multiple entities
**Entity Type Optimization**: Efficient validation based on entity type and appliesTo combinations

### **Formula Calculation Performance**

#### **Character-Dependent Formula Optimization**
**Context Caching**: Character ability scores and modifiers are cached during formula calculations
**Example**: @FormulaId.ABILITY_BASED formulas cache ability modifiers to avoid repeated calculations
**Performance Impact**: Reduces calculation time for features with multiple ability-dependent entities

#### **Formula Parameter Caching**
**Parameter Validation Caching**: Formula parameters are validated once and cached for reuse
**Example**: @FormulaId.EVERY_N_LEVELS parameters are cached to avoid repeated validation
**Performance Impact**: Improves performance for features with multiple entities using the same formula

#### **Batch Formula Calculations**
**Parallel Processing**: Multiple formula calculations are processed in parallel when possible
**Example**: All entities for a feature progression are calculated simultaneously
**Performance Impact**: Reduces total calculation time for complex features

### **Cross-System Integration Performance**

#### **Static Data Lookup Optimization**
**Enum Value Caching**: Static data enums are cached in memory for fast lookups
**Example**: @EntityType and @EntityAppliesToType enums are cached for validation
**Performance Impact**: Eliminates database queries for enum validation

#### **Cross-System Reference Caching**
**Reference Validation Caching**: Cross-system references are validated and cached
**Example**: Skill IDs, ability IDs, and use types are cached for fast validation
**Performance Impact**: Reduces validation time for features with many cross-system references

#### **Lazy Loading for Large Datasets**
**Progressive Validation**: Large feature datasets are validated in chunks
**Example**: Features with 100+ entities are validated in batches of 20
**Performance Impact**: Prevents memory issues and improves responsiveness

### **Database Query Optimization**

#### **Efficient Entity Queries**
**Optimized Joins**: Entity queries use optimized joins for related data
**Example**: Feature entities are joined with progressions and formulas in single queries
**Performance Impact**: Reduces database round trips for complex feature data

#### **Indexing Strategy**
**Composite Indexes**: Database indexes are optimized for common query patterns
**Example**: Indexes on (progressionId, type, appliesTo) for entity lookups
**Performance Impact**: Improves query performance for feature entity searches

#### **Query Result Caching**
**Result Set Caching**: Common query results are cached to avoid repeated database access
**Example**: Class feature progressions are cached for character creation
**Performance Impact**: Reduces database load for frequently accessed data

### **Memory Management**

#### **Entity Object Optimization**
**Minimal Object Creation**: Entity objects are created only when needed
**Example**: Formula parameters are created lazily during calculation
**Performance Impact**: Reduces memory usage for large feature datasets

#### **Garbage Collection Optimization**
**Object Pooling**: Frequently used objects are pooled to reduce GC pressure
**Example**: Formula calculation objects are pooled and reused
**Performance Impact**: Reduces garbage collection overhead

### **Testing and Validation Performance**

#### **Unit Test Optimization**
**Fast Test Execution**: Unit tests are optimized for speed
**Example**: Formula tests use minimal test data and mock objects
**Performance Impact**: Enables rapid test feedback during development

#### **Integration Test Performance**
**Efficient Test Data**: Integration tests use optimized test datasets
**Example**: Feature tests use minimal feature progressions with essential entities
**Performance Impact**: Reduces test execution time while maintaining coverage

#### **Performance Testing**
**Load Testing**: Performance tests validate system behavior under load
**Example**: Tests with 1000+ feature entities to validate performance limits
**Performance Impact**: Ensures system performance meets requirements

### **Monitoring and Profiling**

#### **Performance Metrics**
**Key Performance Indicators**: System performance is monitored with specific metrics
**Example**: Formula calculation time, validation time, database query time
**Performance Impact**: Enables proactive performance optimization

#### **Profiling Integration**
**Performance Profiling**: System includes profiling capabilities for performance analysis
**Example**: Formula calculation profiling to identify bottlenecks
**Performance Impact**: Enables targeted performance improvements

## 🧪 **Testing and Validation**

### **Unit Testing**

#### **Formula Testing**
**Formula Calculation Tests**: Each formula type has comprehensive unit tests
**Example**: @FormulaId.LINEAR_SCALING tests validate calculation at different levels
**Test Coverage**: All formula types and edge cases are tested

#### **Entity Validation Tests**
**Entity Type Tests**: Each entity type has validation tests
**Example**: @EntityType.Bonus tests validate bonus calculations and stacking
**Test Coverage**: All entity types and appliesTo combinations are tested

#### **Cross-System Integration Tests**
**System Integration Tests**: Cross-system references are tested
**Example**: Skill ID validation tests ensure proper skill system integration
**Test Coverage**: All cross-system integrations are tested

### **Integration Testing**

#### **Feature Progression Tests**
**End-to-End Tests**: Complete feature progressions are tested
**Example**: Bard class features are tested from level 1 to 20
**Test Coverage**: All class features are tested for correctness

#### **Performance Tests**
**Load Testing**: System performance is tested under load
**Example**: Tests with 1000+ feature entities validate performance
**Test Coverage**: Performance requirements are validated

### **Validation Testing**

#### **Error Handling Tests**
**Error Scenario Tests**: All error scenarios are tested
**Example**: Invalid skill ID tests ensure proper error handling
**Test Coverage**: All error conditions are tested

#### **Edge Case Tests**
**Boundary Condition Tests**: Edge cases and boundary conditions are tested
**Example**: Level 1 and level 20 feature tests validate boundary behavior
**Test Coverage**: All edge cases are tested

### **Test Data Management**

#### **Test Data Sets**
**Comprehensive Test Data**: Test data covers all feature types and scenarios
**Example**: Test data includes Monk, Bard, and other class features
**Test Coverage**: All feature types are represented in test data

#### **Test Data Validation**
**Test Data Integrity**: Test data is validated for correctness
**Example**: Test data is validated against actual class implementations
**Test Coverage**: Test data accuracy is ensured

### **Continuous Integration**

#### **Automated Testing**
**CI/CD Integration**: Tests are run automatically on code changes
**Example**: All tests run on every pull request
**Test Coverage**: Continuous validation of system correctness

#### **Performance Regression Testing**
**Performance Monitoring**: Performance regressions are detected automatically
**Example**: Performance tests run on every build
**Test Coverage**: Performance requirements are continuously validated

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Feature system database models and relationships
- **[Static Data](static-data.md)** - Feature system enums and types
- **[Backend Implementation](backend-implementation.md)** - Feature system backend implementation
- **[Frontend Components](frontend-components.md)** - Feature system frontend implementation
- **[Class Implementation Examples](class-implementation-examples.md)** - Real-world implementation analysis using Monk and Bard classes
- **[Validation Schema Patterns](../application-overview/validation-schemas.md)** - Shared validation patterns and conventions
- **[Performance Optimization](../application-overview/performance-optimization.md)** - Shared performance optimization strategies
