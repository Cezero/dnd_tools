# Frontend API Patterns

*Comprehensive guide to using the typed API system for type-safe, validated HTTP requests in the D&D Tools frontend.*

## Overview

The D&D Tools frontend uses a two-layer API system:
- **`Api`** - Internal, low-level implementation function (DO NOT USE DIRECTLY)
- **`typedApi`** - Public API wrapper that provides type safety and validation (ALWAYS USE THIS)

All API calls should use `typedApi` to ensure:
- **Type Safety**: Full TypeScript type inference from Zod schemas
- **Runtime Validation**: Automatic request and response validation
- **Consistency**: Standardized way to define API endpoints
- **Better DX**: Cleaner, more maintainable code

## API Function: Internal vs Public

### `Api` Function (Internal - DO NOT USE)

The `Api` function is the low-level implementation that handles HTTP requests. It's marked as `@internal` and should **never** be called directly from application code.

**Why it exists**: It provides the underlying implementation that `typedApi` uses. It handles:
- Token management
- Request/response formatting
- Error handling
- Path parameter substitution
- Query parameter encoding

**When to use**: Never. Always use `typedApi` instead.

### `typedApi` Function (Public - ALWAYS USE)

The `typedApi` function is a factory that creates type-safe API functions with automatic Zod validation. This is the **only** way to make API calls in the frontend.

**Benefits**:
- Type-safe request and response types inferred from Zod schemas
- Automatic runtime validation of requests and responses
- Consistent API surface across all endpoints
- Better error messages when validation fails
- IDE autocomplete and type checking

## Usage Patterns

### Basic GET Request

```typescript
import { typedApi } from '@/services/Api';
import { UsersResponseSchema } from '@shared/schema';

const getUsers = typedApi({
    path: '/users',
    method: 'GET',
    responseSchema: UsersResponseSchema,
});

// Usage
const users = await getUsers();
```

### POST/PUT/PATCH with Body

```typescript
import { typedApi } from '@/services/Api';
import {
    CreateUserSchema,
    UserSchema,
} from '@shared/schema';

const createUser = typedApi<typeof CreateUserSchema, typeof UserSchema>({
    path: '/users',
    method: 'POST',
    requestSchema: CreateUserSchema,
    responseSchema: UserSchema,
});

// Usage
const newUser = await createUser({
    name: 'John Doe',
    email: 'john@example.com',
});
```

### Path Parameters

Path parameters are specified using `:paramName` in the path and validated using a `paramsSchema`:

```typescript
import { typedApi } from '@/services/Api';
import {
    UserIdParamSchema,
    UserSchema,
} from '@shared/schema';

const getUserById = typedApi<undefined, typeof UserSchema, typeof UserIdParamSchema>({
    path: '/users/:id',
    method: 'GET',
    paramsSchema: UserIdParamSchema,
    responseSchema: UserSchema,
});

// Usage - params are passed as the second argument
const user = await getUserById(undefined, { id: '123' });
```

**Note**: Path parameters are always strings in the URL, so the schema should validate strings. The `typedApi` function will convert them to the appropriate type if needed.

### Query Parameters

For GET and DELETE requests, the `requestSchema` is used for query parameters:

```typescript
import { typedApi } from '@/services/Api';
import {
    SearchQuerySchema,
    UsersResponseSchema,
} from '@shared/schema';

const searchUsers = typedApi<typeof SearchQuerySchema, typeof UsersResponseSchema>({
    path: '/users/search',
    method: 'GET',
    requestSchema: SearchQuerySchema, // Used as query params for GET
    responseSchema: UsersResponseSchema,
});

// Usage
const results = await searchUsers({
    query: 'john',
    limit: 10,
    offset: 0,
});
```

### DELETE Requests

DELETE requests can use either query parameters or a body, depending on the backend API:

