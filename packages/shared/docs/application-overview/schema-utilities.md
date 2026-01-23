# Schema Utilities Documentation

This document provides comprehensive documentation for all schema utility functions available in `packages/shared/schema/src/common.ts`. These utilities help reduce code duplication and ensure consistent validation patterns across the codebase.

## Overview

The schema utilities are organized into two main categories:
1. **Common Validations** - Reusable validation patterns for common field types
2. **Parameter Utilities** - Utilities for handling URL path and query parameters

All utilities are exported from `packages/shared/schema/src/common.ts` and can be imported as:

```typescript
import { commonValidations, numericParam, optionalBooleanParam, optionalIntegerParam, optionalStringParam } from './common.js';
```

## Common Validations

### String Validations

#### `name(maxLength?: number)`

Validates a name field with configurable max length. Ensures the name is required, trimmed, and within the specified length.

**Parameters:**
- `maxLength` (optional): Maximum length of the name (default: 100)

**Returns:** Zod string schema with validation

**Example:**
```typescript
export const MySchema = z.object({
    name: commonValidations.name(), // max 100 chars
    shortName: commonValidations.name(50), // max 50 chars
});
```

**When to use:** For any required name field that needs trimming and length validation.

#### `description(maxLength?: number)`

Validates an optional description field with configurable max length.

**Parameters:**
- `maxLength` (optional): Maximum length of the description (default: 2000)

**Returns:** Zod optional string schema with validation

**Example:**
```typescript
export const MySchema = z.object({
    description: commonValidations.description(), // max 2000 chars, optional
    notes: commonValidations.description(5000), // max 5000 chars, optional
});
```

**When to use:** For any optional description or notes field.

#### `slug(maxLength?: number)`

Validates a slug field (URL-friendly identifier). Ensures lowercase letters, numbers, and hyphens only.

**Parameters:**
- `maxLength` (optional): Maximum length of the slug (default: 100)

**Returns:** Zod string schema with validation

**Example:**
```typescript
export const MySchema = z.object({
    slug: commonValidations.slug(),
});
```

**When to use:** For URL-friendly identifiers (e.g., feature slugs, category slugs).

#### `email`

Validates an email address. Ensures valid email format and max length of 255 characters.

**Returns:** Zod string schema with email validation

**Example:**
```typescript
export const RegisterSchema = z.object({
    email: commonValidations.email(),
});
```

**When to use:** For email address fields.

#### `password`

Validates a password with security requirements. Requires: minimum 8 characters, at least one lowercase, one uppercase, and one number.

**Returns:** Zod string schema with password validation

**Example:**
```typescript
export const RegisterSchema = z.object({
    password: commonValidations.password(),
});
```

**When to use:** For password fields in authentication schemas.

#### `username`

Validates a username. Requires: 3-50 characters, letters, numbers, and underscores only.

**Returns:** Zod string schema with username validation

**Example:**
```typescript
export const RegisterSchema = z.object({
    username: commonValidations.username(),
});
```

**When to use:** For username fields in authentication schemas.

### Number Validations

#### `positiveInt(fieldName?: string)`

Validates a positive integer (typically used for IDs).

**Parameters:**
- `fieldName` (optional): Name of the field for error messages (default: 'ID')

**Returns:** Zod number schema with positive integer validation

**Example:**
```typescript
export const MySchema = z.object({
    id: commonValidations.positiveInt('User ID'),
    userId: commonValidations.positiveInt(), // Uses default 'ID'
});
```

**When to use:** For ID fields and any field that must be a positive integer.

#### `nonNegativeInt(fieldName?: string, max?: number)`

Validates a non-negative integer with optional max value.

**Parameters:**
- `fieldName` (optional): Name of the field for error messages (default: 'Value')
- `max` (optional): Maximum allowed value (default: 1000)

**Returns:** Zod number schema with non-negative integer validation

**Example:**
```typescript
export const MySchema = z.object({
    age: commonValidations.nonNegativeInt('Age', 1000),
    quantity: commonValidations.nonNegativeInt('Quantity', 10000),
});
```

**When to use:** For fields that can be zero or positive (e.g., quantities, counts, ages).

