# Character Management Validation Schemas

*Complete documentation for the character management validation schemas, including Zod validation rules, type safety, and data validation patterns.*

## 📋 **Overview**

The character management validation schemas provide comprehensive type safety and data validation for all character-related operations. The schemas ensure data integrity, enforce business rules, and provide clear error messages for validation failures.

**Source File**: `shared/schema/src/character.ts`

## 🏗️ **Schema Architecture**

The character management validation follows the shared **Validation Schema Patterns** documented in [Validation Schemas Overview](../application-overview/validation-schemas.md).

### **Schema Structure**

**Base Schemas**: Core validation rules for character data structures
**Request Schemas**: Validation for API request data
**Response Schemas**: Validation for API response data
**Parameter Schemas**: Validation for path and query parameters

### **Validation Patterns**

**Type Safety**: Comprehensive TypeScript type definitions
**Business Rules**: Enforce character-specific validation rules
**Error Messages**: Clear, user-friendly error messages
**Nested Validation**: Validate complex nested data structures

## 🔧 **Core Validation Schemas**

### **BaseCharacterSchema**

Validates core character data with comprehensive field validation and business rule enforcement.

**Purpose**: Ensures character data is properly structured and contains valid information.

**Validation Rules**:
- **`userId`**: Must be a positive integer (references user owner)
- **`name`**: Required string, 1-100 characters, trimmed
- **`raceId`**: Must be a positive integer (references race)
- **`alignmentId`**: Must be a positive integer (references alignment)
- **`age`**: Optional integer, 0-1000 (non-negative, reasonable maximum)
- **`height`**: Optional integer, 1-1000 (positive, reasonable maximum)
- **`weight`**: Optional integer, 1-10000 (positive, reasonable maximum)
- **`eyes`**: Optional string, max 50 characters
- **`hair`**: Optional string, max 50 characters
- **`gender`**: Optional string, max 20 characters
- **`notes`**: Optional string, max 1000 characters

**Source File**: `shared/schema/src/character.ts`

```typescript
export const BaseCharacterSchema = z.object({
    userId: z.number().int().positive('User ID must be a positive integer'),
    name: z.string()
        .min(1, 'Character name is required')
        .max(100, 'Character name must be less than 100 characters')
        .trim(),
    raceId: z.number().int().positive('Race ID must be a positive integer'),
    alignmentId: z.number().int().positive('Alignment ID must be a positive integer'),
    age: z.number().int().min(0, 'Age must be a non-negative integer').max(1000, 'Age must be less than 1000').nullable(),
    height: z.number().int().min(1, 'Height must be a positive integer').max(1000, 'Height must be less than 1000').nullable(),
    weight: z.number().int().min(1, 'Weight must be a positive integer').max(10000, 'Weight must be less than 10000').nullable(),
    eyes: z.string().max(50, 'Eye color must be less than 50 characters').nullable(),
    hair: z.string().max(50, 'Hair color must be less than 50 characters').nullable(),
    gender: z.string().max(20, 'Gender must be less than 20 characters').nullable(),
    notes: z.string().max(1000, 'Notes must be less than 1000 characters').nullable(),
});
```

### **CharacterSchema**

Extends BaseCharacterSchema with ID and XP fields for complete character validation.

**Purpose**: Validates complete character data including the unique identifier and experience points.

**Validation Rules**:
- **`id`**: Must be a positive integer (unique identifier)
- **`xp`**: Must be a non-negative integer (default: 0)
- **All BaseCharacterSchema rules**: Inherits all validation from BaseCharacterSchema

**Source File**: `shared/schema/src/character.ts`

```typescript
export const CharacterSchema = BaseCharacterSchema.extend({
    id: z.number().int().positive('Character ID must be a positive integer'),
    xp: z.number().int().min(0, 'XP must be a non-negative integer').default(0),
});
```

### **CharacterWithRaceSchema**

Extends CharacterSchema with race information for character display.

**Purpose**: Validates character data with included race information for list displays.

**Validation Rules**:
- **All CharacterSchema rules**: Inherits all validation from CharacterSchema
- **`race`**: Object containing race ID and name

