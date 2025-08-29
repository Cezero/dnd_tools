# FeatureProgression Management

This document describes the FeatureProgression management system that allows creating and managing FeatureProgressions for individual features.

## Overview

The FeatureProgression management system provides two main workflows:

1. **Standalone Feature Management**: Create and manage FeatureProgressions for individual features
2. **Class/Race Integration**: Manage FeatureProgressions as part of class/race creation

## Relationship Model

### **Feature → FeatureProgression Relationship**
```
Feature (1) ←→ (Many) FeatureProgression
```

- **Features** are standalone entities with basic properties (name, slug, description, prerequisites)
- **FeatureProgressions** reference Features via `featureId` and specify how that feature is applied
- **One Feature** can have **multiple FeatureProgressions** (used in different classes, races, etc.)
- **FeatureProgressions** always reference **one Feature** via `featureId`

### **Key Benefits**
- **Reusability**: Same feature can be used across multiple classes/races with different progression details
- **Flexibility**: Different contexts can apply the same feature with different modifiers, choices, or effects
- **Maintainability**: Feature definitions are centralized, progression details are contextual

## Backend Architecture

### **Consolidated Service Layer**
The backend uses a consolidated approach to eliminate duplicate FeatureProgression management logic:

- **FeatureSystemService**: Central service containing all FeatureProgression management logic
- **ClassService & RaceService**: Consumer services that call consolidated methods
- **Single Source of Truth**: All FeatureProgression creation/deletion goes through FeatureSystemService

### **Consolidated Methods**

**createMultipleFeatureProgressions**: Creates multiple FeatureProgressions for class/race creation
- **Parameters**: Array of progression data, context (classId/raceId), optional transaction
- **Purpose**: Bulk creation of feature progressions with full relationship data
- **Usage**: Called by ClassService and RaceService during class/race creation

**deleteFeatureProgressionsForContext**: Deletes all FeatureProgressions for a specific class or race
- **Parameters**: Context (classId/raceId), optional transaction
- **Purpose**: Bulk deletion of feature progressions and all related data
- **Usage**: Called by ClassService and RaceService during class/race deletion

**updateFeatureProgressions**: Updates FeatureProgressions for individual features
- **Parameters**: Feature ID and array of updated progression data
- **Purpose**: Updates existing feature progressions with new data
- **Usage**: Called for individual feature progression management

**getFeatureProgressions**: Gets FeatureProgressions for individual features
- **Parameters**: Feature ID
- **Purpose**: Retrieves all progressions for a specific feature
- **Usage**: Called for feature progression display and editing

### **Service Integration**
- **ClassService**: Uses `createMultipleFeatureProgressions()` and `deleteFeatureProgressionsForContext()` for class feature management
- **RaceService**: Uses `createMultipleFeatureProgressions()` and `deleteFeatureProgressionsForContext()` for race feature management
- **FeatureSystemService**: Provides the consolidated logic and handles individual feature progression management

**Related Documentation:**
- [Class System Documentation](../class-system/README.md) - How classes integrate with FeatureProgressions
- [Race System Documentation](../race-system/README.md) - How races integrate with FeatureProgressions
- [Schema Reference](./schema-reference.md) - Complete schema definitions and relationships

## API Endpoints

### **Individual Feature Management**

**Get Feature Progressions**: Retrieves all progressions for a specific feature
- **Route**: `GET /features/:id/progressions`
- **Purpose**: Load existing progressions for feature editing
- **Response**: Array of feature progressions with full relationship data

**Update Feature Progressions**: Updates progressions for a specific feature
- **Route**: `PUT /features/:id/progressions`
- **Purpose**: Update existing feature progressions
- **Body**: Array of updated progression data

### **Bulk Operations (Class/Race Management)**

**Create Feature Progressions**: Creates progressions for class/race creation
- **Route**: `POST /features/progressions/bulk`
- **Purpose**: Bulk creation of feature progressions during class/race creation
- **Body**: Complete feature progression data with relationships

