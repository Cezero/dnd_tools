# Validation Schema Patterns

*Common validation patterns, conventions, and strategies used across all systems in the D&D Tools application.*

## 📋 **Overview**

The validation schema patterns document outlines the common validation principles, conventions, and strategies used across all validation schemas in the D&D Tools application. These patterns ensure consistency, type safety, and data integrity across all systems while providing a solid foundation for runtime validation and error handling.

**Source File**: `packages/shared/schema/src/`

## 🏗️ **Core Validation Principles**

### **Layered Validation Architecture**

The validation system follows a layered architecture approach:

**Schema Layer**: Zod schemas for runtime validation and type safety
**Type Layer**: TypeScript types generated from schemas for compile-time safety
**Error Layer**: Comprehensive error handling and user feedback
**Integration Layer**: API integration and frontend form validation

**Benefits**:
- **Type Safety**: Full TypeScript integration with runtime validation
- **Error Prevention**: Catches validation errors before they reach business logic
- **User Experience**: Clear, actionable error messages for users
- **Maintainability**: Centralized validation logic and error handling

### **Schema Hierarchy Pattern**

The validation system uses a hierarchical schema structure:

**Base Schemas**: Core validation for individual entities
**Creation Schemas**: Validation for creating new entities (omitting read-only fields)
**Update Schemas**: Validation for updating existing entities (making fields optional)
**Response Schemas**: Validation for API responses (including computed fields)

**Benefits**:
- **Consistent Structure**: Standardized approach across all systems
- **Flexible Operations**: Support for different types of operations
- **Type Safety**: Appropriate types for each operation type
- **Error Handling**: Context-specific error messages

### **Static Data Integration**

The validation system integrates with static data for comprehensive validation:

**Enum Validation**: Validates against static data enums for type safety
**Reference Validation**: Validates foreign key references against existing data
**Range Validation**: Validates numeric ranges against business rules
**Format Validation**: Validates string formats and patterns

**Benefits**:
- **Data Integrity**: Ensures data consistency across systems
- **Business Rules**: Enforces business logic at the validation layer
- **Error Prevention**: Prevents invalid data from entering the system
- **Type Safety**: Full integration with static data types

## 📊 **Common Schema Patterns**

### **Identity and Audit Fields**

All primary entities include standard identity and audit field validation:

**Identity Fields**:
- **`id`**: Required positive integer for unique identification
- **`name`**: Required string, 1-100 characters, trimmed of whitespace
- **`description`**: Optional string, up to 10,000 characters, nullable

**Audit Fields**:
- **`isVisible`**: Boolean, defaults to true
- **`editionId`**: Optional positive integer for multi-edition support
- **`createdAt`**: Auto-generated timestamp (read-only)
- **`updatedAt`**: Auto-updated timestamp (read-only)

**Usage Pattern**:
```typescript
const BaseEntitySchema = z.object({
  id: z.number().int().positive('ID must be a positive integer'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').trim(),
  description: z.string().max(10000, 'Description must be less than 10000 characters').nullable().optional(),
  isVisible: z.boolean().default(true),
  editionId: z.number().int().positive('Edition ID must be a positive integer').nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});
```

### **Lightweight Response Schemas**

The system follows a lightweight schema pattern for API responses to reduce payload size and ensure consistent data resolution:

**Design Decision**: Return only IDs for related entities, not nested objects with names/summaries.

**Rationale**:
- **Reduced Payload Size**: Endpoint responses are significantly smaller by excluding nested entity data
- **Consistent Data Resolution**: All entity lookups use the same cache-based mechanism
- **Better Performance**: Smaller payloads reduce network transfer time and memory usage
- **Single Source of Truth**: Entity caches provide consistent data across the application
- **Maintainability**: Changes to entity data only require cache updates, not endpoint response changes

**Pattern**:

**Before (Nested Data)**:
```typescript
{
  id: 1,
  name: "Domain Name",
  domainSpells: [
    {
      spellId: 5,
      spellLevel: 1,
      spell: {
        id: 5,
        name: "Spell Name",
        summary: "Spell summary text"
      }
    }
  ]
}
```