**Source File**: `shared/schema/src/character.ts`

```typescript
export const CharacterWithRaceSchema = CharacterSchema.extend({
    race: z.object({
        id: z.number().int().positive('Race ID must be a positive integer'),
        name: z.string().min(1, 'Race name is required'),
    }),
});
```

### **CharacterAbilityScoreSchema**

Validates character ability score data with comprehensive validation.

**Purpose**: Ensures ability score data is properly structured and contains valid values.

**Validation Rules**:
- **`id`**: Must be a positive integer
- **`characterId`**: Must be a positive integer (references character)
- **`abilityId`**: Must be a positive integer (references ability)
- **`value`**: Must be an integer between 1-50 (reasonable ability score range)

**Source File**: `shared/schema/src/character.ts`

```typescript
export const CharacterAbilityScoreSchema = z.object({
    id: z.number().int().positive('Ability score ID must be a positive integer'),
    characterId: z.number().int().positive('Character ID must be a positive integer'),
    abilityId: z.number().int().positive('Ability ID must be a positive integer'),
    value: z.number().int().min(1, 'Ability score value must be at least 1').max(50, 'Ability score value must be less than 50'),
});
```

## 🎮 **Request and Response Schemas**

### **CreateCharacterRequest**

Validates character creation requests with comprehensive data validation.

**Purpose**: Ensures character creation requests contain valid and complete data.

**Validation Rules**:
- **All BaseCharacterSchema rules**: Inherits all validation from BaseCharacterSchema
- **Required Fields**: All required fields must be present
- **User Ownership**: User ID must be valid and authenticated

**Source File**: `shared/schema/src/character.ts`

```typescript
export const CreateCharacterRequest = BaseCharacterSchema;
```

### **UpdateCharacterRequest**

Validates character update requests with comprehensive data validation.

**Purpose**: Ensures character update requests contain valid data for modification.

**Validation Rules**:
- **All BaseCharacterSchema rules**: Inherits all validation from BaseCharacterSchema
- **Optional Fields**: All fields are optional for partial updates
- **Data Integrity**: Maintains data integrity during updates

**Source File**: `shared/schema/src/character.ts`

```typescript
export const UpdateCharacterRequest = BaseCharacterSchema.partial();
```

### **GetAllCharactersResponse**

Validates the response structure for retrieving all characters.

**Purpose**: Ensures consistent response format for character list operations.

**Validation Rules**:
- **`total`**: Must be a non-negative integer
- **`results`**: Must be an array of CharacterWithRaceSchema objects

**Source File**: `shared/schema/src/character.ts`

```typescript
export const GetAllCharactersResponseSchema = QueryResponseSchema.extend({
    results: z.array(CharacterWithRaceSchema),
});
```

### **CharacterWithAllDetailsResponse**

Validates the response structure for retrieving characters with all related data.

**Purpose**: Ensures consistent response format for detailed character operations.

**Validation Rules**:
- **All CharacterWithRaceSchema rules**: Inherits all validation from CharacterWithRaceSchema
- **`abilityScores`**: Must be an array of CharacterAbilityScoreSchema objects
- **`advancements`**: Must be an array of CharacterAdvancementWithDetailsSchema objects
- **`preparedSpells`**: Must be an array of CharacterSpellPreparationWithMetamagicSchema objects

**Source File**: `shared/schema/src/character.ts`

```typescript
export const CharacterWithAllDetailsSchema = CharacterWithRaceSchema.extend({
    abilityScores: z.array(CharacterAbilityScoreSchema),
    advancements: z.array(CharacterAdvancementWithDetailsSchema),
    preparedSpells: z.array(CharacterSpellPreparationWithMetamagicSchema),
});
```

## 🔗 **Parameter Validation Schemas**

### **CharacterIdParamSchema**

Validates character ID parameters for path-based operations.

**Purpose**: Ensures character ID parameters are valid for API operations.

**Validation Rules**:
- **`id`**: Must be a positive integer

**Source File**: `shared/schema/src/character.ts`

```typescript
export const CharacterIdParamSchema = z.object({
    id: z.number().int().positive('Character ID must be a positive integer'),
});
```