### Query Parameter Schemas

#### `paginationQuery`

Pagination query schema for list endpoints. Converts string query parameters to integers with defaults.

**Returns:** Zod object schema for pagination query parameters

**Example:**
```typescript
export const MyListQuerySchema = commonValidations.paginationQuery.extend({
    filter: z.string().optional(),
});
```

**When to use:** For list endpoints that support pagination.

#### `authHeader`

Validates the Authorization header with Bearer token format.

**Returns:** Zod object schema for authorization header

**Example:**
```typescript
export const AuthHeaderSchema = commonValidations.authHeader;
```

**When to use:** For routes that require Bearer token authentication.

## Parameter Utilities

### Path Parameters

#### `numericParam()`

Accepts both string and number, transforms to number. Use this for path parameters (URL segments like `/users/:id`) that may come from URL strings or be passed as numbers from the frontend.

**Returns:** Zod schema that accepts string or number and transforms to number

**Example:**
```typescript
export const UserIdParamSchema = z.object({
    id: numericParam(),
});
```

**When to use:** 
- For path parameters in route definitions
- When the frontend may pass numbers directly (not just strings from URLs)

**Note:** This is different from `optionalIntegerParam()` which is for query parameters.

### Query Parameters

#### `optionalBooleanParam()`

Converts a query param like "true"/"false" to a boolean, or undefined if missing. Use this for optional boolean query parameters in URL query strings (e.g., `?includeDetails=true`).

**Returns:** Zod schema that accepts string and transforms to boolean or undefined

**Example:**
```typescript
export const MyQuerySchema = z.object({
    includeDetails: optionalBooleanParam(),
    isVisible: optionalBooleanParam(),
});
```

**When to use:** 
- For boolean query parameters in URL query strings
- When the parameter is optional

**Note:** Query parameters always come as strings from URLs, so this utility handles the string-to-boolean conversion.

#### `optionalIntegerParam()`

Converts a query param like "123" to an integer, or undefined if missing. Use this for optional integer query parameters in URL query strings (e.g., `?page=1&limit=10`).

**Returns:** Zod schema that accepts string and transforms to integer or undefined

**Example:**
```typescript
export const MyQuerySchema = z.object({
    page: optionalIntegerParam().default(1),
    limit: optionalIntegerParam().default(10),
    typeId: optionalIntegerParam(),
});
```

**When to use:** 
- For integer query parameters in URL query strings
- When the parameter is optional
- Can be chained with `.default()` for default values

**Note:** Query parameters always come as strings from URLs, so this utility handles the string-to-integer conversion.

#### `optionalStringParam()`

Converts a query param like "abc" to a string, or undefined if missing. Use this for optional string query parameters in URL query strings (e.g., `?search=term`).

**Returns:** Zod schema that accepts string and returns string or undefined

**Example:**
```typescript
export const MyQuerySchema = z.object({
    search: optionalStringParam(),
    filter: optionalStringParam(),
});
```

**When to use:** 
- For simple string query parameters in URL query strings
- When the parameter is optional
- For parameters that don't need custom transformation

**Note:** For query parameters that need custom transforms (like JSON parsing), use `z.string().optional().transform()` directly.

## Key Differences

### Path Parameters vs Query Parameters

- **Path Parameters** (`numericParam()`): Used in URL segments like `/users/:id`. Can accept both strings (from URLs) and numbers (from frontend).
- **Query Parameters** (`optionalIntegerParam()`, `optionalBooleanParam()`, `optionalStringParam()`): Used in URL query strings like `?page=1&limit=10`. Always come as strings from URLs and need transformation.

### When to Use Utilities vs Inline Validation

**Use utilities when:**
- The validation pattern matches a common utility exactly
- You want consistent error messages across the codebase
- The utility provides the exact validation you need

**Use inline validation when:**
- You need custom validation logic not covered by utilities
- You need domain-specific error messages that provide additional context
- The validation pattern is unique to a specific schema

## Migration Guide

### Migrating from Inline Validation to Utilities

**Before:**
```typescript
export const MySchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').trim(),
    description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
    userId: z.number().int().positive('User ID must be a positive integer'),
});
```

