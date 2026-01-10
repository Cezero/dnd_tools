# Character Calculation Backend Implementation

*Complete documentation for the character calculation backend implementation, including services, controllers, and API endpoints for calculating character statistics.*

## 📋 **Overview**

The character calculation backend implementation provides services for calculating derived character statistics, including analog skills and other computed values. The implementation follows established backend patterns with proper separation of concerns, error handling, and integration with the character system.

The backend implementation follows the shared [Backend Implementation Patterns](../application-overview/backend-implementation.md) with calculation-specific business logic and integration patterns.

**Source Files**: 
- Service: `src/features/characterCalculation/characterCalculationService.ts`
- Controller: `src/features/characterCalculation/characterCalculationController.ts`
- Routes: `src/features/characterCalculation/characterCalculationRoutes.ts`

## 🏗️ **Architecture Overview**

The character calculation backend follows the shared [Layered Architecture Pattern](../application-overview/backend-implementation.md#layered-architecture-pattern) with calculation-specific implementations:

**Routes Layer**: API endpoints for character calculation operations
**Controller Layer**: Request handling and response formatting for calculation operations
**Service Layer**: Calculation-specific business logic and data operations
**Database Layer**: Prisma ORM with character and feature system models

### **Service Architecture**

The character calculation system uses a service-oriented architecture following the shared [Service-Oriented Architecture](../application-overview/backend-implementation.md#service-oriented-architecture) patterns:

**CharacterCalculationService**: Central service containing all calculation logic
**Character Integration**: Integration with character service for character data
**Feature System Integration**: Integration with feature system for class-based skill grants
**Transaction Safety**: Read-only operations with proper error handling

### **Key Design Principles**

**Calculation Logic**: Centralized calculation logic for all derived character statistics
**Analog Skills**: Calculation of analog skills based on class levels and ability modifiers
**Feature Integration**: Integration with feature system to determine skill grants
**Performance**: Efficient queries with proper indexing and relationship loading

## 🔧 **Core Service Layer**

### **CharacterCalculationService**

The central service for all character calculation operations, providing comprehensive calculation capabilities for derived character statistics.

**Purpose**: Provides calculation services for character statistics that are derived from base character data, class levels, ability scores, and feature grants.

**Key Responsibilities**:
- **Analog Skill Calculation**: Calculate analog skills based on class levels and ability modifiers
- **Feature Integration**: Determine which classes grant specific analog skills through feature progressions
- **Ability Score Integration**: Calculate ability modifiers for skill calculations
- **Character Data Loading**: Integration with character service for complete character data

**Core Methods**:

#### **getCharacterAnalogSkills**

**Purpose**: Calculates all analog skills available to a character based on class levels and ability modifiers.

**Architecture Decision**: Analog skills are calculated dynamically based on:
- Class levels that grant the skill through feature progressions
- Ability modifiers from character ability scores
- Total skill value as class levels + ability modifier

**Parameters**: 
- `character`: CharacterWithAllDetailsResponse - Complete character data including advancements and ability scores

**Returns**: Array of AnalogSkillCalculation objects with skill details, class levels, ability modifiers, and totals

**Business Logic**:
1. Retrieves all analog skills from the database
2. For each analog skill, checks if any of the character's classes grant it through feature progressions
3. Calculates total class levels for classes that grant the skill
4. Retrieves character's ability score for the skill's associated ability
5. Calculates ability modifier: `Math.floor((abilityScore - 10) / 2)`
   - Standard D&D 3.5 ability modifier calculation
   - Negative modifiers are supported (ability score < 10)
6. Calculates total: `classLevels + abilityModifier`
   - Class levels are summed from all classes that grant the skill
   - Ability modifier is added to class levels for final value
   - Result represents total skill value for the character
7. Returns complete calculation with skill details, granting classes, class levels, ability modifier, and total

**Calculation Formula Details**:
- **Ability Modifier Formula**: `Math.floor((abilityScore - 10) / 2)`
  - Standard D&D 3.5 ability modifier calculation
  - Supports negative modifiers for ability scores below 10
- **Total Skill Value Formula**: `classLevels + abilityModifier`
  - Sums class levels from all granting classes
  - Adds ability modifier to determine final skill value

**Integration with Character Resolution**:
- Character calculation uses character data that may include resolved features
- Analog skills are calculated based on class levels from character advancements
- Ability scores feed into skill calculations through ability modifiers
- Calculation results are used in character sheets and displays

**Frontend Usage Patterns**:
- Frontend calls `/api/characters/:id/calculated-stats` to get all calculated statistics
- Frontend calls `/api/characters/:id/analog-skills` to get analog skill calculations
- Calculated stats are displayed in character sheets and progression displays
- Real-time updates: Calculations are performed on-demand when character data changes

**Source File**: `src/features/characterCalculation/characterCalculationService.ts`

#### **classGrantsAnalogSkill**

**Purpose**: Determines if a specific class grants a specific analog skill through feature progressions.

**Architecture Decision**: Uses feature progression entities to determine skill grants, allowing flexible skill granting through the feature system rather than hardcoded class-skill relationships.

**Parameters**:
- `classId`: number - The class ID to check
- `skillId`: number - The analog skill ID to check

**Returns**: Boolean indicating if the class grants the skill

**Business Logic**:
1. Queries feature progressions for the class
2. Checks if any progression has entities that apply to the skill (EntityAppliesToType.Skill, appliesToId matches skillId)
3. Returns true if such a progression exists

#### **getCharacterAbilityScore**

**Purpose**: Retrieves a character's ability score for a given ability ID.

**Parameters**:
- `character`: CharacterWithAllDetailsResponse - Character data with ability scores
- `abilityId`: number - The ability ID to retrieve

**Returns**: Ability score value, defaulting to 10 if not set

**Business Logic**:
1. Searches character's ability scores for matching ability ID
2. Returns the value if found, otherwise returns default value of 10

#### **getClassNameById**

**Purpose**: Retrieves a class name by class ID for display purposes.

**Parameters**:
- `classId`: number - The class ID

**Returns**: Class name string or null if not found

#### **calculateCharacterStats**

**Purpose**: Calculates all character statistics including analog skills.

**Architecture Decision**: Provides a comprehensive calculation endpoint that can be extended with additional calculated statistics in the future.

**Parameters**:
- `character`: CharacterWithAllDetailsResponse - Complete character data

**Returns**: CharacterCalculatedStats object containing all calculated statistics

**Current Statistics**:
- `analogSkills`: Array of analog skill calculations

**Extension Point**: Additional calculated statistics can be added to this method and the return type as needed.

**Integration with Character Resolution**:
- Character calculation uses character data that may include resolved features
- Analog skills are calculated based on class levels from character advancements
- Ability scores feed into skill calculations through ability modifiers
- Calculation results are used in character sheets and displays

**Frontend Usage**:
- Frontend calls `/api/characters/:id/calculated-stats` to get all calculated statistics
- Frontend calls `/api/characters/:id/analog-skills` to get analog skill calculations
- Calculated stats are displayed in character sheets and progression displays
- Real-time updates: Calculations are performed on-demand when character data changes

#### **getAnalogSkillCalculation**

**Purpose**: Gets the calculation for a specific analog skill.

**Parameters**:
- `character`: CharacterWithAllDetailsResponse - Complete character data
- `skillId`: number - The analog skill ID

**Returns**: AnalogSkillCalculation for the specific skill, or null if not available

**Business Logic**:
1. Calculates all analog skills for the character
2. Finds and returns the calculation for the specified skill

## 🎯 **Controller Layer**

The character calculation controllers follow the shared [Controller Layer Pattern](../application-overview/backend-implementation.md#controller-layer) with calculation-specific request handling:

### **CharacterCalculationController**

**Purpose**: Handles HTTP requests for character calculation operations, delegating to the calculation service and formatting responses.

**Controller Methods**:

#### **GetCharacterCalculatedStats**

**Purpose**: Handles requests for all calculated character statistics.

**Request**: 
- Path parameter: `id` (character ID)
- Authentication: Required

**Response**: CharacterCalculatedStats object with all calculated statistics

**Business Logic**:
1. Retrieves character with all details using character service
2. Returns 404 if character not found
3. Calculates all character statistics using calculation service
4. Returns calculated statistics

**Error Handling**:
- 404: Character not found
- 500: Internal server error with logging

#### **GetCharacterAnalogSkills**

**Purpose**: Handles requests for character analog skills calculation.

**Request**:
- Path parameter: `id` (character ID)
- Authentication: Required

**Response**: Object with `analogSkills` array

**Business Logic**:
1. Retrieves character with all details using character service
2. Returns 404 if character not found
3. Calculates analog skills using calculation service
4. Returns analog skills array

**Error Handling**:
- 404: Character not found
- 500: Internal server error with logging

**Source File**: `src/features/characterCalculation/characterCalculationController.ts`

## 🔗 **Routes Layer**

The character calculation routes follow the shared [RESTful API Structure](../application-overview/backend-implementation.md#restful-api-structure) pattern:

### **CharacterCalculationRoutes**

**Purpose**: Defines API endpoints for character calculation operations with proper validation and authentication.

**Route Definitions**:
```typescript
import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import { CharacterIdParamSchema } from '@shared/schema';

import {
    GetCharacterCalculatedStats,
    GetCharacterAnalogSkills,
} from './characterCalculationController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';

const { router: CharacterCalculationRouter, get } = buildValidatedRouter();

get('/characters/:id/calculated-stats', requireAuth, { params: CharacterIdParamSchema }, GetCharacterCalculatedStats);
get('/characters/:id/analog-skills', requireAuth, { params: CharacterIdParamSchema }, GetCharacterAnalogSkills);

export { CharacterCalculationRouter };
```

**API Endpoints**:

- **`GET /api/characters/:id/calculated-stats`**: Get all calculated character statistics (authenticated)
- **`GET /api/characters/:id/analog-skills`**: Get analog skills calculation for character (authenticated)

**Source File**: `src/features/characterCalculation/characterCalculationRoutes.ts`

## 🔗 **Integration Points**

### **Character Service Integration**

The calculation service integrates with the character service to retrieve complete character data:

**Integration Pattern**:
- Controllers use `characterService.getCharacterWithAllDetails()` to load character data
- Calculation service receives complete character data including advancements and ability scores
- No direct database access in controllers - all data flows through character service

**Benefits**:
- **Single Source of Truth**: Character data loading is centralized in character service
- **Consistency**: All character data access uses the same service methods
- **Maintainability**: Changes to character data structure only affect character service

### **Feature System Integration**

The calculation service integrates with the feature system to determine skill grants:

**Integration Pattern**:
- Queries feature progressions to find classes that grant analog skills
- Uses EntityAppliesToType.Skill to identify skill-granting features
- Flexible skill granting through feature system rather than hardcoded relationships

**Benefits**:
- **Flexibility**: Skill grants can be configured through feature system
- **Extensibility**: New skill grants can be added without code changes
- **Consistency**: Uses same feature system as other character features

### **Database Integration**

The calculation service integrates with the database through Prisma ORM:

**Prisma Integration**:
- **Type-Safe Queries**: Uses Prisma's type-safe query builder
- **Relationship Loading**: Efficiently loads related data (classes, skills, features)
- **Performance**: Optimized queries with proper indexing

## 📊 **Data Structures**

### **AnalogSkillCalculation**

Interface for analog skill calculation results:

```typescript
export interface AnalogSkillCalculation {
    skillId: number;
    skillName: string;
    abilityId: number;
    abilityName: string;
    classLevels: number;
    abilityModifier: number;
    total: number;
    grantedByClasses: string[];
}
```

**Fields**:
- `skillId`: Database ID of the analog skill
- `skillName`: Display name of the skill
- `abilityId`: Associated ability ID
- `abilityName`: Display name of the ability
- `classLevels`: Total class levels that grant this skill
- `abilityModifier`: Calculated ability modifier
- `total`: Total skill value (classLevels + abilityModifier)
- `grantedByClasses`: Array of class names that grant this skill

### **CharacterCalculatedStats**

Interface for all calculated character statistics:

```typescript
export interface CharacterCalculatedStats {
    analogSkills: AnalogSkillCalculation[];
    // Additional calculated stats can be added here
}
```

**Extension Point**: Additional calculated statistics can be added to this interface as needed.

## 🎯 **Architecture Decisions**

### **Why Centralized Calculation Service**

**Decision**: All character calculations are centralized in a single service rather than distributed across multiple services.

**Rationale**:
- **Consistency**: Ensures all calculations use the same logic and data sources
- **Maintainability**: Changes to calculation logic only need to be made in one place
- **Testability**: Calculation logic can be tested independently
- **Performance**: Calculations can be optimized and cached together

**Alternatives Considered**:
- Distributed calculations in each feature system
- Calculations in character service
- Frontend-only calculations

**Trade-offs**:
- **Benefits**: Centralized logic, easier testing, consistent results
- **Limitations**: Service must integrate with multiple systems

### **Why Feature System Integration for Skill Grants**

**Decision**: Analog skill grants are determined through feature progressions rather than hardcoded class-skill relationships.

**Rationale**:
- **Flexibility**: Skill grants can be configured through feature system
- **Extensibility**: New skill grants can be added without code changes
- **Consistency**: Uses same feature system as other character features
- **D&D 3.5 Compliance**: Supports complex skill granting mechanics

**Alternatives Considered**:
- Hardcoded class-skill mapping
- Separate skill grant table
- Skill grants in class definitions

**Trade-offs**:
- **Benefits**: Flexible, extensible, consistent with feature system
- **Limitations**: Requires feature system queries, slightly more complex

### **Why Read-Only Operations**

**Decision**: Calculation service only performs read operations, never modifying character data.

**Rationale**:
- **Separation of Concerns**: Calculations don't modify data, only compute derived values
- **Safety**: Prevents accidental data modification
- **Performance**: Read-only operations are faster and can be cached
- **Clarity**: Clear distinction between calculation and modification operations

## 📚 **Related Documentation**

- **[Character Management Backend Implementation](backend-implementation.md)** - Character CRUD operations and data management
- **[Character Resolution System](character-resolution-system.md)** - Feature resolution and session management
- **[Feature System Backend Implementation](../feature-system/backend-implementation.md)** - Feature system integration
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** - Shared backend patterns

## Summary

The character calculation backend implementation provides a robust, flexible, and extensible foundation for calculating derived character statistics. The implementation follows established patterns, provides comprehensive error handling, and ensures data integrity through proper validation and type safety.

Key strengths include:
- **Centralized Logic**: All calculations in one service for consistency
- **Feature Integration**: Flexible skill grants through feature system
- **Type Safety**: Full TypeScript integration with proper interfaces
- **Error Handling**: Comprehensive error handling with proper logging
- **Extensibility**: Easy to add new calculated statistics

The implementation is designed to scale with the application and provides the necessary calculation capabilities for character statistics operations.