```typescript
// DELETE with query parameters
const clearEntity = typedApi<typeof DraftRefQuerySchema, typeof DraftSaveResponseSchema>({
    path: '/sessions/me/editing',
    method: 'DELETE',
    requestSchema: DraftRefQuerySchema, // Used as query params
    responseSchema: DraftSaveResponseSchema,
});

// Usage
await clearEntity({ entityType: 'feature', entityId: '123' });

// DELETE with path parameters
const deleteUser = typedApi<undefined, typeof DraftSaveResponseSchema, typeof UserIdParamSchema>({
    path: '/users/:id',
    method: 'DELETE',
    paramsSchema: UserIdParamSchema,
    responseSchema: DraftSaveResponseSchema,
});

// Usage
await deleteUser(undefined, { id: '123' });
```

### Methods with Additional Logic

When an API method needs to perform additional logic after the API call (e.g., updating local state, calling other APIs), wrap the `typedApi` call in a function:

```typescript
const saveApi = typedApi<undefined, typeof SaveFeatureStateResponseSchema, typeof FeatureResolutionFeatureIdParamSchema>({
    path: '/features/:featureId/save',
    method: 'POST',
    paramsSchema: FeatureResolutionFeatureIdParamSchema,
    responseSchema: SaveFeatureStateResponseSchema,
});

export const FeatureResolutionApi = {
    save: async (featureId: number | 'new'): Promise<SaveFeatureStateResponse> => {
        const result = await saveApi(undefined, { featureId: String(featureId) });
        
        // Additional logic after API call
        if (featureId !== 'new') {
            await UserSessionApi.clearEditingEntity('feature', featureId).catch((err) => {
                console.warn('Failed to clear user session:', err);
            });
        }
        
        return result;
    },
};
```

## Type Safety

### How Zod Schemas Provide Type Safety

`typedApi` uses TypeScript's type inference to extract types from Zod schemas:

```typescript
// Request type is inferred from requestSchema
type RequestType = TRequestSchema extends ZodType ? z.infer<TRequestSchema> : undefined;

// Response type is inferred from responseSchema
type ResponseType = z.infer<TResponseSchema>;

// Params type is inferred from paramsSchema
type ParamsType = TParamsSchema extends ZodType ? z.infer<TParamsSchema> : undefined;
```

This means:
- **Compile-time safety**: TypeScript knows the exact shape of requests and responses
- **Runtime validation**: Zod validates the data at runtime, catching type mismatches
- **IDE support**: Autocomplete and type checking work perfectly

### Example: Full Type Safety

```typescript
import { typedApi } from '@/services/Api';
import {
    CreateCharacterSchema,
    CharacterSchema,
    CharacterIdParamSchema,
} from '@shared/schema';

// TypeScript knows:
// - createCharacter takes CreateCharacterSchema type
// - Returns Promise<CharacterSchema>
// - getCharacterById takes no body, returns CharacterSchema, needs CharacterIdParamSchema params
const createCharacter = typedApi<typeof CreateCharacterSchema, typeof CharacterSchema>({
    path: '/characters',
    method: 'POST',
    requestSchema: CreateCharacterSchema,
    responseSchema: CharacterSchema,
});

const getCharacterById = typedApi<undefined, typeof CharacterSchema, typeof CharacterIdParamSchema>({
    path: '/characters/:id',
    method: 'GET',
    paramsSchema: CharacterIdParamSchema,
    responseSchema: CharacterSchema,
});

// TypeScript enforces correct usage
const character = await createCharacter({
    name: 'Aragorn',
    level: 5,
    // TypeScript error if missing required fields or wrong types
});

const fetched = await getCharacterById(undefined, { id: '123' });
// TypeScript knows fetched is CharacterSchema type
```

## Best Practices

### Always Use `typedApi` for New APIs

When creating a new API endpoint:
1. Define Zod schemas in `packages/shared/schema/src/`
2. Use `typedApi` to create the API function
3. Export the function from your API file