**After (Lightweight with IDs)**:
```typescript
{
  id: 1,
  name: "Domain Name",
  domainSpells: [
    {
      spellId: 5,
      spellLevel: 1
    }
  ]
}
```

**Frontend Resolution**:
```typescript
const spellName = getSpellNameFromCache(queryClient, domainSpell.spellId);
const spellSummary = getSpellSummaryFromCache(queryClient, domainSpell.spellId);
```

**When to Use IDs vs Nested Objects**:

- **Use IDs**: For related entities that have pre-populated caches (classes, races, spells, domains, deities, items, monsters, sourcebooks)
- **Use Nested Objects**: Only when the related entity data is not available in caches or is specific to the relationship context

**Related Documentation**: [Cache-Based ID Maps](cache-based-id-maps.md) for cache lookup implementation

### **Schema Variation Pattern**

The system uses consistent schema variations for different operations:

**Base Schema**: Complete entity validation with all fields
**Summary Schema**: Simplified schema for list views (omits complex nested data)
**Create Schema**: Schema for creation operations (omits read-only fields)
**Update Schema**: Schema for modification operations (makes fields optional)

**Usage Pattern**:
```typescript
// Base schema with all fields
const BaseEntitySchema = z.object({ /* all fields */ });

// Summary schema for list views
const EntitySummarySchema = BaseEntitySchema.omit({ 
  complexField: true, 
  nestedData: true 
}).extend({ id: z.number() });

// Create schema for new entities
const CreateEntitySchema = BaseEntitySchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Update schema for modifications
const UpdateEntitySchema = CreateEntitySchema.partial();
```

### **Nested Schema Pattern**

Complex entities use nested schemas for related data:

**Nested Creation**: Uses create-specific schemas for nested data
**Nested Updates**: Supports updating nested data independently
**Nested Validation**: Validates nested data with appropriate constraints
**Nested Error Handling**: Provides context-specific error messages

**Usage Pattern**:
```typescript
const EntityWithNestedSchema = z.object({
  // Core entity fields
  id: z.number().int().positive(),
  name: z.string().min(1).max(100).trim(),
  
  // Nested data using appropriate schemas
  nestedItems: z.array(CreateNestedItemSchema).optional(),
  relatedData: z.array(CreateRelatedDataSchema).optional()
});
```

### **Enum Reference Pattern**

Database fields reference enums for type safety and validation:

**Enum Validation**: Validates against static data enums
**Type Safety**: Ensures type consistency across systems
**Error Messages**: Clear error messages for invalid enum values
**Integration**: Full integration with static data layer

**Usage Pattern**:
```typescript
const EntityWithEnumSchema = z.object({
  // Enum field validation
  enumField: z.number().int().positive('Enum field must be a positive integer'),
  
  // Reference validation
  referenceId: z.number().int().positive('Reference ID must be a positive integer')
});
```

## 🔗 **Error Handling Patterns**

### **Validation Error Messages**

The validation system provides comprehensive error messages:

**Field-Specific Messages**: Clear, actionable error messages for each field
**Context-Specific Guidance**: Suggestions for fixing validation issues
**User-Friendly Language**: Messages appropriate for end users
**Business Rule Explanations**: Explanations of business logic violations

**Error Message Strategy**:
```typescript
const FieldValidationSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  
  value: z.number()
    .int('Value must be an integer')
    .positive('Value must be positive')
    .max(1000, 'Value must be less than 1000')
});
```

### **Error Response Format**

Validation errors are returned in a structured format:

**Field-Specific Arrays**: Error arrays for each field
**Nested Object Handling**: Proper handling of nested object errors
**Consistent Formatting**: Standardized error message format
**Type-Safe Responses**: Type-safe error response structures

**Error Response Pattern**:
```typescript
interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

interface ValidationErrorResponse {
  errors: ValidationError[];
  message: string;
  status: number;
}
```

### **Error Recovery**

The validation system provides clear guidance for error resolution:

**Common Error Scenarios**: Guidance for typical validation failures
**Fix Suggestions**: Specific suggestions for resolving errors
**Context Information**: Relevant context about validation failures
**Related Field References**: References to related fields and dependencies

## 🔧 **Integration Patterns**

### **API Integration**

The validation schemas integrate with the backend API:

**Request Validation**: All API requests are validated against appropriate schemas
**Response Validation**: API responses are validated for consistency
**Parameter Validation**: URL parameters are validated using parameter schemas
**Type Safety**: Generated TypeScript types ensure compile-time safety

**API Integration Pattern**:
```typescript
// Parameter validation
const EntityIdParamSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, 'Invalid entity ID')
});

// Request validation
const CreateEntityRequest = CreateEntitySchema;

// Response validation
const EntityResponse = EntitySchema;
```

### **Frontend Integration**

The validation schemas support frontend operations:

**Form Validation**: Real-time validation in user interfaces
**Type Safety**: TypeScript types for frontend components
**Error Display**: User-friendly error messages from validation
**Data Consistency**: Ensures frontend and backend data consistency

**Frontend Integration Pattern**:
```typescript
// Form validation
const formSchema = CreateEntitySchema;

// Type generation
type CreateEntityForm = z.infer<typeof formSchema>;

// Error handling
const handleValidationError = (error: z.ZodError) => {
  const fieldErrors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
  // Display errors to user
};
```

### **Database Integration**

The validation schemas work with the database layer:

**Data Integrity**: Ensures data meets database constraints
**Type Consistency**: Maintains consistency between validation and database types
**Relationship Validation**: Validates foreign key relationships
**Constraint Enforcement**: Enforces business rules before database operations

## 📊 **Performance Patterns**

### **Validation Performance**

The validation system is optimized for performance:

**Efficient Validation**: Fast validation algorithms for complex schemas
**Lazy Evaluation**: Validation only when needed
**Caching**: Cached validation results where appropriate
**Batch Validation**: Efficient validation of multiple items

### **Memory Management**

The validation system manages memory efficiently:

**Schema Reuse**: Reuse schemas across multiple validations
**Garbage Collection**: Proper cleanup of validation objects
**Memory Pooling**: Pool validation objects for reuse
**Efficient Parsing**: Optimized parsing of validation rules

## 🔧 **Schema Evolution**

### **Backward Compatibility**

The validation system supports schema evolution:

**Additive Changes**: New fields added as optional
**Default Values**: Sensible defaults for new fields
**Version Management**: Schema versioning for breaking changes
**Migration Support**: Tools for schema migration

### **Schema Maintenance**

The schemas are designed for easy maintenance:

**DRY Principles**: Uses `.extend()` and `.omit()` to avoid duplication
**Shared Schemas**: Leverages schemas from other systems
**Consistent Patterns**: Follows established validation patterns
**Clear Documentation**: Documents complex validation rules

## 📋 **Best Practices**

### **Schema Design**

**Consistent Patterns**: Use consistent validation patterns across all schemas
**Clear Naming**: Descriptive schema and field names
**Proper Documentation**: Document complex validation rules
**Testing**: Comprehensive testing of validation logic

### **Integration Patterns**

**Modular Design**: Keep schemas modular and focused
**Reusable Components**: Create reusable validation components
**Clear Interfaces**: Define clear interfaces between schemas
**Error Handling**: Consistent error handling across schemas

### **Performance Optimization**

**Efficient Validation**: Optimize validation for common use cases
**Caching Strategy**: Cache validation results where appropriate
**Batch Operations**: Support batch validation for multiple items
**Memory Management**: Efficient memory usage for validation objects

## Summary

The validation schema patterns ensure:

- **Type Safety**: Full TypeScript integration with runtime validation
- **Data Integrity**: Comprehensive validation of all data entering the system
- **Error Handling**: Clear, actionable error messages for users
- **Performance**: Optimized validation for efficient operations
- **Maintainability**: Consistent patterns and reusable components
- **Extensibility**: Support for schema evolution and new features

These patterns provide a solid foundation for all validation schemas in the D&D Tools application while ensuring consistency, performance, and maintainability across all systems.