**After:**
```typescript
import { commonValidations } from './common.js';

export const MySchema = z.object({
    name: commonValidations.name(),
    description: commonValidations.description(),
    userId: commonValidations.positiveInt('User ID'),
});
```

### Migrating Query Parameters

**Before:**
```typescript
export const MyQuerySchema = z.object({
    includeDetails: z.string().optional().transform((val) => val === 'true'),
    page: z.string().optional().transform(val => val ? parseInt(val) : undefined),
});
```

**After:**
```typescript
import { optionalBooleanParam, optionalIntegerParam } from './common.js';

export const MyQuerySchema = z.object({
    includeDetails: optionalBooleanParam(),
    page: optionalIntegerParam().default(1),
});
```

## Best Practices

1. **Always use utilities for common patterns** - Reduces duplication and ensures consistency
2. **Use appropriate field names** - When using `positiveInt()` or `nonNegativeInt()`, provide descriptive field names for better error messages
3. **Chain defaults when needed** - Query parameter utilities can be chained with `.default()` for default values
4. **Preserve custom error messages when needed** - If a field needs domain-specific error context, consider keeping inline validation
5. **Import from common.js** - All utilities are exported from `./common.js`, use consistent imports

## Schema Composition Patterns

This section covers best practices for composing schemas using `.extend()`, `.omit()`, and schema reuse to follow DRY principles.

### Using `.extend()` and `.omit()`

Zod provides powerful methods for creating related schemas without duplication:

- **`.extend()`**: Adds new fields to an existing schema
- **`.omit()`**: Removes specified fields from a schema
- **`.partial()`**: Makes all fields optional (use with caution - see below)

### Common Schema Patterns

#### Pattern 1: Base Schema → Full Schema → Create Schema → Update Schema

The most common pattern for entity schemas:

```typescript
// 1. Base schema (common fields without id)
export const BaseItemSchema = z.object({
    name: commonValidations.name(),
    description: commonValidations.description(10000).nullable(),
    typeId: commonValidations.positiveInt('Item type ID'),
});

// 2. Full schema (extends base with id)
export const ItemSchema = BaseItemSchema.extend({
    id: commonValidations.positiveInt('Item ID'),
});

// 3. Create schema (omits auto-generated fields)
export const CreateItemSchema = ItemSchema.omit({ id: true });

// 4. Update schema (makes create schema partial)
export const UpdateItemSchema = CreateItemSchema.partial();
```

**When to use:**
- For entities that have a clear base structure
- When id and other auto-generated fields should be excluded from create operations
- When update operations should allow partial updates

#### Pattern 2: Creating Summary Schemas

Summary schemas omit heavy fields for list views:

```typescript
// Full schema with all fields
export const ClassSchema = BaseClassSchema.extend({
    id: commonValidations.positiveInt('Class ID'),
    features: z.array(FeatureProgressionSchema).nullable(),
    spellcastingProgression: z.array(SpellcastingProgressionSchema).nullable(),
});

// Summary schema (omits heavy nested data)
export const ClassSummarySchema = ClassSchema.omit({
    features: true,
    spellcastingProgression: true,
});
```

**When to use:**
- For list endpoints that don't need full entity data
- When nested arrays or large fields should be excluded
- For cache schemas that need minimal data

#### Pattern 3: Reusing Schemas Across Files

When the same structure appears in multiple files, extract it to a shared schema:

```typescript
// In character.ts
export const ClassSkillSchema = z.object({
    skillId: commonValidations.positiveInt(),
    skillSubId: z.number().int().nullable(),
});

export const SkillBonusSchema = z.object({
    skillId: commonValidations.positiveInt(),
    skillSubId: z.number().int().nullable(),
    bonus: z.number(),
    source: z.string(),
});

// In spell.ts - reuse the schema
import { ClassSkillSchema, SkillBonusSchema } from './character.js';

export const MySchema = z.object({
    classSkills: z.array(ClassSkillSchema),
    skillBonuses: z.array(SkillBonusSchema),
});
```

**When to use:**
- When identical structures appear in multiple files
- For nested objects that are used in multiple contexts
- To ensure consistency across related schemas

#### Pattern 4: Reusing Complete Schemas