**Never** use `Api` directly - it bypasses type safety and validation.

### Never Use `Api` Directly

The `Api` function is marked as `@internal` for a reason. Using it directly:
- Bypasses type safety
- Requires manual validation
- Makes code harder to maintain
- Increases risk of bugs

**Exception**: There is no valid exception. Always use `typedApi`.

### Handling Special Cases

#### Special Parameter Values (e.g., `'new'`)

When an endpoint accepts special string values like `'new'` for creating new entities:

```typescript
// Schema handles both 'new' and numeric IDs
export const FeatureResolutionFeatureIdParamSchema = z.object({
    featureId: z.string().refine(
        (val) => val === 'new' || /^\d+$/.test(val),
        { message: 'Feature ID must be "new" or a number' }
    ),
});

// Usage - convert number to string for path params
const result = await startEditingApi(undefined, { featureId: String(featureId) });
```

#### Maintaining Existing API Signatures

When converting existing APIs that have custom signatures, wrap `typedApi` to maintain backward compatibility:

```typescript
// Before: updateValue(fullPath: string, value: unknown)
// After: Still supports the same signature, but uses typedApi internally
const updateValueApi = typedApi<typeof UpdateStateValueBodySchema, typeof UpdateStateValueResponseSchema>({
    path: '/state/update-value',
    method: 'PUT',
    requestSchema: UpdateStateValueBodySchema,
    responseSchema: UpdateStateValueResponseSchema,
});

export const StateManagementApi = {
    updateValue: async (fullPath: string, value: unknown): Promise<UpdateStateValueResponse> => {
        return updateValueApi({ path: fullPath, value });
    },
};
```

## Migration Guide

### Converting Existing `Api` Calls to `typedApi`

1. **Identify the endpoint pattern**:
   - Path: `/users/:id` → use `paramsSchema`
   - Body: `{ name, email }` → use `requestSchema`
   - Response: `UserSchema` → use `responseSchema`

2. **Create or find Zod schemas**:
   - Check `packages/shared/schema/src/` for existing schemas
   - Create new schemas if needed

3. **Convert the call**:
   ```typescript
   // Before
   const result = await Api<MyResponse>(
       `/my-endpoint/${id}`,
       {
           method: 'POST',
           body: { data },
           requestSchema: MyRequestSchema,
           responseSchema: MyResponseSchema,
       }
   );
   
   // After
   const myApi = typedApi<typeof MyRequestSchema, typeof MyResponseSchema, typeof MyIdParamSchema>({
       path: '/my-endpoint/:id',
       method: 'POST',
       requestSchema: MyRequestSchema,
       paramsSchema: MyIdParamSchema,
       responseSchema: MyResponseSchema,
   });
   
   const result = await myApi({ data }, { id: String(id) });
   ```

4. **Handle special cases**:
   - If the method has additional logic, wrap it in a function
   - If the signature needs to stay the same, create a wrapper
   - Convert path parameters to strings

### Common Conversion Patterns

#### Simple GET Request
```typescript
// Before
const data = await Api<MyResponse>('/endpoint', { method: 'GET' });

// After
const getData = typedApi({
    path: '/endpoint',
    method: 'GET',
    responseSchema: MyResponseSchema,
});
const data = await getData();
```

#### POST with Body
```typescript
// Before
const result = await Api<MyResponse>('/endpoint', {
    method: 'POST',
    body: requestData,
    requestSchema: MyRequestSchema,
    responseSchema: MyResponseSchema,
});

// After
const createData = typedApi<typeof MyRequestSchema, typeof MyResponseSchema>({
    path: '/endpoint',
    method: 'POST',
    requestSchema: MyRequestSchema,
    responseSchema: MyResponseSchema,
});
const result = await createData(requestData);
```

