# API Design Standards

*This document establishes the conventions and standards for API design in the D&D Tools application.*

## Core API Principles

### RESTful Design Standards

The API follows RESTful principles with consistent resource-based URLs:

#### Resource Naming Conventions

- **Plural nouns**: Use plural nouns for resource collections
- **Lowercase with hyphens**: Use kebab-case for multi-word resources
- **Hierarchical structure**: Use nested paths for related resources

```typescript
// Good examples
GET /api/items              // Get all items
GET /api/items/123          // Get specific item
POST /api/items             // Create new item
PUT /api/items/123          // Update specific item
DELETE /api/items/123       // Delete specific item

GET /api/characters         // Get all characters
GET /api/characters/456     // Get specific character
GET /api/characters/456/advancements  // Get character advancements
```

#### HTTP Method Usage Patterns

- **GET**: Retrieve resources (safe, idempotent)
- **POST**: Create new resources
- **PUT**: Update existing resources (idempotent)
- **DELETE**: Remove resources (idempotent)
- **PATCH**: Partial updates (when supported)

```typescript
// Standard CRUD operations
GET    /api/items           // List all items
GET    /api/items/:id       // Get specific item
POST   /api/items           // Create new item
PUT    /api/items/:id       // Update item
DELETE /api/items/:id       // Delete item

// Query operations
GET    /api/items/query     // Search/filter items
GET    /api/spells/query    // Search/filter spells
```

### URL Structure and Hierarchy

#### Resource Hierarchy

```typescript
// Main resources
/api/items
/api/feats
/api/spells
/api/classes
/api/races
/api/skills
/api/characters

// Admin resources
/api/admin/features
/api/admin/referencetables
/api/admin/dice-configuration

// User-specific resources
/api/user/profile
/api/characters  // User's characters
```

#### Path Parameters

Use path parameters for resource identifiers:

```typescript
// Single ID parameter
GET /api/items/:id
GET /api/feats/:id
GET /api/spells/:id

// Slug-based parameters
GET /api/referencetables/:slug
GET /api/features/:slug
```

### Query Parameter Standards

#### Pagination Parameters

```typescript
// Standard pagination
GET /api/items?page=1&limit=10

// Response includes pagination metadata
{
    "total": 100,
    "results": [...],
    "page": 1,
    "limit": 10,
    "totalPages": 10
}
```

#### Filtering Parameters

```typescript
// Type-based filtering
GET /api/items?type=WEAPON&rarity=COMMON

// Search parameters
GET /api/spells?name=magic&level=1

// Multiple value filters
GET /api/feats?type=GENERAL,COMBAT
```

## Request/Response Patterns

### Request Body Schema Requirements

All requests use Zod schemas for validation:

```typescript
// Create request
POST /api/items
{
    "name": "Longsword",
    "type": "WEAPON",
    "cost": 15,
    "weight": 4
}

// Update request
PUT /api/items/123
{
    "name": "Updated Longsword",
    "cost": 20
}
```

### Response Envelope Patterns

#### Standard Response Formats

```typescript
// List response
{
    "total": 100,
    "results": [...]
}

// Single item response
{
    "id": 123,
    "name": "Longsword",
    "type": "WEAPON",
    // ... other fields
}

// Create response
{
    "id": "123",
    "message": "Item created successfully"
}

// Update response
{
    "message": "Item updated successfully"
}
```

#### Error Response Format

```typescript
// Standard error response
{
    "success": false,
    "error": "Error message"
}

// Validation error response
{
    "success": false,
    "error": [
        {
            "path": ["name"],
            "message": "Name is required"
        }
    ]
}
```

### Content Negotiation

#### Content-Type Specifications

- **Request**: `application/json` for all POST/PUT requests
- **Response**: `application/json` for all responses
- **Character encoding**: UTF-8

#### Accept Header Processing

```typescript
// Standard headers
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token>
```

## Data Validation Standards

### Schema Validation

All API endpoints use Zod schemas for validation:

```typescript
// Request validation
const CreateItemSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['WEAPON', 'ARMOR', 'GEAR']),
    cost: z.number().positive(),
    weight: z.number().nonnegative(),
});

// Response validation
const ItemResponseSchema = z.object({
    id: z.number(),
    name: z.string(),
    type: z.string(),
    cost: z.number(),
    weight: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
```

