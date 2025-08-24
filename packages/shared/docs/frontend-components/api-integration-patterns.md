# API Integration Patterns

*This document outlines the standard patterns and best practices for frontend API integration in the D&D Tools application.*

## Core API Integration Architecture

### typedApi Service Pattern

The frontend uses a comprehensive type-safe API client system built around the `typedApi` function. This system provides:

- **Full TypeScript Integration**: Compile-time type safety for all API calls
- **Zod Schema Validation**: Runtime validation of request and response data
- **Consistent Error Handling**: Standardized error responses and handling
- **Path Parameter Support**: Type-safe URL parameter substitution
- **Query Parameter Support**: Type-safe query string generation

#### Basic typedApi Usage

```typescript
import { typedApi } from '@/services/Api';
import { CreateItemSchema, ItemWithDetailsSchema } from '@shared/schema';

const ItemService = {
    getItemById: typedApi<undefined, typeof ItemWithDetailsSchema, typeof ItemIdParamSchema>({
        path: '/items/:id',
        method: 'GET',
        paramsSchema: ItemIdParamSchema,
        responseSchema: ItemWithDetailsSchema,
    }),

    createItem: typedApi<typeof CreateItemSchema, typeof CreateResponseSchema>({
        path: '/items',
        method: 'POST',
        requestSchema: CreateItemSchema,
        responseSchema: CreateResponseSchema,
    }),
};
```

#### Service Layer Organization

Each feature has a dedicated service file that provides type-safe API calls:

- **`ItemService.ts`** - Item management operations
- **`FeatService.ts`** - Feat management operations  
- **`CharacterService.ts`** - Character management operations
- **`SpellService.ts`** - Spell management operations
- **`ClassService.ts`** - Class management operations
- **`RaceService.ts`** - Race management operations
- **`SkillService.ts`** - Skill management operations

### Service Implementation Patterns

#### Standard CRUD Operations

All services follow a consistent pattern for CRUD operations:

```typescript
export const FeatureService = {
    // Get all items
    getItems: typedApi({
        path: '/items',
        method: 'GET',
        responseSchema: GetAllItemsResponseSchema,
    }),

    // Get single item by ID
    getItemById: typedApi<undefined, typeof ItemSchema, typeof ItemIdParamSchema>({
        path: '/items/:id',
        method: 'GET',
        paramsSchema: ItemIdParamSchema,
        responseSchema: ItemSchema,
    }),

    // Create new item
    createItem: typedApi<typeof CreateItemSchema, typeof CreateResponseSchema>({
        path: '/items',
        method: 'POST',
        requestSchema: CreateItemSchema,
        responseSchema: CreateResponseSchema,
    }),

    // Update existing item
    updateItem: typedApi<typeof UpdateItemSchema, typeof UpdateResponseSchema, typeof ItemIdParamSchema>({
        path: '/items/:id',
        method: 'PUT',
        requestSchema: UpdateItemSchema,
        paramsSchema: ItemIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    // Delete item
    deleteItem: typedApi<undefined, typeof UpdateResponseSchema, typeof ItemIdParamSchema>({
        path: '/items/:id',
        method: 'DELETE',
        paramsSchema: ItemIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
};
```

#### Path Parameter Support

Services support type-safe path parameters:

```typescript
// Usage examples:
const item = await ItemService.getItemById(undefined, { id: 123 });
const updatedItem = await ItemService.updateItem(
    { name: "Updated Item" }, 
    { id: 123 }
);
await ItemService.deleteItem(undefined, { id: 123 });
```

#### Query Parameter Support

Services support type-safe query parameters:

```typescript
const spells = await SpellService.getSpells({ page: 1, limit: 10 });
const items = await ItemService.itemQuery({ type: "WEAPON", rarity: "COMMON" });
```

## Error Handling Patterns

### Standardized Error Responses

The API system provides consistent error handling:

```typescript
try {
    const result = await ItemService.getItemById(undefined, { id: 123 });
    // Handle success
} catch (error) {
    // Error is already formatted as user-friendly message
    console.error('API Error:', error);
    // Handle error in UI
}
```

### Authentication Error Handling

The system automatically handles authentication errors:

- **401 Unauthorized**: Automatically redirects to login page
- **Token Management**: Automatically includes JWT tokens in requests
- **Token Refresh**: Handles token expiration gracefully

## Integration with Components

### Service Usage in Components

Components use services through standard patterns:

```typescript
import { ItemService } from '@/features/item/ItemService';

function ItemList() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadItems() {
            try {
                const result = await ItemService.getItems();
                setItems(result.results);
            } catch (error) {
                console.error('Failed to load items:', error);
            } finally {
                setLoading(false);
            }
        }
        loadItems();
    }, []);

    // Component rendering...
}
```

### Form Integration

Services integrate seamlessly with the ValidatedForm system:

```typescript
import { ItemService } from '@/features/item/ItemService';
import { useValidatedForm } from '@/components/forms/ValidatedForm';

function ItemEdit({ itemId }) {
    const { formData, setFormData, errors, validate } = useValidatedForm(
        UpdateItemSchema,
        initialData
    );

    const handleSubmit = async () => {
        if (await validate()) {
            try {
                await ItemService.updateItem(formData, { id: itemId });
                // Handle success
            } catch (error) {
                // Handle error
            }
        }
    };

    // Form rendering...
}
```

## Best Practices

### Type Safety

- **Always use typed schemas**: Import schemas from `@shared/schema`
- **Leverage TypeScript**: Let the compiler catch type errors
- **Validate at runtime**: Use Zod schemas for runtime validation

### Error Handling

- **Catch and handle errors**: Always wrap API calls in try-catch
- **Provide user feedback**: Show loading states and error messages
- **Graceful degradation**: Handle network failures gracefully

### Performance

- **Minimize API calls**: Use caching where appropriate
- **Optimistic updates**: Update UI immediately, sync with server
- **Batch operations**: Group related API calls when possible

### Code Organization

- **Feature-based services**: Organize services by feature domain
- **Consistent naming**: Use consistent naming patterns across services
- **Documentation**: Include usage examples in service comments

## Common Patterns

### List with Pagination

```typescript
const [items, setItems] = useState([]);
const [pagination, setPagination] = useState({ page: 1, limit: 10 });

const loadItems = async () => {
    const result = await ItemService.getItems(pagination);
    setItems(result.results);
    setPagination(prev => ({ ...prev, total: result.total }));
};
```

### Search and Filter

```typescript
const [filters, setFilters] = useState({});
const [searchResults, setSearchResults] = useState([]);

const performSearch = async () => {
    const result = await ItemService.itemQuery(filters);
    setSearchResults(result.results);
};
```

### Real-time Updates

```typescript
const [item, setItem] = useState(null);

const updateItem = async (updates) => {
    const result = await ItemService.updateItem(updates, { id: item.id });
    setItem(result); // Optimistic update
};
```

---

**Related Documentation**:
- See `validated-form-system.md` for form integration patterns
- Review `generic-list-system.md` for list component integration
- Check `../backend/` for corresponding backend API patterns