When a schema needs to be included as an optional field in another schema:

```typescript
// In spell.ts
import { ResolvedCharacterResultSchema } from './character.js';

export const AddSpellKnownResponseSchema = z.object({
    message: z.string(),
    resolvedCharacter: ResolvedCharacterResultSchema.optional(),
});
```

**When to use:**
- When a complete schema should be included as a field
- To avoid duplicating complex nested structures
- When the same data structure is returned in different contexts

#### Pattern 5: Creating Minimal Summary Schemas

For lightweight references in nested structures:

```typescript
// Minimal schema for feature entity references
export const SpellSummarySchema = z.object({
    id: commonValidations.positiveInt('Spell ID'),
    name: commonValidations.name(),
});

// Use in FeatureEntitySchema instead of inline object
export const FeatureEntitySchema = z.object({
    // ... other fields
    spell: SpellSummarySchema.optional().nullable(),
});
```

**When to use:**
- When only id and name are needed from a related entity
- For nested objects in feature entities
- To avoid importing full schemas when only minimal data is needed

### Avoiding Inline `z.object()`

**❌ Bad: Duplicating structure**
```typescript
export const SchemaA = z.object({
    nested: z.object({
        id: commonValidations.positiveInt(),
        name: commonValidations.name(),
    }),
});

export const SchemaB = z.object({
    nested: z.object({
        id: commonValidations.positiveInt(),
        name: commonValidations.name(),
    }), // Duplicate structure!
});
```

**✅ Good: Extract and reuse**
```typescript
// Extract to shared schema
export const NestedSchema = z.object({
    id: commonValidations.positiveInt(),
    name: commonValidations.name(),
});

export const SchemaA = z.object({
    nested: NestedSchema,
});

export const SchemaB = z.object({
    nested: NestedSchema, // Reused!
});
```

### When to Create New Schemas vs Reuse

**Create a new schema when:**
- The structure is unique to a specific use case
- The fields serve a different purpose even if similar
- The schema represents a distinct domain concept

**Reuse an existing schema when:**
- The structure is identical or nearly identical
- The purpose is the same (e.g., both represent the same entity)
- You can use `.omit()` or `.extend()` to create the needed variation

**Extract to a shared schema when:**
- The same structure appears in 2+ files
- The structure represents a common concept (e.g., ClassSkill, SkillBonus)
- Consistency across files is important

### DRY Principles Checklist

When creating or reviewing schemas, ask:

1. ✅ Does this schema duplicate another schema? → Use `.extend()` or `.omit()`
2. ✅ Does this nested object duplicate an existing schema? → Reference the existing schema
3. ✅ Does this structure appear in multiple files? → Extract to a shared schema
4. ✅ Can I create a "Create" schema using `.omit()`? → Use `.omit({ id: true })` pattern
5. ✅ Can I create a "Summary" schema using `.omit()`? → Use `.omit({ heavyFields: true })`
6. ✅ Am I using inline `z.object()` when a schema exists? → Reference the existing schema

### Common Mistakes to Avoid

**❌ Using `.partial()` on required fields**
```typescript
// Bad: Makes id optional when it should always be required
export const UpdateSchema = BaseSchema.partial();
```

**✅ Use `.omit()` for create schemas, `.partial()` only on create schemas for updates**
```typescript
// Good: Create schema omits id, update makes create partial
export const CreateSchema = BaseSchema.omit({ id: true });
export const UpdateSchema = CreateSchema.partial();
```

**❌ Duplicating nested structures**
```typescript
// Bad: Inline object duplicates existing schema
export const MySchema = z.object({
    companion: z.object({
        id: commonValidations.positiveInt(),
        type: commonValidations.positiveInt(),
        monsterId: commonValidations.positiveInt(),
    }),
});
```

**✅ Reference existing schema**
```typescript
// Good: Reuses existing schema
export const MySchema = z.object({
    companion: CompanionSchema.omit({ id: true }),
});
```

## Related Documentation

- [Validation Schemas](../application-overview/validation-schemas.md) - Overview of validation patterns
- [Backend Implementation](../application-overview/backend-implementation.md) - How schemas are used in routes