## Usage Patterns

### **Pattern 1: Standalone Feature Creation**
1. Create the feature using the feature creation endpoint
2. Add progressions using the feature progression update endpoint

### **Pattern 2: Class/Race Integration**
1. Create class/race with features using bulk operations
2. FeatureProgressions are created automatically as part of the class/race creation

### **Pattern 3: Feature Editing**
1. Load existing feature using the feature retrieval endpoint
2. Load existing progressions using the progression retrieval endpoint
3. Update feature using the feature update endpoint
4. Update progressions using the progression update endpoint

## Frontend Integration

### **FeatureEdit Component**
The `FeatureEdit` component now includes full FeatureProgression management:

- **Load Progressions**: Automatically loads existing progressions when editing a feature
- **Display Progressions**: Shows all progressions with their modifiers, choices, and effects
- **Edit Progressions**: Uses `FeatureProgressionDetailEdit` dialog for editing individual progressions
- **Save Progressions**: Automatically saves progressions after feature creation/update

### **UI Components**
- **FeatureProgression Section**: Displays all progressions with edit/remove capabilities
- **FeatureProgressionDetailEdit Dialog**: Full-featured progression editor
- **Add Progression Button**: Allows adding new progressions to features

## Backend Implementation

### **Service Methods**

**updateFeatureProgressions**: Updates progressions for a specific feature
- **Parameters**: Feature ID and array of updated progression data
- **Purpose**: Replaces existing progressions with new data
- **Returns**: Success response with operation status

**getFeatureProgressions**: Gets progressions for a specific feature
- **Parameters**: Feature ID
- **Purpose**: Retrieves all progressions with full relationship data
- **Returns**: Array of feature progressions

### **Transaction Safety**
- **Full Cleanup**: Deletes existing progressions and all related entities before creating new ones
- **Rollback Support**: Uses database transactions to ensure data consistency
- **Formula Params Cleanup**: Properly handles orphaned formula parameters

### **Data Integrity**
- **Cascade Deletion**: Removes modifiers, choices, effects, and formula params when progressions are deleted
- **Foreign Key Constraints**: Maintains referential integrity
- **Validation**: Uses Zod schemas for request/response validation

## Schema Definitions

### **Request Schemas**

**UpdateFeatureProgressionsRequestSchema**: Schema for updating feature progressions
- **Structure**: Contains array of feature progression data
- **Validation**: Validates all progression data using CreateFeatureProgressionSchema
- **Usage**: Used for feature progression update requests

### **Response Schemas**

**FeatureProgressionResponseSchema**: Schema for feature progression responses
- **Structure**: Contains progression data with full relationship information
- **Includes**: Modifiers, choices, effects, and formula parameters
- **Usage**: Used for feature progression retrieval responses

## Integration Benefits

### **Consolidated Logic**
- **Single Source of Truth**: All FeatureProgression logic centralized in FeatureSystemService
- **Reduced Duplication**: No duplicate logic across ClassService and RaceService
- **Consistent Behavior**: Same patterns used for all feature progression operations

### **Transaction Safety**
- **Shared Transactions**: ClassService and RaceService can pass transactions to feature system methods
- **Data Consistency**: All operations maintain referential integrity
- **Rollback Support**: Failed operations properly rollback all changes

### **Maintainability**
- **Centralized Updates**: Changes to feature progression logic only need to be made in one place
- **Consistent API**: Same interface used for all feature progression operations
- **Clear Responsibilities**: Each service has well-defined responsibilities

## Related Documentation

- **[Backend Implementation](backend-implementation.md)** - Complete backend implementation details
- **[Database Schema](database-schema.md)** - Database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Request/response validation rules
- **[Class System Feature Integration](../class-system/feature-integration.md)** - Class system integration details
- **[Race System Feature Integration](../race-system/race-integration.md)** - Race system integration details
