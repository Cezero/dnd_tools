# Character Management Validation Schemas

*Complete documentation for the character management validation schemas, including Zod schemas, type safety, and validation rules.*

## 📋 **Overview**

The character management system uses Zod validation schemas to ensure type safety and data integrity across all API operations. These schemas provide runtime validation, automatic error messages, and TypeScript type generation for the character management system's complex data structures.

The validation layer follows the shared [Validation Schema Patterns](../application-overview/validation-schemas.md) with character-specific validation rules and constraints.

**Source File**: `shared/schema/src/character.ts`

## 🏗️ **Schema Architecture**

The character management validation follows the shared [Layered Validation Architecture](../application-overview/validation-schemas.md#layered-validation-architecture) with character-specific implementations:

**Schema Layer**: Zod schemas for runtime validation and type safety
**Type Layer**: TypeScript types generated from schemas for compile-time safety
**Error Layer**: Comprehensive error handling and user feedback
**Integration Layer**: API integration and frontend form validation

### **Schema Hierarchy Pattern**

The character management system uses the shared [Schema Hierarchy Pattern](../application-overview/validation-schemas.md#schema-hierarchy-pattern) with character-specific variations:

**Base Schemas**: Core validation for individual entities
**Creation Schemas**: Validation for creating new entities (omitting read-only fields)
**Update Schemas**: Validation for updating existing entities (making fields optional)
**Response Schemas**: Validation for API responses (including computed fields)

### **Static Data Integration**

The character management system integrates with static data following the shared [Static Data Integration](../application-overview/validation-schemas.md#static-data-integration) patterns:

**Enum Validation**: Validates against static data enums for type safety
**Reference Validation**: Validates foreign key references against existing data
**Range Validation**: Validates numeric ranges against business rules
**Format Validation**: Validates string formats and patterns

## 🎯 **Core Character Schemas**

### **BaseCharacterSchema**

The base schema for character validation, defining all required and optional fields with proper validation rules.

**Purpose**: Validates core character data including name, race, alignment, and basic attributes.

**Key Validations**:
- **`userId`**: Required positive integer for user ownership
- **`name`**: Required string, 1-100 characters, trimmed for display
- **`raceId`**: Required positive integer for race reference
- **`alignmentId`**: Required positive integer for alignment reference
- **`age`**: Optional integer, 0-1000 for character age
- **`height`**: Optional integer, 1-1000 for character height
- **`weight`**: Optional integer, 1-10000 for character weight
- **`eyes`**: Optional string, maximum 50 characters for eye color
- **`hair`**: Optional string, maximum 50 characters for hair color
- **`gender`**: Optional string, maximum 20 characters for gender
- **`notes`**: Optional string, maximum 1000 characters for character notes

**Usage**: Primary validation for character data in API requests and responses.

**Source File**: `shared/schema/src/character.ts` (BaseCharacterSchema definition)

### **CharacterSchema**

The complete character schema including the ID field for database operations.

**Purpose**: Validates complete character data including the unique identifier.

**Key Validations**:
- **`id`**: Required positive integer for unique identification
- **`xp`**: Required non-negative integer for experience points
- **All Base Fields**: Includes all base character fields with appropriate validation

**Usage**: Complete character validation for database operations and responses.

**Source File**: `shared/schema/src/character.ts` (CharacterSchema definition)

### **CharacterWithRaceSchema**

Schema for character with race information included.

**Purpose**: Validates character responses that include race relationship data.

**Key Validations**:
- **Base Character**: All base character fields with appropriate validation
- **`race`**: Required race object with ID and name validation

**Usage**: Validates character responses with race information.

**Source File**: `shared/schema/src/character.ts` (CharacterWithRaceSchema definition)

### **CharacterIdParamSchema**

Schema for character ID parameter validation in URL paths.

**Purpose**: Validates and transforms character ID parameters from URL strings to integers.

**Key Validations**:
- **`id`**: Required string that transforms to positive integer

**Usage**: Validates character ID parameters in API routes.

**Source File**: `shared/schema/src/character.ts` (CharacterIdParamSchema definition)

## 🔧 **Character Advancement Schemas**

### **CharacterAdvancementSchema**

Schema for character advancement validation.

**Purpose**: Validates character advancement data and properties for level progression.

**Key Validations**:
- **`id`**: Required positive integer for advancement identification
- **`characterId`**: Required positive integer for character reference
- **`level`**: Required integer, 1-100 for character level
- **`version`**: Required positive integer for advancement version
- **`classId`**: Required positive integer for class reference
- **`secondaryClassId`**: Optional positive integer for secondary class reference
- **`hitPoints`**: Required positive integer for hit points gained
- **`abilityId`**: Optional positive integer for ability score improvement
- **`notes`**: Optional string, maximum 1000 characters for advancement notes
- **`createdAt`**: Required date for advancement creation timestamp

**Usage**: Validates character advancement data in API requests and responses.

**Source File**: `shared/schema/src/character.ts` (CharacterAdvancementSchema definition)

### **AdvancementSkillSchema**

Schema for advancement skill validation.

**Purpose**: Validates skill advancement data for character level progression.

**Key Validations**:
- **`advancementId`**: Required positive integer for advancement reference
- **`skillId`**: Required positive integer for skill reference
- **`pointsSpent`**: Required non-negative integer for skill points spent

**Usage**: Validates skill advancement data in character advancement.

**Source File**: `shared/schema/src/character.ts` (AdvancementSkillSchema definition)

### **AdvancementFeatSchema**

Schema for advancement feat validation.

**Purpose**: Validates feat advancement data for character level progression.

**Key Validations**:
- **`advancementId`**: Required positive integer for advancement reference
- **`featId`**: Required positive integer for feat reference

**Usage**: Validates feat advancement data in character advancement.

**Source File**: `shared/schema/src/character.ts` (AdvancementFeatSchema definition)

### **AdvancementSpellSchema**

Schema for advancement spell validation.

**Purpose**: Validates spell advancement data for character level progression.

**Key Validations**:
- **`advancementId`**: Required positive integer for advancement reference
- **`spellId`**: Required positive integer for spell reference

**Usage**: Validates spell advancement data in character advancement.

**Source File**: `shared/schema/src/character.ts` (AdvancementSpellSchema definition)

### **CharacterAdvancementWithDetailsSchema**

Schema for character advancement with all related data.

**Purpose**: Validates character advancement responses that include skills, feats, spells, and feature choices.

**Key Validations**:
- **Base Advancement**: All base advancement fields with appropriate validation
- **`skills`**: Required array of advancement skill schemas
- **`feats`**: Required array of advancement feat schemas
- **`spellsKnown`**: Required array of advancement spell schemas
- **`featureChoices`**: Required array of character feature choice schemas

**Usage**: Validates character advancement responses with complete related data.

**Source File**: `shared/schema/src/character.ts` (CharacterAdvancementWithDetailsSchema definition)

## 🔧 **Character Ability Score Schemas**

### **CharacterAbilityScoreSchema**

Schema for character ability score validation.

**Purpose**: Validates character ability score data and properties.

**Key Validations**:
- **`id`**: Required positive integer for ability score identification
- **`characterId`**: Required positive integer for character reference
- **`abilityId`**: Required positive integer for ability reference
- **`value`**: Required integer, 1-50 for ability score value

**Usage**: Validates character ability score data in API requests and responses.

**Source File**: `shared/schema/src/character.ts` (CharacterAbilityScoreSchema definition)

## 🔧 **Character Spell Preparation Schemas**

### **CharacterSpellPreparationSchema**

Schema for character spell preparation validation.

**Purpose**: Validates character spell preparation data and properties.

**Key Validations**:
- **`characterId`**: Required positive integer for character reference
- **`classId`**: Required positive integer for class reference
- **`spellId`**: Required positive integer for spell reference
- **`spellLevel`**: Required integer, 0-20 for spell level
- **`quantity`**: Required positive integer for spell quantity
- **`slotType`**: Required positive integer for slot type

**Usage**: Validates character spell preparation data in API requests and responses.

**Source File**: `shared/schema/src/character.ts` (CharacterSpellPreparationSchema definition)

### **SpellPreparationMetamagicSchema**

Schema for spell preparation metamagic validation.

**Purpose**: Validates spell preparation metamagic data and properties.

**Key Validations**:
- **`characterId`**: Required positive integer for character reference
- **`prepKey`**: Required string for preparation key
- **`featId`**: Required positive integer for feat reference

**Usage**: Validates spell preparation metamagic data in character spell preparation.

**Source File**: `shared/schema/src/character.ts` (SpellPreparationMetamagicSchema definition)

### **CharacterSpellPreparationWithMetamagicSchema**

Schema for character spell preparation with metamagic.

**Purpose**: Validates character spell preparation responses that include metamagic data.

**Key Validations**:
- **Base Spell Preparation**: All base spell preparation fields with appropriate validation
- **`metamagics`**: Required array of spell preparation metamagic schemas

**Usage**: Validates character spell preparation responses with metamagic data.

**Source File**: `shared/schema/src/character.ts` (CharacterSpellPreparationWithMetamagicSchema definition)

## 🔧 **Character Feature Choice Schemas**

### **CharacterFeatureChoiceSchema**

Schema for character feature choice validation.

**Purpose**: Validates character feature choice data and properties.

**Key Validations**:
- **`id`**: Required positive integer for feature choice identification
- **`characterId`**: Required positive integer for character reference
- **`featureId`**: Required positive integer for feature reference
- **`advancementId`**: Required positive integer for advancement reference
- **`featureEntityId`**: Required positive integer for feature entity reference
- **`appliesToId`**: Required integer for the selected value ID
- **`appliesToSubId`**: Optional integer or null for sub-value ID
- **`choiceIndex`**: Optional integer or null for choice index
- **`choiceGroupId`**: Optional string or null for choice group identifier
- **`choiceData`**: Optional JSON object for complex choice information
- **`linkedChoiceGroupId`**: Optional string or null for linked choice group identifier

**Usage**: Validates character feature choice data in API requests and responses.

**Source File**: `shared/schema/src/character.ts` (CharacterFeatureChoiceSchema definition)

## 🔧 **Character Equipment Schemas**

### **CharacterItemSchema**

Schema for character item validation.

**Purpose**: Validates character item data and properties.

**Key Validations**:
- **`id`**: Required positive integer for character item identification
- **`name`**: Required string, 1-100 characters, trimmed for display
- **`quantity`**: Optional positive integer for item quantity
- **`characterId`**: Required positive integer for character reference
- **`baseItemId`**: Required positive integer for base item reference

**Usage**: Validates character item data in API requests and responses.

**Source File**: `shared/schema/src/character.ts` (CharacterItemSchema definition)

### **CharacterItemPropertySchema**

Schema for character item property validation.

**Purpose**: Validates character item property data and properties.

**Key Validations**:
- **`id`**: Required positive integer for character item property identification
- **`characterItemId`**: Required positive integer for character item reference
- **`propertyId`**: Required positive integer for property reference

**Usage**: Validates character item property data in API requests and responses.

**Source File**: `shared/schema/src/character.ts` (CharacterItemPropertySchema definition)

## 🔧 **Request and Response Schemas**

### **GetAllCharactersResponseSchema**

Schema for the response when retrieving all characters.

**Purpose**: Validates paginated character list responses.

**Key Validations**:
- **`total`**: Required integer for total count
- **`results`**: Required array of character schemas with race relationships
- **Pagination Fields**: Includes standard pagination metadata

**Usage**: Validates responses for character list endpoints.

**Source File**: `shared/schema/src/character.ts` (GetAllCharactersResponseSchema definition)

### **CharacterWithAllDetailsSchema**

Schema for character with all related data.

**Purpose**: Validates character responses that include all relationships and details.

**Key Validations**:
- **Base Character**: All base character fields with appropriate validation
- **`race`**: Required race schema for race information
- **`abilityScores`**: Required array of ability score schemas
- **`advancements`**: Required array of advancement schemas with details
- **`preparedSpells`**: Required array of spell preparation schemas with metamagic

**Usage**: Validates character responses with complete related data.

**Source File**: `shared/schema/src/character.ts` (CharacterWithAllDetailsSchema definition)

### **CreateCharacterSchema**

Schema for creating new characters.

**Purpose**: Validates character creation requests.

**Key Validations**:
- **Base Character**: All base character fields with appropriate validation

**Usage**: Validates character creation requests.

**Source File**: `shared/schema/src/character.ts` (CreateCharacterSchema definition)

### **UpdateCharacterSchema**

Schema for updating existing characters with partial data.

**Purpose**: Validates character update requests with optional fields.

**Key Validations**:
- **Base Fields**: All base character fields made optional for partial updates

**Usage**: Validates character update requests.

**Source File**: `shared/schema/src/character.ts` (UpdateCharacterSchema definition)

## 🔧 **Advancement Request/Response Schemas**

### **CreateAdvancementSchema**

Schema for creating new character advancements.

**Purpose**: Validates character advancement creation requests.

**Key Validations**:
- **`characterId`**: Required positive integer for character reference
- **`level`**: Required integer, 1-100 for character level
- **`classId`**: Required positive integer for class reference
- **`secondaryClassId`**: Optional positive integer for secondary class reference
- **`hitPoints`**: Required positive integer for hit points gained
- **`abilityId`**: Optional positive integer for ability score improvement
- **`notes`**: Optional string, maximum 1000 characters for advancement notes

**Usage**: Validates character advancement creation requests.

**Source File**: `shared/schema/src/character.ts` (CreateAdvancementSchema definition)

### **UpdateAdvancementSchema**

Schema for updating existing character advancements with partial data.

**Purpose**: Validates character advancement update requests with optional fields.

**Key Validations**:
- **Base Fields**: All base advancement fields made optional for partial updates

**Usage**: Validates character advancement update requests.

**Source File**: `shared/schema/src/character.ts` (UpdateAdvancementSchema definition)

## 🔧 **Spell Preparation Request/Response Schemas**

### **CreateSpellPreparationSchema**

Schema for creating new character spell preparations.

**Purpose**: Validates character spell preparation creation requests.

**Key Validations**:
- **`characterId`**: Required positive integer for character reference
- **`classId`**: Required positive integer for class reference
- **`spellId`**: Required positive integer for spell reference
- **`spellLevel`**: Required integer, 0-20 for spell level
- **`quantity`**: Required positive integer for spell quantity
- **`slotType`**: Required positive integer for slot type

**Usage**: Validates character spell preparation creation requests.

**Source File**: `shared/schema/src/character.ts` (CreateSpellPreparationSchema definition)

### **UpdateSpellPreparationSchema**

Schema for updating existing character spell preparations with partial data.

**Purpose**: Validates character spell preparation update requests with optional fields.

**Key Validations**:
- **Base Fields**: All base spell preparation fields made optional for partial updates

**Usage**: Validates character spell preparation update requests.

**Source File**: `shared/schema/src/character.ts` (UpdateSpellPreparationSchema definition)

## 🔧 **Ability Score Request/Response Schemas**

### **CreateCharacterAbilityScoreSchema**

Schema for creating new character ability scores.

**Purpose**: Validates character ability score creation requests.

**Key Validations**:
- **`characterId`**: Required positive integer for character reference
- **`abilityId`**: Required positive integer for ability reference
- **`value`**: Required integer, 1-50 for ability score value

**Usage**: Validates character ability score creation requests.

**Source File**: `shared/schema/src/character.ts` (CreateCharacterAbilityScoreSchema definition)

## 🔗 **Integration Schemas**

### **Class System Integration**

The character management system integrates with the class system through character advancement:

**Class Progression**: Characters advance in classes through the advancement system
**Class Features**: Character feature choices integrate with class feature systems
**Spellcasting**: Character spell preparation integrates with class spellcasting
**Proficiency Management**: Character proficiencies integrate with class proficiency systems

**Integration Pattern**: The character system provides the framework for character class progression, with class features and abilities determining character capabilities.

**Related Documentation**: [Class System Validation Schemas](../class-system/validation-schemas.md)

### **Race System Integration**

The character management system integrates with the race system through character creation:

**Race Selection**: Characters are created with specific races
**Race Features**: Character features integrate with race feature systems
**Ability Modifiers**: Race ability modifiers integrate with character ability scores
**Proficiency Grants**: Race proficiency grants integrate with character proficiencies

**Integration Pattern**: The character system provides the framework for character race integration, with race features and abilities determining character capabilities.

**Related Documentation**: [Race System Validation Schemas](../race-system/validation-schemas.md)

### **Feature System Integration**

The character management system integrates with the feature system through character advancement:

**Feature Progression**: Character feature choices integrate with feature progression systems
**Feature Selection**: Character feature choices integrate with feature choice systems
**Feature Effects**: Character feature effects integrate with feature effect systems

**Integration Pattern**: The character system provides the framework for character feature integration, with feature choices and effects determining character capabilities.

**Related Documentation**: [Feature System Validation Schemas](../feature-system/validation-schemas.md)

### **Spell System Integration**

The character management system integrates with the spell system through character spell preparation:

**Spell Selection**: Character spell preparation integrates with spell selection systems
**Spell Casting**: Character spell casting integrates with spell casting systems
**Metamagic Integration**: Character metamagic integrates with spell metamagic systems

**Integration Pattern**: The character system provides the framework for character spell integration, with spell preparation and casting determining character capabilities.

**Related Documentation**: [Spell System Validation Schemas](../spell-system/validation-schemas.md)

### **Equipment System Integration**

The character management system integrates with the equipment system through character equipment:

**Equipment Selection**: Character equipment integrates with equipment selection systems
**Equipment Usage**: Character equipment usage integrates with equipment usage systems
**Equipment Effects**: Character equipment effects integrate with equipment effect systems

**Integration Pattern**: The character system provides the framework for character equipment integration, with equipment selection and usage determining character capabilities.

**Related Documentation**: [Equipment System Validation Schemas](../equipment-system/validation-schemas.md)

## 📊 **Type Generation**

### **Generated Types**

The validation schemas automatically generate TypeScript types for type safety:

**CharacterIdParamRequest**: Type for character ID parameter requests
**CreateCharacterRequest**: Type for character creation requests
**UpdateCharacterRequest**: Type for character update requests
**GetAllCharactersResponse**: Type for character list responses
**CharacterWithAllDetailsResponse**: Type for complete character data with relationships
**CharacterAdvancementRequest**: Type for character advancement requests
**CharacterSpellPreparationRequest**: Type for character spell preparation requests
**CharacterAbilityScoreRequest**: Type for character ability score requests

**Type Safety Benefits**:
- **Compile-time Validation**: TypeScript catches type errors at compile time
- **IDE Support**: Full IntelliSense and autocomplete support
- **Refactoring Safety**: Safe refactoring with type checking
- **Documentation**: Types serve as living documentation

**Source File**: `shared/schema/src/character.ts` (Type definitions)

## 🔧 **Validation Patterns**

### **String Validation**

**Name Validation**: Character names are required, trimmed, and limited to 100 characters
**Notes Validation**: Character notes are optional and limited to 1000 characters
**Physical Description Validation**: Eye color, hair color, and gender are optional with appropriate length limits

**Validation Benefits**:
- **Data Quality**: Ensures consistent, clean data
- **User Experience**: Provides clear error messages for validation failures
- **Performance**: Prevents overly large strings from affecting performance
- **Display Safety**: Ensures data is safe for display in user interfaces

### **Numeric Validation**

**ID Validation**: All ID fields must be positive integers
**Level Validation**: Character levels must be between 1 and 100
**Ability Score Validation**: Ability scores must be between 1 and 50
**Experience Validation**: Experience points must be non-negative
**Physical Attribute Validation**: Age, height, and weight must be within reasonable ranges

**Validation Benefits**:
- **Data Integrity**: Ensures numeric data is within valid ranges
- **Business Logic**: Enforces game mechanics and business rules
- **Error Prevention**: Prevents invalid data from entering the system
- **Type Safety**: Ensures proper numeric types throughout the system

### **Reference Validation**

**User ID Validation**: User IDs must reference valid users
**Race ID Validation**: Race IDs must reference valid races
**Alignment ID Validation**: Alignment IDs must reference valid alignments
**Class ID Validation**: Class IDs must reference valid classes
**Ability ID Validation**: Ability IDs must reference valid abilities

**Validation Benefits**:
- **Data Consistency**: Ensures all references are valid
- **Referential Integrity**: Maintains proper relationships between entities
- **Error Prevention**: Prevents invalid references from entering the system
- **Type Safety**: Ensures proper reference types throughout the system

## 🔗 **Error Handling**

### **Validation Error Patterns**

The character management system follows the shared [Error Handling Patterns](../application-overview/validation-schemas.md#error-handling) with character-specific error scenarios:

**Field Validation Errors**: Specific error messages for each field validation failure
**Business Rule Errors**: Character-specific business rule violations
**Integration Errors**: Errors from related system validations
**Type Conversion Errors**: Errors from string to number conversions

### **Error Message Standards**

**User-Friendly Messages**: Clear, actionable error messages for users
**Field-Specific Messages**: Specific messages for each validation field
**Context Information**: Include context about what was being validated
**Debug Information**: Additional debug information in development mode

## 📋 **Character Resolution Response Schemas**

The character resolution system includes response schemas for API operations that manage resolution sessions. These schemas validate the structure of responses from the resolution API endpoints.

**Source File**: `packages/shared/schema/src/characterResolution.ts`

### **SaveSessionResponseSchema**

Validates the response when saving a resolution session to the database.

**Purpose**: Ensures the response contains the updated character with all details after the session is persisted.

**Structure**:
- **`character`**: `CharacterWithAllDetailsSchema` - The updated character with all related data (ability scores, advancements, spells, items, etc.)

**Usage**: Used by the `saveSession` API method to validate the response after persisting session state to the character record.

**Type Export**: `SaveSessionResponse` - TypeScript type inferred from this schema

**Related Schemas**:
- `CharacterWithAllDetailsSchema` - Schema for the character data structure

**Source File**: `packages/shared/schema/src/characterResolution.ts`

### **CancelSessionResponseSchema**

Validates the response when cancelling a resolution session.

**Purpose**: Validates the success indicator from the backend and transforms it to void for the frontend API client.

**Structure**:
- **`success`**: `boolean` - Indicates whether the session was successfully cancelled
- **Transform**: Transforms to `void` because the frontend API client expects `Promise<void>` for this operation

**Usage**: Used by the `cancelSession` API method. The transform pattern is used because the backend returns `{ success: boolean }` but the frontend doesn't need this value - the absence of an error indicates success.

**Type Export**: Returns `void` (no type export needed)

**Source File**: `packages/shared/schema/src/characterResolution.ts`

### **GetAvailableFeatsResponseSchema**

Validates the response when fetching available feats for a character.

**Purpose**: Ensures the response contains a properly structured list of available feats with type-safe feat data.

**Structure**:
- **`results`**: `FeatInQueryResponse[]` - Array of available feats, each validated using `FeatInQueryResponseSchema`
- **`total`**: `number` (non-negative integer) - Total count of available feats

**Usage**: Used by the `getAvailableFeats` API method to validate the response containing feats filtered by prerequisites, proficiencies, and character-specific requirements.

**Type Export**: `GetAvailableFeatsResponse` - TypeScript type inferred from this schema

**Related Schemas**:
- `FeatInQueryResponseSchema` - Schema for individual feat items in the results array

**Source File**: `packages/shared/schema/src/characterResolution.ts`

**Related Documentation**: [Character Resolution System](./character-resolution-system.md) for complete API endpoint documentation

## 🖥️ **Frontend Type Integration**

The character management system provides types that are designed for direct use in frontend code. This section documents the type reuse pattern and when to create frontend-specific types.

### **Shared Types for Frontend Use**

The following types from `@shared/schema` are designed for direct use in frontend code:

| Type | Source File | Frontend Usage |
|------|-------------|----------------|
| `PendingChoice` | characterResolution.ts | Choice resolution UI, displaying pending feature choices |
| `PendingChoiceOption` | characterResolution.ts | Individual choice options in selection dialogs |
| `SkillBonus` | characterResolution.ts | Skill bonus tracking and display |
| `ClassSkill` | characterResolution.ts | Class skill identification for skill point allocation |
| `CharacterFeatureChoice` | character.ts | Saved feature choice data |
| `CharacterAbilityScoreResponse` | character.ts | Ability score display and editing |
| `CharacterDisallowedSource` | character.ts | Source book restriction management |
| `FeatureProgression` | feature.ts | Feature progression display and resolution |
| `FeatureEntity` | feature.ts | Feature entity details and effects |

**Import Pattern**:
```typescript
import type { 
    PendingChoice, 
    PendingChoiceOption, 
    SkillBonus,
    CharacterFeatureChoice 
} from '@shared/schema';
```

### **Frontend-Specific Types**

Some types remain frontend-specific due to different requirements between UI state and database persistence. These types are defined in `apps/frontend/src/features/character/types.ts`.

**Reasons for Frontend-Specific Types**:

- **UI State Management**: Types like `SkillRank` track in-memory state during editing before persistence. They differ from database schemas (e.g., `AdvancementSkill`) which include foreign keys like `advancementId`.

- **Different Semantics**: Types like `FeatureProgressionSourceType` serve different purposes than similar shared types. The frontend enum includes `SecondaryClass` for gestalt character UI pooling, which doesn't exist in the database `FeatureSourceType`.

- **React Integration**: Component props (`TabComponentProps`, `ChoicePresentationProps`) and hook return types (`FeatureResolutionReturn`) are inherently frontend-specific.

- **UI-Only State**: Types like `Money`, `EquipmentItem`, and tab state types (`AbilityTabState`, `ClassTabState`, etc.) manage UI state that doesn't directly map to a single database entity.

### **Type Relationship Examples**

**SkillRank vs AdvancementSkill**:
```typescript
// Frontend type (UI state during editing)
interface SkillRank {
    skillId: number;
    skillSubId: number | null;
    customSubtype: string | null;
    pointsSpent: number;
}

// Shared type (database persistence)
// AdvancementSkillSchema includes advancementId for database FK
```

**FeatureProgressionSourceType vs FeatureSourceType**:
```typescript
// Frontend enum (UI pooling with SecondaryClass support)
enum FeatureProgressionSourceType {
    Race = 1,
    Class = 2,
    SecondaryClass = 3,  // Frontend-only for gestalt UI
    Feat = 4,
    // ...
}

// Shared enum (database source types)
// FeatureSourceType in @shared/static-data has different values
// and doesn't include SecondaryClass
```

### **Best Practices**

1. **Prefer Shared Types**: Always check if a type exists in `@shared/schema` before creating a frontend-specific type.

2. **Document Relationships**: When creating frontend-specific types that relate to shared types, add JSDoc comments explaining the relationship.

3. **Use Type Aliases**: For backward compatibility, use type aliases when renaming types:
   ```typescript
   /** @deprecated Use PendingChoiceOption from @shared/schema */
   export type ChoiceOption = PendingChoiceOption;
   ```

4. **Keep UI State Separate**: UI state types should be clearly separated from API request/response types.

**Source File**: `apps/frontend/src/features/character/types.ts` for frontend-specific types

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Character management database models and relationships
- **[Static Data](static-data.md)** - Character management enums and types
- **[Backend Implementation](backend-implementation.md)** - Character management backend implementation
- **[Frontend Components](frontend-components.md)** - Character management frontend implementation
- **[Character Resolution System](./character-resolution-system.md)** - Character resolution system API and session management
- **[Class System Validation Schemas](../class-system/validation-schemas.md)** - Class system validation patterns
- **[Race System Validation Schemas](../race-system/validation-schemas.md)** - Race system validation patterns
- **[Feature System Validation Schemas](../feature-system/validation-schemas.md)** - Feature system validation patterns
- **[Spell System Validation Schemas](../spell-system/validation-schemas.md)** - Spell system validation patterns
- **[Equipment System Validation Schemas](../equipment-system/validation-schemas.md)** - Equipment system validation patterns
- **[Validation Schema Patterns](../application-overview/validation-schemas.md)** - Shared validation patterns and conventions