### **AbilityIdParamSchema**

Validates ability ID parameters for path-based operations.

**Purpose**: Ensures ability ID parameters are valid for API operations.

**Validation Rules**:
- **`id`**: Must be a positive integer

**Source File**: `shared/schema/src/character.ts`

```typescript
export const AbilityIdParamSchema = z.object({
    id: z.number().int().positive('Ability ID must be a positive integer'),
});
```

## 📊 **Advancement Validation Schemas**

### **CreateAdvancementSchema**

Validates character advancement creation requests.

**Purpose**: Ensures advancement creation requests contain valid data.

**Validation Rules**:
- **`characterId`**: Must be a positive integer (references character)
- **`level`**: Must be a positive integer (character level)
- **`version`**: Must be a positive integer (advancement version)
- **`classId`**: Must be a positive integer (references class)
- **`secondaryClassId`**: Optional positive integer (references secondary class)
- **`hitPoints`**: Must be a non-negative integer
- **`abilityId`**: Optional positive integer (references ability score improvement)
- **`notes`**: Optional string, max 1000 characters

**Source File**: `shared/schema/src/character.ts`

```typescript
export const CreateAdvancementSchema = z.object({
    characterId: z.number().int().positive('Character ID must be a positive integer'),
    level: z.number().int().positive('Level must be a positive integer'),
    version: z.number().int().positive('Version must be a positive integer'),
    classId: z.number().int().positive('Class ID must be a positive integer'),
    secondaryClassId: z.number().int().positive('Secondary class ID must be a positive integer').nullable(),
    hitPoints: z.number().int().min(0, 'Hit points must be non-negative'),
    abilityId: z.number().int().positive('Ability ID must be a positive integer').nullable(),
    notes: z.string().max(1000, 'Notes must be less than 1000 characters').nullable(),
});
```

### **UpdateAdvancementSchema**

Validates character advancement update requests.

**Purpose**: Ensures advancement update requests contain valid data for modification.

**Validation Rules**:
- **All CreateAdvancementSchema rules**: Inherits all validation from CreateAdvancementSchema
- **Optional Fields**: All fields are optional for partial updates

**Source File**: `shared/schema/src/character.ts`

```typescript
export const UpdateAdvancementSchema = CreateAdvancementSchema.partial();
```

### **CharacterAdvancementWithDetailsSchema**

Validates character advancement data with all related details.

**Purpose**: Ensures advancement data includes all related information for display.

**Validation Rules**:
- **All CreateAdvancementSchema rules**: Inherits all validation from CreateAdvancementSchema
- **`id`**: Must be a positive integer
- **`createdAt`**: Must be a valid date
- **`skills`**: Must be an array of AdvancementSkillSchema objects
- **`feats`**: Must be an array of AdvancementFeatSchema objects
- **`spellsKnown`**: Must be an array of AdvancementSpellSchema objects
- **`featureChoices`**: Must be an array of CharacterFeatureChoiceSchema objects

**Source File**: `shared/schema/src/character.ts`

```typescript
export const CharacterAdvancementWithDetailsSchema = CreateAdvancementSchema.extend({
    id: z.number().int().positive('Advancement ID must be a positive integer'),
    createdAt: z.date(),
    skills: z.array(AdvancementSkillSchema),
    feats: z.array(AdvancementFeatSchema),
    spellsKnown: z.array(AdvancementSpellSchema),
    featureChoices: z.array(CharacterFeatureChoiceSchema),
});
```

## 🎯 **Spell Preparation Validation Schemas**

### **CreateSpellPreparationSchema**

Validates spell preparation creation requests.

**Purpose**: Ensures spell preparation creation requests contain valid data.

**Validation Rules**:
- **`characterId`**: Must be a positive integer (references character)
- **`prepKey`**: Must be a non-empty string (preparation key)
- **`spellId`**: Must be a positive integer (references spell)
- **`level`**: Must be a non-negative integer (spell level)
- **`notes`**: Optional string, max 1000 characters

**Source File**: `shared/schema/src/character.ts`

