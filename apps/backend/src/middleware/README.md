# Authentication Middleware

This directory contains the consolidated authentication and authorization middleware for the D&D Tools backend.

## Overview

The auth system has been consolidated to use a service-centric approach where:
- `authService` is the single source of truth for all auth operations
- Middleware uses the service instead of duplicating JWT verification logic
- Consistent types and error handling throughout the application

## Available Middleware

### `authMiddleware.ts` (Primary)

The unified authentication middleware that provides flexible auth options:

```typescript
import { createAuthMiddleware, requireAuth, requireAdmin } from '../middleware/authMiddleware';

// Option 1: Use convenience middleware
app.get('/protected', requireAuth, protectedHandler);
app.post('/admin', requireAdmin, adminHandler);

// Option 2: Create custom middleware
const requireAuthOptionalAdmin = createAuthMiddleware({ 
    requireAuth: true, 
    requireAdmin: false 
});
```

### Available Functions

- `createAuthMiddleware(options)` - Create custom auth middleware
- `requireAuth` - Require authentication only
- `requireAdmin` - Require authentication + admin privileges
- `requireAuthOptionalAdmin` - Require authentication, admin optional

### Options

```typescript
interface AuthOptions {
    requireAuth?: boolean;  // Default: true
    requireAdmin?: boolean; // Default: false
}
```

## Usage Examples

### Basic Route Protection

```typescript
import { requireAuth } from '../middleware/authMiddleware';

// Require authentication
app.get('/profile', requireAuth, profileHandler);
```

### Admin-Only Routes

```typescript
import { requireAdmin } from '../middleware/authMiddleware';

// Require admin privileges
app.post('/admin/users', requireAdmin, createUserHandler);
```

### Custom Auth Requirements

```typescript
import { createAuthMiddleware } from '../middleware/authMiddleware';

// Create custom middleware for specific requirements
const requireEditor = createAuthMiddleware({ 
    requireAuth: true, 
    requireAdmin: false 
});

app.put('/content/:id', requireEditor, updateContentHandler);
```

### Global Auth with Exceptions

```typescript
import { RequireAuthExcept } from '../middleware/requireAuthExcept';

// Apply auth to all routes except specified ones
app.use(RequireAuthExcept);
```

## User Object Structure

The middleware populates `req.user` with the following structure:

```typescript
interface AuthUser {
    id: number;
    username: string;
    isAdmin: boolean;
    preferredEditionId: number | null;
    is_admin: boolean;           // Alias for isAdmin
    preferred_edition_id: number | null; // Alias for preferredEditionId
}
```

## Error Responses

The middleware returns consistent error responses:

- **401 Unauthorized**: Missing or invalid auth header
- **403 Forbidden**: Invalid/expired token or insufficient privileges

```typescript
// Error response format
{
    error: string;
}
```

## Type Safety

The middleware extends the Express Request interface:

```typescript
declare module 'express' {
    interface Request {
        user?: AuthUser;
    }
}
```

This provides full TypeScript support for accessing user data in route handlers.

## Best Practices

1. **Use the new middleware**: All routes now use the unified auth middleware
2. **Import from index**: Use `import { requireAuth } from '../middleware'` for cleaner imports
3. **Consistent error handling**: Let the middleware handle auth errors
4. **Type safety**: Use the `req.user` property with full TypeScript support
5. **Service layer**: Use `authService` for custom auth logic in controllers

## Migration Complete

All routes have been successfully migrated to use the new unified auth middleware system. The legacy middleware files have been removed to prevent confusion and maintain a clean codebase. 