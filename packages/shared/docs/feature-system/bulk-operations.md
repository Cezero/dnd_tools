# Bulk Operations Guide

*Creating, updating, and reading class/race data with features using both individual and bulk operations.*

## 📋 **Overview**

This document provides guidance on using the feature system's bulk operations for efficiently managing class and race feature progressions. The system supports both individual CRUD operations for standalone features and bulk operations for class/race feature progressions.

**Related Documentation:**
- **[Backend Implementation](backend-implementation.md)** - Feature system backend implementation
- **[Database Schema](database-schema.md)** - Feature system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Feature system validation rules and schemas

## 🎯 **Core Principle: Flexible Operations**

The feature system supports both **individual CRUD operations** for standalone features and **bulk operations** for class/race feature progressions. The system is designed to handle both patterns efficiently, allowing for flexible feature management.

## 🔧 **Individual Feature Operations**

### **Creating Standalone Features**

**Purpose**: Create individual features that can be reused across multiple classes and races.

**Process**: Use the `createFeature` API method to create a new feature with basic information and prerequisites.

**Key Components**:
- Feature name, slug, and description
- Prerequisites (if any)
- Basic feature metadata

**Source File**: See actual implementation in `apps/backend/src/features/featureSystem/featureSystemService.ts`

### **Updating Standalone Features**

**Purpose**: Modify existing features to update their information or prerequisites.

**Process**: Use the `updateFeature` API method to update an existing feature's information.

**Key Components**:
- Updated feature information
- Modified prerequisites
- Preserved feature relationships

**Source File**: See actual implementation in `apps/backend/src/features/featureSystem/featureSystemService.ts`

### **Reading Standalone Features**

**Purpose**: Retrieve features for display, selection, or management purposes.

**Process**: Use the `getAllFeatures` API method to retrieve features with optional filtering.

**Key Components**:
- All features or filtered subsets
- Source type filtering (class vs race features)
- Feature metadata and relationships

**Source File**: See actual implementation in `apps/backend/src/features/featureSystem/featureSystemService.ts`

### **Deleting Standalone Features**

**Purpose**: Remove features that are no longer needed.

**Process**: Use the `deleteFeature` API method to remove a feature and all its associated data.

**Key Components**:
- Feature deletion with cascade to progressions
- Cleanup of related data
- Validation of deletion safety

**Source File**: See actual implementation in `apps/backend/src/features/featureSystem/featureSystemService.ts`

## 🔧 **Bulk Operations for Class/Race Features**

### **Creating a Class with Features**

**Purpose**: Create a complete class with all its feature progressions in a single operation.

**Process**: Use the `createMultipleFeatureProgressions` method to create all feature progressions for a class at once.

**Key Components**:
- Class metadata and basic information
- Array of feature progressions with entities
- Transaction safety for data consistency
- Formula parameter integration

**Source File**: See actual implementation in `apps/backend/src/features/featureSystem/featureSystemService.ts`

### **Creating a Race with Features**

**Purpose**: Create a complete race with all its feature progressions in a single operation.

**Process**: Use the `createMultipleFeatureProgressions` method to create all feature progressions for a race at once.

**Key Components**:
- Race metadata and basic information
- Array of feature progressions with entities
- Transaction safety for data consistency
- Formula parameter integration

**Source File**: See actual implementation in `apps/backend/src/features/featureSystem/featureSystemService.ts`

### **Updating Class/Race Features**

**Purpose**: Update all feature progressions for a class or race in a single operation.

**Process**: Use the `updateFeatureProgressions` method to update all feature progressions for a specific feature.

**Key Components**:
- Feature ID and updated progression data
- Complete replacement of existing progressions
- Transaction safety for data consistency
- Validation of updated data

**Source File**: See actual implementation in `apps/backend/src/features/featureSystem/featureSystemService.ts`

### **Deleting Class/Race Features**

**Purpose**: Remove all feature progressions for a class or race in a single operation.

**Process**: Use the `deleteFeatureProgressionsForContext` method to remove all feature progressions for a specific class or race.

**Key Components**:
- Context identification (class ID or race ID)
- Cascade deletion of all related data
- Transaction safety for data consistency
- Cleanup of orphaned data

**Source File**: See actual implementation in `apps/backend/src/features/featureSystem/featureSystemService.ts`

## 🎯 **Bulk Operation Benefits**

### **Transaction Safety**
All bulk operations use database transactions to ensure data consistency. If any part of the operation fails, the entire operation is rolled back, maintaining data integrity.

### **Performance Optimization**
Bulk operations are more efficient than individual operations because they:
- Reduce database round trips
- Minimize transaction overhead
- Optimize query execution
- Reduce network latency

### **Data Consistency**
Bulk operations ensure that all related data is created, updated, or deleted together, preventing partial updates that could leave the system in an inconsistent state.

### **Error Handling**
Bulk operations provide comprehensive error handling that ensures that failures are properly reported and that the system remains in a consistent state.

## 🔧 **Implementation Patterns**

### **Class Creation Pattern**

**Process Flow**:
1. Create class metadata
2. Prepare feature progression data
3. Execute bulk feature progression creation
4. Validate results
5. Handle any errors

**Key Considerations**:
- Ensure all feature progressions are properly configured
- Validate that all referenced features exist
- Handle formula parameter integration
- Ensure transaction safety

### **Race Creation Pattern**

**Process Flow**:
1. Create race metadata
2. Prepare feature progression data
3. Execute bulk feature progression creation
4. Validate results
5. Handle any errors

**Key Considerations**:
- Ensure all feature progressions are properly configured
- Validate that all referenced features exist
- Handle formula parameter integration
- Ensure transaction safety

### **Feature Update Pattern**

**Process Flow**:
1. Validate updated feature data
2. Delete existing feature progressions
3. Create new feature progressions
4. Validate results
5. Handle any errors

**Key Considerations**:
- Ensure data validation before updates
- Handle cascade deletion properly
- Maintain referential integrity
- Ensure transaction safety

## 🎯 **Best Practices**

### **Data Preparation**
- Validate all data before bulk operations
- Ensure all referenced entities exist
- Prepare complete data sets
- Handle optional fields appropriately

### **Error Handling**
- Implement comprehensive error handling
- Provide meaningful error messages
- Ensure proper rollback on failures
- Log errors for debugging

### **Performance Considerations**
- Use bulk operations for large data sets
- Optimize database queries
- Consider memory usage for large operations
- Monitor operation performance

### **Data Validation**
- Validate all input data
- Ensure referential integrity
- Check business rule compliance
- Handle edge cases appropriately

## 🔗 **Related Documentation**

- **[Backend Implementation](backend-implementation.md)** - Feature system backend implementation
- **[Database Schema](database-schema.md)** - Feature system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Feature system validation rules and schemas
- **[Examples](examples.md)** - Comprehensive implementation examples
- **[Common Pitfalls](common-pitfalls.md)** - Common mistakes and how to avoid them
