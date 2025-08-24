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
```typescript
// Create multiple FeatureProgressions for class/race creation
createMultipleFeatureProgressions(progressions: CreateFeatureProgressionRequest[], context: { classId?: number; raceId?: number }): Promise<void>

// Delete FeatureProgressions for a specific class or race
deleteFeatureProgressionsForContext(context: { classId?: number; raceId?: number }): Promise<void>

// Update FeatureProgressions for individual features
updateFeatureProgressions(featureId: number, progressions: FeatureProgressionWithRelations[]): Promise<UpdateResponse>

// Get FeatureProgressions for individual features
getFeatureProgressions(featureId: number): Promise<FeatureProgressionWithRelations[]>
```

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
```typescript
// Get all progressions for a specific feature
GET /features/:id/progressions

// Update progressions for a specific feature
PUT /features/:id/progressions
```

### **Bulk Operations (Class/Race Management)**
```typescript
// Create progressions for class/race creation
POST /features/progressions/bulk
```

## Usage Patterns

### **Pattern 1: Standalone Feature Creation**
1. Create the feature using `POST /features`
2. Add progressions using `PUT /features/:id/progressions`

### **Pattern 2: Class/Race Integration**
1. Create class/race with features using bulk operations
2. FeatureProgressions are created automatically as part of the class/race creation

### **Pattern 3: Feature Editing**
1. Load existing feature using `GET /features/:id`
2. Load existing progressions using `GET /features/:id/progressions`
3. Update feature using `PUT /features/:id`
4. Update progressions using `PUT /features/:id/progressions`

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
```typescript
// Update progressions for a specific feature
updateFeatureProgressions(featureId: number, progressions: FeatureProgressionWithRelations[]): Promise<UpdateResponse>

// Get progressions for a specific feature
getFeatureProgressions(featureId: number): Promise<FeatureProgressionWithRelations[]>
```

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
```typescript
// For updating progressions
const UpdateFeatureProgressionsRequestSchema = z.object({
    progressions: z.array(CreateFeatureProgressionSchema),
});
```

### **Response Schemas**
```typescript
// For getting progressions
const GetFeatureProgressionsResponseSchema = z.array(FeatureProgressionSchema);
```

## Error Handling

### **Common Error Scenarios**
1. **Invalid Feature ID**: Returns 404 if feature doesn't exist
2. **Validation Errors**: Returns 400 for invalid progression data
3. **Database Errors**: Returns 500 for transaction failures

### **Recovery Strategies**
1. **Transaction Rollback**: Automatic rollback on any error
2. **Partial Updates**: Not supported - all progressions are replaced atomically
3. **Data Validation**: Comprehensive validation before database operations

## Best Practices

### **Performance Considerations**
- **Batch Operations**: Use bulk endpoints for class/race creation
- **Lazy Loading**: Load progressions only when needed
- **Caching**: Consider caching for frequently accessed features

### **Data Management**
- **Atomic Updates**: Always update all progressions together
- **Validation**: Validate data before sending to backend
- **Backup**: Consider backing up feature data before major updates

### **UI/UX Guidelines**
- **Clear Feedback**: Show loading states and success/error messages
- **Confirmation**: Ask for confirmation before deleting progressions
- **Progressive Disclosure**: Show basic info first, details on demand

## Future Enhancements

### **Planned Features**
1. **Progression Templates**: Reusable progression patterns
2. **Bulk Import/Export**: CSV/JSON import/export for progressions
3. **Version Control**: Track changes to feature progressions
4. **Advanced Validation**: Rule-based validation for progression combinations

### **Integration Opportunities**
1. **Character System**: Connect progressions to character calculations
2. **Rule Engine**: Integrate with D&D 3.5 rule validation
3. **Analytics**: Track feature usage and progression patterns