### Validation Error Response Formats

```typescript
// Zod validation error
{
    "success": false,
    "error": [
        {
            "path": ["name"],
            "message": "Name is required"
        },
        {
            "path": ["cost"],
            "message": "Cost must be a positive number"
        }
    ]
}
```

## Authentication and Authorization

### JWT Token Structure

```typescript
// Token format
Authorization: Bearer <jwt_token>

// Token payload
{
    "userId": 123,
    "email": "user@example.com",
    "isAdmin": false,
    "iat": 1234567890,
    "exp": 1234567890
}
```

### Authorization Models

#### Route Protection Levels

```typescript
// Public routes (no auth required)
GET /api/items
GET /api/feats
GET /api/spells

// User routes (auth required)
GET /api/characters
POST /api/characters
PUT /api/user/profile

// Admin routes (admin required)
POST /api/items
PUT /api/items/:id
DELETE /api/items/:id
POST /api/admin/features
```

## Performance and Optimization

### Response Optimization

#### Field Selection

```typescript
// Basic list response (minimal fields)
GET /api/items
{
    "total": 100,
    "results": [
        {
            "id": 123,
            "name": "Longsword",
            "type": "WEAPON"
        }
    ]
}

// Detailed response (all fields)
GET /api/items/123
{
    "id": 123,
    "name": "Longsword",
    "type": "WEAPON",
    "cost": 15,
    "weight": 4,
    "description": "...",
    "properties": [...],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### Pagination and Filtering

```typescript
// Efficient pagination
GET /api/items?page=1&limit=20&type=WEAPON

// Search with pagination
GET /api/spells?name=magic&level=1&page=1&limit=10
```

### Rate Limiting and Throttling

#### Rate Limit Headers

```typescript
// Rate limit headers
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

## Error Handling Standards

### HTTP Status Codes

#### Success Response Codes (2xx)

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **204 No Content**: Request successful, no content to return

#### Client Error Codes (4xx)

- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., duplicate)

#### Server Error Codes (5xx)

- **500 Internal Server Error**: Server error
- **502 Bad Gateway**: Gateway error
- **503 Service Unavailable**: Service temporarily unavailable

### Error Response Format

```typescript
// Standard error response
{
    "success": false,
    "error": "Error message"
}

// Detailed error response
{
    "success": false,
    "error": "Error message",
    "code": "VALIDATION_ERROR",
    "details": {
        "field": "name",
        "reason": "required"
    }
}
```

## API Documentation Standards

### OpenAPI/Swagger Specifications

All endpoints should be documented with:

- **Request/response schemas**
- **Authentication requirements**
- **Example requests/responses**
- **Error scenarios**
- **Rate limiting information**

### Example Request/Response Pairs

```typescript
// Create Item Example
POST /api/items
Content-Type: application/json
Authorization: Bearer <token>

{
    "name": "Longsword",
    "type": "WEAPON",
    "cost": 15,
    "weight": 4
}

Response: 201 Created
{
    "id": "123",
    "message": "Item created successfully"
}
```

## Versioning and Evolution

### API Versioning Strategy

Currently using URL-based versioning:

```typescript
// Current version (v1)
/api/items
/api/feats
/api/spells

// Future versioning (when needed)
/api/v2/items
/api/v2/feats
```

### Change Management

#### Breaking Change Policies

- **Deprecation notices**: Provide advance notice of breaking changes
- **Migration guidance**: Document migration steps
- **Backward compatibility**: Maintain compatibility when possible

#### Change Documentation

- **Changelog**: Document all API changes
- **Migration guides**: Provide step-by-step migration instructions
- **Deprecation timeline**: Clear timeline for deprecated features

---

**Related Documentation**:
- **[System Overview](../system-overview.md)** - How API design fits into the broader architecture
- **[Frontend API Integration](../frontend-components/api-integration-patterns.md)** - Frontend integration patterns
- **[Backend Patterns](../backend/backend-patterns.md)** - Backend service implementation
- **[Project Management](../project-mgmt/implementation-analysis.md)** - System implementation status
- **[Feature System](../feature-system/README.md)** - Core game engine API patterns
