# Backend Patterns

*This document outlines the standard patterns and best practices for backend development in the D&D Tools application.*

## Core Architecture Patterns

### Service Layer Organization

The backend follows a clear separation of concerns with a dedicated service layer:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic and database operations
- **Types**: Define service interfaces for type safety
- **Routes**: Define API endpoints and middleware

#### Service Layer Structure

```typescript
// types.ts - Service interface definition
export interface ItemService {
    getAllItems: () => Promise<GetAllItemsResponse>;
    getItemById: (params: ItemIdParamRequest) => Promise<ItemWithDetails | null>;
    createItem: (data: CreateItemRequest) => Promise<CreateResponse>;
    updateItem: (params: ItemIdParamRequest, data: UpdateItemRequest) => Promise<UpdateResponse>;
    deleteItem: (params: ItemIdParamRequest) => Promise<UpdateResponse>;
}

// itemService.ts - Business logic implementation
export const itemService: ItemService = {
    async getAllItems(): Promise<GetAllItemsResponse> {
        const items = await prisma.item.findMany({
            orderBy: { name: 'asc' }
        });
        return {
            total: items.length,
            results: items,
        };
    },
    // ... other methods
};

// itemController.ts - HTTP request handling
export async function GetAllItems(req: ValidatedNoInput<GetAllItemsResponse>, res: Response) {
    const items = await itemService.getAllItems();
    res.json(items);
}
```

### Controller Patterns

Controllers handle HTTP requests and delegate business logic to services:

#### Standard CRUD Controllers

```typescript
import { Response } from 'express';
import { ValidatedParamsT, ValidatedParamsBodyT, ValidatedNoInput, ValidatedBodyT } from '@/util/validated-types';

// Get all items
export async function GetAllItems(req: ValidatedNoInput<GetAllItemsResponse>, res: Response) {
    const items = await itemService.getAllItems();
    res.json(items);
}

// Get single item by ID
export async function GetItemById(req: ValidatedParamsT<ItemIdParamRequest, ItemWithDetails>, res: Response) {
    const item = await itemService.getItemById(req.params);
    if (!item) {
        res.status(404).json({ error: 'Item not found' });
        return;
    }
    res.json(item);
}

// Create new item
export async function CreateItem(req: ValidatedBodyT<CreateItemRequest, CreateResponse>, res: Response) {
    const result = await itemService.createItem(req.body);
    res.status(201).json(result);
}

// Update existing item
export async function UpdateItem(req: ValidatedParamsBodyT<ItemIdParamRequest, UpdateItemRequest, UpdateResponse>, res: Response) {
    const result = await itemService.updateItem(req.params, req.body);
    res.json(result);
}

// Delete item
export async function DeleteItem(req: ValidatedParamsT<ItemIdParamRequest, UpdateResponse>, res: Response) {
    const result = await itemService.deleteItem(req.params);
    res.json(result);
}
```

#### User-Aware Controllers

Controllers that require user authentication:

```typescript
export async function GetAllCharacters(req: ValidatedNoInput<GetAllCharactersResponse>, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    const result = await characterService.getAllCharacters(userId);
    res.json(result);
}
```

### Database Interaction Patterns

#### Prisma ORM Usage

All database operations use Prisma with consistent patterns:

```typescript
import { PrismaClient } from '@shared/prisma-client';

const prisma = new PrismaClient();

// Find many with ordering
const items = await prisma.item.findMany({
    orderBy: { name: 'asc' }
});

// Find unique by ID
const item = await prisma.item.findUnique({
    where: { id: id.id }
});

// Create with data
const item = await prisma.item.create({
    data: {
        ...data,
    },
});

// Update with where clause
await prisma.item.update({
    where: { id: id.id },
    data
});

// Delete with where clause
await prisma.item.delete({
    where: { id: id.id }
});
```

#### Complex Queries

For complex queries with relationships:

```typescript
const character = await prisma.userCharacter.findUnique({
    where: { id: characterId },
    include: {
        race: true,
        class: true,
        attributes: true,
        advancements: {
            include: {
                skills: true,
                feats: true,
                spells: true,
            }
        },
        spellPreparations: {
            include: {
                metamagic: true,
            }
        },
        items: {
            include: {
                properties: true,
            }
        },
    }
});
```

## Validation and Error Handling

### Zod Schema Integration

All requests and responses are validated using Zod schemas:

```typescript
import { ValidatedParamsT, ValidatedBodyT } from '@/util/validated-types';
import { CreateItemRequest, UpdateItemRequest } from '@shared/schema';

// Request validation is handled by middleware
export async function CreateItem(req: ValidatedBodyT<CreateItemRequest, CreateResponse>, res: Response) {
    // req.body is already validated and typed
    const result = await itemService.createItem(req.body);
    res.status(201).json(result);
}
```

### Error Handling Middleware

Centralized error handling with specific error types:

```typescript
// errorMiddleware.ts
export function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void {
    console.error('Error occurred:', error);

    // Handle Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error as PrismaClientKnownRequestError;

        switch (prismaError.code) {
            case 'P2002':
                res.status(409).json({
                    success: false,
                    error: 'A record with this unique field already exists',
                });
                return;
            case 'P2025':
                res.status(404).json({
                    success: false,
                    error: 'Record not found',
                });
                return;
            case 'P2003':
                res.status(400).json({
                    success: false,
                    error: 'Foreign key constraint violation',
                });
                return;
            default:
                res.status(500).json({
                    success: false,
                    error: 'Database operation failed',
                });
                return;
        }
    }

    // Handle validation errors
    if (error instanceof ZodError) {
        res.status(400).json({
            success: false,
            error: error.errors,
        });
        return;
    }

    // Handle custom application errors
    if (error instanceof BaseError) {
        res.status(error.status).json({
            success: false,
            error: error.message,
        });
        return;
    }

    // Default error response
    res.status(500).json({
        success: false,
        error: 'Internal server error',
    });
}
```