```typescript
export const CreateSpellPreparationSchema = z.object({
    characterId: z.number().int().positive('Character ID must be a positive integer'),
    prepKey: z.string().min(1, 'Preparation key is required'),
    spellId: z.number().int().positive('Spell ID must be a positive integer'),
    level: z.number().int().min(0, 'Spell level must be non-negative'),
    notes: z.string().max(1000, 'Notes must be less than 1000 characters').nullable(),
});
```

### **UpdateSpellPreparationSchema**

Validates spell preparation update requests.

**Purpose**: Ensures spell preparation update requests contain valid data for modification.

**Validation Rules**:
- **All CreateSpellPreparationSchema rules**: Inherits all validation from CreateSpellPreparationSchema
- **Optional Fields**: All fields are optional for partial updates

**Source File**: `shared/schema/src/character.ts`

```typescript
export const UpdateSpellPreparationSchema = CreateSpellPreparationSchema.partial();
```

### **CharacterSpellPreparationWithMetamagicSchema**

Validates spell preparation data with metamagic integration.

**Purpose**: Ensures spell preparation data includes metamagic information.

**Validation Rules**:
- **All CreateSpellPreparationSchema rules**: Inherits all validation from CreateSpellPreparationSchema
- **`metamagics`**: Must be an array of SpellPreparationMetamagicSchema objects

**Source File**: `shared/schema/src/character.ts`

```typescript
export const CharacterSpellPreparationWithMetamagicSchema = CreateSpellPreparationSchema.extend({
    metamagics: z.array(SpellPreparationMetamagicSchema),
});
```

## 📊 **Business Rule Validation**

### **Character Level Validation**

Validates that character levels follow proper progression rules.

**Business Rules**:
- **Level Progression**: Levels must be sequential (1, 2, 3, etc.)
- **Version Control**: Multiple advancement records per level must be properly versioned
- **Class Consistency**: Class selections must be valid for the character

**Validation Implementation**:
```typescript
// Validates level progression
const LevelProgressionValidation = z.array(CharacterAdvancementSchema).refine(
    (advancements) => {
        const levels = advancements.map(a => a.level).sort((a, b) => a - b);
        return levels.every((level, index) => level === index + 1);
    },
    'Character levels must be sequential'
);
```

### **Ability Score Validation**

Validates that ability scores are within reasonable ranges.

**Business Rules**:
- **Score Range**: Ability scores must be between 1-50
- **Modifier Calculation**: Ability modifiers are calculated as (score - 10) / 2
- **Score Consistency**: Ability scores must be consistent across character data

**Validation Implementation**:
```typescript
// Validates ability score ranges
const AbilityScoreValidation = z.number().int().positive().refine(
    (val) => val >= 1 && val <= 50,
    'Ability score must be between 1 and 50'
);
```

### **Multiclassing Validation**

Validates that multiclassing follows proper rules.

**Business Rules**:
- **Class Compatibility**: Primary and secondary classes must be compatible
- **Level Restrictions**: Multiclassing may have level restrictions
- **Feature Integration**: Class features must be properly integrated

**Validation Implementation**:
```typescript
// Validates multiclassing compatibility
const MulticlassingValidation = CreateAdvancementSchema.refine(
    (advancement) => {
        if (advancement.secondaryClassId) {
            // Check class compatibility rules
            return isValidMulticlassCombination(advancement.classId, advancement.secondaryClassId);
        }
        return true;
    },
    'Invalid multiclass combination'
);
```

## 🔒 **Data Integrity Validation**

### **Character Ownership Validation**

Validates that character ownership is properly enforced.

**Business Rules**:
- **User Ownership**: Characters must belong to valid users
- **Access Control**: Character access is controlled through user ownership
- **Data Isolation**: Users can only access their own characters

**Validation Implementation**:
```typescript
// Validates character ownership
const CharacterOwnershipValidation = CharacterSchema.refine(
    (character) => {
        return isValidUserCharacter(character.userId, character.id);
    },
    'Character does not belong to user'
);
```

### **Advancement Integrity Validation**

Validates that character advancement follows proper rules.

