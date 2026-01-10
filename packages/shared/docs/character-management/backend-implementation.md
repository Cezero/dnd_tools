# Character Management Backend Implementation

*Complete documentation for the character management backend implementation, including services, controllers, API routes, and business logic.*

## 📋 **Overview**

The character management backend implementation provides the server-side functionality for character creation, advancement, ability score management, spell preparation, and equipment management. The implementation follows the established backend patterns with comprehensive validation, error handling, and database integration.

The backend implementation follows the shared [Backend Implementation Patterns](../application-overview/backend-implementation.md) with character-specific business logic and integration patterns.

**Source Files**: 
- Service: `src/features/character/characterService.ts`
- Controller: `src/features/character/characterController.ts`
- Routes: `src/features/character/characterRoutes.ts`
- Types: `src/features/character/types.ts`

## 🏗️ **Architecture Overview**

The character management backend follows the shared [Layered Architecture Pattern](../application-overview/backend-implementation.md#layered-architecture-pattern) with character-specific implementations:

**Routes Layer**: API endpoints for character management and related operations
**Controller Layer**: Request handling and response formatting for character operations
**Service Layer**: Character-specific business logic and data operations
**Database Layer**: Prisma ORM with character system models

### **Service Architecture**

The character management system uses a service-oriented architecture following the shared [Service-Oriented Architecture](../application-overview/backend-implementation.md#service-oriented-architecture) patterns:

**CharacterService**: Central service containing all character management logic
**Transaction Safety**: Consistent transaction patterns for data integrity
**Relationship Management**: Complex character relationship handling with advancements, abilities, and equipment
**Validation**: Comprehensive validation at all levels using Zod schemas

### **Key Design Principles**

**Character Management**: Complete CRUD operations for character definitions
**Advancement System**: Character level progression and advancement tracking
**Ability Score Management**: Character ability score operations and calculations
**Spell Preparation**: Character spell preparation and metamagic integration
**Equipment Integration**: Character equipment and item management
**Cross-System Integration**: Integration with class, race, feature, spell, and equipment systems

## 🔧 **Core Service Layer**

### **CharacterService**

The central service for all character management operations, providing comprehensive character CRUD operations and integration with advancement, ability scores, and equipment systems.

**Purpose**: Provides comprehensive character management capabilities, from basic character CRUD to complex integrations with advancement, ability scores, spell preparation, and equipment systems.

**Key Responsibilities**:
- **Character CRUD**: Create, read, update, and delete character definitions
- **Advancement Management**: Manage character level progression and advancement data
- **Ability Score Management**: Manage character ability scores and calculations
- **Spell Preparation**: Manage character spell preparation and metamagic
- **Equipment Management**: Manage character equipment and items
- **Transaction Safety**: Ensure data consistency through proper transaction handling
- **Validation**: Validate character data and relationships

**Core Methods**:

**getAllCharacters**: Retrieves all characters for a user with race information
- **Parameters**: User ID for character ownership
- **Business Logic**: Loads all characters owned by the user with race relationships
- **Returns**: Array of characters with race information and total count

**getCharacterById**: Retrieves a specific character by ID with basic information
- **Parameters**: Character ID
- **Business Logic**: Loads character by unique ID with race relationship, returns null if not found
- **Returns**: Complete character object with race information or null

**getCharacterWithAllDetails**: Retrieves a character with complete details including advancements, abilities, and equipment
- **Parameters**: Character ID
- **Business Logic**: Loads character with all related data including advancements, ability scores, spell preparation, and equipment
- **Returns**: Complete character object with all relationships or null

**createCharacter**: Creates a new character with validation and relationship management
- **Parameters**: Complete character creation data including user ID
- **Business Logic**: Creates character in database with proper user ownership and race relationship
- **Returns**: Created character ID and success message

**updateCharacter**: Updates an existing character with relationship management
- **Parameters**: Character ID and updated data
- **Business Logic**: Updates character data and manages relationships through transactions
- **Returns**: Success message

**deleteCharacter**: Deletes a character and all related data
- **Parameters**: Character ID
- **Business Logic**: Deletes character and all related data (cascades to relationships)
- **Returns**: Success message

**Source File**: `src/features/character/characterService.ts`

## 🎯 **Controller Layer**

The character management controllers follow the shared [Controller Layer Pattern](../application-overview/backend-implementation.md#controller-layer) with character-specific request handling:

### **CharacterController**

**Purpose**: Handles HTTP requests and responses for character management operations, delegating business logic to the service layer.

**Key Responsibilities**:
- **Request Processing**: Handle incoming HTTP requests with proper validation
- **Response Formatting**: Format responses according to API standards
- **Error Handling**: Provide appropriate error responses and status codes
- **Authentication**: Enforce user authentication for character operations

**Core Methods**:

**GetAllCharacters**: Retrieves all characters for the authenticated user
- **Route**: `GET /api/characters`
- **Authentication**: User authentication required
- **Response**: Array of characters with race information and total count

**GetCharacterById**: Retrieves a specific character by ID
- **Route**: `GET /api/characters/:id`
- **Parameters**: Character ID in URL path
- **Authentication**: User authentication required
- **Response**: Complete character with race information or 404 error

**GetCharacterWithAllDetails**: Retrieves a character with complete details
- **Route**: `GET /api/characters/:id/details`
- **Parameters**: Character ID in URL path
- **Authentication**: User authentication required
- **Response**: Complete character with all relationships or 404 error

**CreateCharacter**: Creates a new character
- **Route**: `POST /api/characters`
- **Authentication**: User authentication required
- **Body**: Complete character creation data
- **Response**: Created character ID and success message

**UpdateCharacter**: Updates an existing character
- **Route**: `PUT /api/characters/:id`
- **Authentication**: User authentication required
- **Body**: Character update data
- **Response**: Success message

**DeleteCharacter**: Deletes a character
- **Route**: `DELETE /api/characters/:id`
- **Authentication**: User authentication required
- **Response**: Success message

**Source File**: `src/features/character/characterController.ts`

## 🔗 **Routes Layer**

The character management routes follow the shared [RESTful API Structure](../application-overview/backend-implementation.md#restful-api-structure) with character-specific endpoints:

### **CharacterRoutes**

**Purpose**: Defines API endpoints and request validation for character management operations.

**Route Structure**:
- **Core Character Routes**: Standard CRUD operations for characters
- **Character Detail Routes**: Advanced character data retrieval
- **Character Integration Routes**: Integration with advancement, ability scores, and equipment

**Route Definitions**:

**Core Character Routes**:
- `GET /api/characters` - Retrieve all characters for user
- `GET /api/characters/:id` - Retrieve specific character by ID
- `GET /api/characters/:id/details` - Retrieve character with all details
- `POST /api/characters` - Create new character
- `PUT /api/characters/:id` - Update existing character
- `DELETE /api/characters/:id` - Delete character

**Authentication**: User authentication required for all operations
**Validation**: All routes use Zod schemas for request validation

**Source File**: `src/features/character/characterRoutes.ts`

## 🔧 **Business Logic Patterns**

### **Character Advancement Management**

The character management system handles complex character advancement through a sophisticated level progression system:

**Advancement Structure**: Each character advancement represents a level gain with class progression
**Version Control**: Multiple versions of the same level for complex advancement scenarios
**Class Integration**: Primary and secondary class progression support
**Feature Integration**: Character feature choices and progression tracking
**Skill Integration**: Skill point allocation and advancement tracking
**Feat Integration**: Feat selection and advancement tracking
**Spell Integration**: Spell learning and advancement tracking

**Spell Scribing Operations**: Spell add/remove operations with free grant validation
- **addSpellKnown**: Adds a spell to character's spellbook or known spells with validation
- **removeSpellKnown**: Removes a spell from character's spellbook or known spells
- **getAvailableSpellsForClass**: Gets available spells for a class with known status and free grant information
- **Integration**: Integrates with character resolution sessions for state synchronization
- **Related Documentation**: [Spell Scribing Feature](./spell-scribing.md) - Comprehensive spell scribing documentation

**Integration Pattern**: The character service manages advancement relationships through database transactions, ensuring data consistency and proper relationship handling.

**Related Documentation**: [Class System Backend Implementation](../class-system/backend-implementation.md), [Feature System Backend Implementation](../feature-system/backend-implementation.md)

### **Character Ability Score Management**

The character management system handles character ability scores through a flexible scoring system:

**Ability Score Structure**: Individual ability scores for each character
**Score Validation**: Ability score validation and range checking
**Calculation Integration**: Integration with character calculation systems
**Modifier Integration**: Integration with ability score modifier systems

**Integration Pattern**: The character service manages ability score relationships through database transactions, ensuring data consistency and proper relationship handling.

**Related Documentation**: [Static Data - Ability Scores](../application-overview/static-data.md#ability-scores)

### **Character Spell Preparation Management**

The character management system handles character spell preparation through a sophisticated spellcasting system:

**Spell Preparation Structure**: Character spell preparation with class integration
**Metamagic Integration**: Metamagic feat integration with spell preparation
**Class Integration**: Class-specific spell preparation and slot management
**Spell Integration**: Spell selection and preparation tracking

**Integration Pattern**: The character service manages spell preparation relationships through database transactions, ensuring data consistency and proper relationship handling.

**Related Documentation**: [Spell System Backend Implementation](../spell-system/backend-implementation.md), [Class System Backend Implementation](../class-system/backend-implementation.md)

### **Character Equipment Management**

The character management system handles character equipment through an item management system:

**Equipment Structure**: Character equipment with base item references
**Property Integration**: Equipment property application and management
**Item Integration**: Base item integration and customization
**Quantity Management**: Equipment quantity tracking and management

**Integration Pattern**: The character service manages equipment relationships through database transactions, ensuring data consistency and proper relationship handling.

**Related Documentation**: [Equipment System Backend Implementation](../equipment-system/backend-implementation.md)

## 🔗 **Integration Points**

### **Class System Integration**

The character management system integrates with the class system through character advancement:

**Class Progression**: Characters advance in classes through the advancement system
**Class Features**: Character feature choices integrate with class feature systems
**Spellcasting**: Character spell preparation integrates with class spellcasting
**Proficiency Management**: Character proficiencies integrate with class proficiency systems

**Integration Pattern**: The character system provides the framework for character class progression, with class features and abilities determining character capabilities.

**Related Documentation**: [Class System Backend Implementation](../class-system/backend-implementation.md)

### **Race System Integration**

The character management system integrates with the race system through character creation:

**Race Selection**: Characters are created with specific races
**Race Features**: Character features integrate with race feature systems
**Ability Modifiers**: Race ability modifiers integrate with character ability scores
**Proficiency Grants**: Race proficiency grants integrate with character proficiencies

**Integration Pattern**: The character system provides the framework for character race integration, with race features and abilities determining character capabilities.

**Related Documentation**: [Race System Backend Implementation](../race-system/backend-implementation.md)

### **Feature System Integration**

The character management system integrates with the feature system through character advancement:

**Feature Progression**: Character feature choices integrate with feature progression systems
**Feature Selection**: Character feature choices integrate with feature choice systems
**Feature Effects**: Character feature effects integrate with feature effect systems

**Integration Pattern**: The character system provides the framework for character feature integration, with feature choices and effects determining character capabilities.

**Related Documentation**: [Feature System Backend Implementation](../feature-system/backend-implementation.md)

### **Spell System Integration**

The character management system integrates with the spell system through character spell preparation:

**Spell Selection**: Character spell preparation integrates with spell selection systems
**Spell Casting**: Character spell casting integrates with spell casting systems
**Metamagic Integration**: Character metamagic integrates with spell metamagic systems

**Integration Pattern**: The character system provides the framework for character spell integration, with spell preparation and casting determining character capabilities.

**Related Documentation**: [Spell System Backend Implementation](../spell-system/backend-implementation.md)

### **Equipment System Integration**

The character management system integrates with the equipment system through character equipment:

**Equipment Selection**: Character equipment integrates with equipment selection systems
**Equipment Usage**: Character equipment usage integrates with equipment usage systems
**Equipment Effects**: Character equipment effects integrate with equipment effect systems

**Integration Pattern**: The character system provides the framework for character equipment integration, with equipment selection and usage determining character capabilities.

**Related Documentation**: [Equipment System Backend Implementation](../equipment-system/backend-implementation.md)

## 📊 **Error Handling**

The character management system follows the shared [Error Handling Patterns](../application-overview/backend-implementation.md#error-handling) with character-specific error scenarios:

**Validation Errors**: Zod schema validation errors with detailed field information
**Business Logic Errors**: Character-specific business rule violations
**Database Errors**: Prisma ORM errors with proper error messages
**Relationship Errors**: Errors from complex character relationship management
**Authentication Errors**: User authentication and authorization errors

## 🔧 **Performance Considerations**

The character management system implements performance optimizations following the shared [Performance Optimization](../application-overview/performance-optimization.md) patterns:

**Efficient Queries**: Optimized Prisma queries with proper includes and where clauses
**Relationship Loading**: Efficient loading of complex character relationships
**Caching**: Appropriate caching for frequently accessed character data
**Pagination**: Proper pagination for large character collections

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Character management database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Character management validation rules and schemas
- **[Static Data](static-data.md)** - Character management enums and types
- **[Frontend Components](frontend-components.md)** - Character management frontend implementation
- **[Class System Backend Implementation](../class-system/backend-implementation.md)** - Class system integration
- **[Race System Backend Implementation](../race-system/backend-implementation.md)** - Race system integration
- **[Feature System Backend Implementation](../feature-system/backend-implementation.md)** - Feature system integration
- **[Spell System Backend Implementation](../spell-system/backend-implementation.md)** - Spell system integration
- **[Equipment System Backend Implementation](../equipment-system/backend-implementation.md)** - Equipment system integration
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** - Shared backend patterns and conventions
- **[Performance Optimization](../application-overview/performance-optimization.md)** - Shared performance optimization strategies