## Authentication and Authorization

### JWT Authentication

The backend uses JWT-based authentication with middleware:

```typescript
// authMiddleware.ts
export function createAuthMiddleware(options: AuthOptions = {}): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            if (options.requireAuth) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }
            return next();
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId }
            });

            if (!user) {
                if (options.requireAuth) {
                    res.status(401).json({ error: 'Invalid token' });
                    return;
                }
                return next();
            }

            req.user = user;

            if (options.requireAdmin && !user.isAdmin) {
                res.status(403).json({ error: 'Admin privileges required' });
                return;
            }

            next();
        } catch (error) {
            if (options.requireAuth) {
                res.status(401).json({ error: 'Invalid token' });
                return;
            }
            next();
        }
    };
}

// Convenience middleware
export const requireAuth = createAuthMiddleware({ requireAuth: true });
export const requireAdmin = createAuthMiddleware({ requireAuth: true, requireAdmin: true });
```

### Route Protection

Routes are protected using authentication middleware:

```typescript
// itemRoutes.ts
import { requireAuth, requireAdmin } from '@/middleware/authMiddleware';

export const itemRoutes = buildValidatedRouter({
    'GET /items': {
        handler: GetAllItems,
        // Public route - no auth required
    },
    'GET /items/:id': {
        handler: GetItemById,
        // Public route - no auth required
    },
    'POST /items': {
        handler: CreateItem,
        middleware: [requireAdmin], // Admin only
    },
    'PUT /items/:id': {
        handler: UpdateItem,
        middleware: [requireAdmin], // Admin only
    },
    'DELETE /items/:id': {
        handler: DeleteItem,
        middleware: [requireAdmin], // Admin only
    },
});
```

## Route Organization

### buildValidatedRouter Pattern

Routes are organized using the `buildValidatedRouter` function:

```typescript
import { buildValidatedRouter } from '@/util/buildValidatedRouter';

export const itemRoutes = buildValidatedRouter({
    'GET /items': {
        handler: GetAllItems,
    },
    'GET /items/:id': {
        handler: GetItemById,
        paramsSchema: ItemIdParamSchema,
    },
    'POST /items': {
        handler: CreateItem,
        bodySchema: CreateItemSchema,
        middleware: [requireAdmin],
    },
    'PUT /items/:id': {
        handler: UpdateItem,
        paramsSchema: ItemIdParamSchema,
        bodySchema: UpdateItemSchema,
        middleware: [requireAdmin],
    },
    'DELETE /items/:id': {
        handler: DeleteItem,
        paramsSchema: ItemIdParamSchema,
        middleware: [requireAdmin],
    },
    'GET /items/query': {
        handler: GetItemQuery,
        querySchema: ItemQuerySchema,
    },
});
```

### Route Registration

Routes are registered in the main application:

```typescript
// routes/index.ts
import { itemRoutes } from '@/features/item/itemRoutes';
import { characterRoutes } from '@/features/character/characterRoutes';
// ... other route imports

export function registerRoutes(app: Express) {
    app.use('/api', itemRoutes);
    app.use('/api', characterRoutes);
    // ... register other routes
}
```

## Response Patterns

### Standard Response Formats

All API responses follow consistent patterns:

```typescript
// Success responses
{
    "total": 100,
    "results": [...]
}

// Create responses
{
    "id": "123",
    "message": "Item created successfully"
}

// Update responses
{
    "message": "Item updated successfully"
}

// Error responses
{
    "success": false,
    "error": "Error message"
}
```

### Pagination Support

List endpoints support pagination:

```typescript
async getAllItems(query: ItemQueryRequest): Promise<GetAllItemsResponse> {
    const { page = 1, limit = 10, ...filters } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        prisma.item.findMany({
            where: filters,
            skip,
            take: limit,
            orderBy: { name: 'asc' }
        }),
        prisma.item.count({ where: filters })
    ]);

    return {
        total,
        results: items,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}
```

## Best Practices

### Code Organization

- **Feature-based structure**: Organize by feature domain
- **Service layer separation**: Keep business logic in services
- **Type safety**: Use TypeScript interfaces for all services
- **Consistent naming**: Follow consistent naming patterns

### Error Handling

- **Centralized error handling**: Use error middleware
- **Specific error types**: Handle different error scenarios
- **User-friendly messages**: Provide clear error messages
- **Proper HTTP status codes**: Use appropriate status codes

### Performance

- **Efficient queries**: Use Prisma's query optimization
- **Batch operations**: Group related database operations
- **Connection pooling**: Let Prisma handle connection management
- **Indexing**: Ensure proper database indexes

### Security

- **Input validation**: Validate all inputs with Zod
- **Authentication**: Protect routes appropriately
- **Authorization**: Check user permissions
- **SQL injection prevention**: Use Prisma's parameterized queries

---

**Related Documentation**:
- **[System Overview](../system-overview.md)** - How backend services fit into the broader architecture
- **[Frontend API Integration](../frontend-components/api-integration-patterns.md)** - Frontend integration patterns
- **[API Design Standards](../api/api-design-standards.md)** - API conventions and standards
- **[Project Management](../project-mgmt/implementation-analysis.md)** - System implementation status
- **[Feature System](../feature-system/README.md)** - Core game engine integration