**Business Rules**:
- **Level Progression**: Advancement levels must be sequential
- **Version Control**: Multiple advancement records per level are properly versioned
- **Choice Uniqueness**: Feature choices must be unique per advancement and progression

**Validation Implementation**:
```typescript
// Validates advancement integrity
const AdvancementIntegrityValidation = z.array(CharacterAdvancementSchema).refine(
    (advancements) => {
        const levelVersions = advancements.map(a => `${a.level}-${a.version}`);
        return levelVersions.length === new Set(levelVersions).size;
    },
    'Advancement versions must be unique per level'
);
```

### **Equipment Integrity Validation**

Validates that character equipment follows proper rules.

**Business Rules**:
- **Item Ownership**: Character items must belong to valid characters
- **Property Application**: Item properties must be applied to valid character items
- **Quantity Validation**: Item quantities must be positive

**Validation Implementation**:
```typescript
// Validates equipment integrity
const EquipmentIntegrityValidation = CharacterItemSchema.refine(
    (item) => {
        return item.quantity === null || item.quantity > 0;
    },
    'Item quantity must be positive'
);
```

## 🎯 **Error Handling and Messages**

### **Validation Error Messages**

The character system provides clear, user-friendly error messages for validation failures.

**Error Message Examples**:
- **Required Fields**: "Character name is required"
- **Length Limits**: "Character name must be less than 100 characters"
- **Range Validation**: "Age must be a non-negative integer"
- **Business Rules**: "Invalid multiclass combination"

### **Error Response Structure**

Validation errors follow a consistent structure for API responses.

**Error Response Format**:
```typescript
interface ValidationError {
    message: string;
    path: string[];
    code: string;
}
```

### **Error Handling Patterns**

**Frontend Error Handling**:
- **Form Validation**: Real-time validation with immediate feedback
- **API Error Handling**: Graceful handling of validation errors
- **User Feedback**: Clear error messages displayed to users

**Backend Error Handling**:
- **Request Validation**: Comprehensive validation before processing
- **Error Responses**: Consistent error response format
- **Logging**: Detailed logging of validation failures

## 🔗 **Cross-System Integration**

### **Static Data Integration**

The validation schemas integrate with static data for type validation.

**Integration Points**:
- **Race IDs**: Validates against existing race IDs in database
- **Class IDs**: Validates against existing class IDs in database
- **Ability IDs**: Validates against ability score enum values
- **Alignment IDs**: Validates against alignment enum values

**Source Files**:
- **Static Data**: `shared/static-data/src/` (various static data files)
- **Validation**: `shared/schema/src/character.ts`

### **API Integration**

The validation schemas integrate with the API layer for request/response validation.

**Integration Points**:
- **Request Validation**: Validates all incoming requests
- **Response Validation**: Validates all outgoing responses
- **Parameter Validation**: Validates path and query parameters

**Source Files**:
- **API Routes**: `backend/src/features/character/characterRoutes.ts`
- **Controllers**: `backend/src/features/character/characterController.ts`

## 📚 **Related Documentation**

### **System Documentation**
- **[Database Schema](database-schema.md)** — Prisma models and relationships
- **[Backend Implementation](backend-implementation.md)** — Backend services and API
- **[Frontend Components](frontend-components.md)** — Frontend React components

### **Application Overview**
- **[Validation Schemas Overview](../application-overview/validation-schemas.md)** — Shared validation patterns
- **[Error Handling Patterns](../application-overview/backend-implementation.md#error-handling)** — Shared error handling patterns
- **[Type Safety Patterns](../application-overview/validation-schemas.md#type-safety)** — Shared type safety patterns

### **Cross-System Integration**
- **[Race System Validation](../race-system/validation-schemas.md)** — Race system validation integration
- **[Class System Validation](../class-system/validation-schemas.md)** — Class system validation integration
- **[Feat System Validation](../feat-system/validation-schemas.md)** — Feat system validation integration

## Summary

The character management validation schemas provide comprehensive type safety and data validation for all character-related operations. The schemas ensure data integrity, enforce business rules, and provide clear error messages for validation failures.

The implementation follows established validation patterns and provides robust error handling, ensuring reliable and secure character management throughout the application.