#### Path Parameters
```typescript
// Before
const result = await Api<MyResponse>(`/endpoint/${id}`, {
    method: 'GET',
    responseSchema: MyResponseSchema,
});

// After
const getData = typedApi<undefined, typeof MyResponseSchema, typeof MyIdParamSchema>({
    path: '/endpoint/:id',
    method: 'GET',
    paramsSchema: MyIdParamSchema,
    responseSchema: MyResponseSchema,
});
const result = await getData(undefined, { id: String(id) });
```

## Examples from the Codebase

### StateManagementApi

```typescript
import { typedApi } from '@/services/Api';
import {
    UpdateStateValueBodySchema,
    UpdateStateValueResponseSchema,
} from '@shared/schema';

const updateValueApi = typedApi<typeof UpdateStateValueBodySchema, typeof UpdateStateValueResponseSchema>({
    path: '/state/update-value',
    method: 'PUT',
    requestSchema: UpdateStateValueBodySchema,
    responseSchema: UpdateStateValueResponseSchema,
});

export const StateManagementApi = {
    updateValue: async (fullPath: string, value: unknown): Promise<UpdateStateValueResponse> => {
        return updateValueApi({ path: fullPath, value });
    },
};
```

### FeatureResolutionApi

```typescript
import { typedApi } from '@/services/Api';
import {
    FeatureResolutionFeatureIdParamSchema,
    SaveFeatureStateResponseSchema,
} from '@shared/schema';

const saveApi = typedApi<undefined, typeof SaveFeatureStateResponseSchema, typeof FeatureResolutionFeatureIdParamSchema>({
    path: '/features/:featureId/save',
    method: 'POST',
    paramsSchema: FeatureResolutionFeatureIdParamSchema,
    responseSchema: SaveFeatureStateResponseSchema,
});

export const FeatureResolutionApi = {
    save: async (featureId: number | 'new'): Promise<SaveFeatureStateResponse> => {
        const result = await saveApi(undefined, { featureId: String(featureId) });
        
        // Additional logic
        if (featureId !== 'new') {
            await UserSessionApi.clearEditingEntity('feature', featureId);
        }
        
        return result;
    },
};
```

### UserSessionApi

```typescript
import { typedApi } from '@/services/Api';
import {
    DraftRefRequestSchema,
    DraftRefQuerySchema,
    DraftSaveResponseSchema,
    UserSessionResponseSchema,
} from '@shared/schema';

const getMySessionApi = typedApi<undefined, typeof UserSessionResponseSchema>({
    path: '/sessions/me',
    method: 'GET',
    responseSchema: UserSessionResponseSchema,
});

const clearEditingEntityApi = typedApi<typeof DraftRefQuerySchema, typeof DraftSaveResponseSchema>({
    path: '/sessions/me/editing',
    method: 'DELETE',
    requestSchema: DraftRefQuerySchema, // Used as query params for DELETE
    responseSchema: DraftSaveResponseSchema,
});

export const UserSessionApi = {
    getMySession: async (): Promise<UserSessionResponse> => {
        return getMySessionApi();
    },
    
    clearEditingEntity: async (entityType: string, entityId: number): Promise<{ success: boolean }> => {
        return clearEditingEntityApi({ entityType, entityId: String(entityId) });
    },
};
```

## Related Documentation

- [System Architecture](system-architecture.md) - Overall system design
- [Frontend Patterns](frontend-patterns.md) - Other frontend patterns and conventions
- [Validation Schemas](validation-schemas.md) - Zod schema patterns and best practices
- [Backend Implementation](backend-implementation.md) - Backend API patterns

## Source Files

- **API Implementation**: `apps/frontend/src/services/Api.ts`
- **Example APIs**:
  - `apps/frontend/src/components/state-management/StateManagementApi.ts`
  - `apps/frontend/src/components/feature-system/FeatureResolutionApi.ts`
  - `apps/frontend/src/services/api/UserSessionApi.ts`
  - `apps/frontend/src/features/character/CharacterResolutionApi.ts`
