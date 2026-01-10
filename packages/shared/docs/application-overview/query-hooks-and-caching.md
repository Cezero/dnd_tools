# Query Hooks and Caching Architecture

*Comprehensive documentation for the query hooks factory pattern, TanStack Query integration, cache endpoints, and client-side filtering strategies used across the D&D Tools application.*

## 📋 **Overview**

The D&D Tools application uses a factory-based pattern for generating TanStack Query hooks that provide consistent, type-safe access to backend APIs. The system includes specialized cache endpoints for lightweight data access and implements client-side filtering strategies to optimize performance and reduce API complexity.

**Source Files**:
- [QueryHooksFactory.ts](../../../apps/frontend/src/services/query/QueryHooksFactory.ts) - Factory pattern implementation
- [CacheQueryHooks.ts](../../../apps/frontend/src/services/query/CacheQueryHooks.ts) - Cache endpoint hooks
- [FeatQueryHooks.ts](../../../apps/frontend/src/services/query/FeatQueryHooks.ts) - Example query hooks implementation
- [ItemQueryHooks.ts](../../../apps/frontend/src/services/query/ItemQueryHooks.ts) - Query hooks with cache optimization

**Related Documentation**:
- [Performance Optimization](performance-optimization.md) - Caching strategies and performance patterns
- [Frontend Components](frontend-components.md) - Component usage patterns
- [Backend Implementation](../backend-implementation.md) - API endpoint details

## 🏗️ **Query Hooks Architecture**

### **Factory Pattern**

The `createQueryHooks` factory function generates TanStack Query hooks and imperative methods for any backend endpoint. This pattern ensures consistency across all API interactions and provides type safety through Zod schema validation.

**Key Features**:
- **Automatic Hook Generation**: Creates `useQuery` hooks for GET requests and `useMutation` hooks for POST/PUT/DELETE
- **Type Safety**: Uses Zod schemas for request/response validation
- **Query Key Management**: Customizable query key builders for cache management
- **Imperative Methods**: Provides imperative `fetch` and `mutate` methods for use outside React components
- **Cache Invalidation**: Automatic cache invalidation on mutations

**Factory Configuration**:
```typescript
const config = {
    path: '/items/:id',              // API endpoint path
    method: 'GET',                   // HTTP method
    paramsSchema: ItemIdParamSchema, // Path parameter validation
    responseSchema: ItemSchema,       // Response validation
    queryKey: 'items',               // Base query key
    queryKeyBuilder: (params) => {   // Custom query key builder
        return ['items', 'item', params.pathParams.id];
    }
};
```

### **Query Key Patterns**

Query keys are structured arrays that uniquely identify cached data in TanStack Query. The application uses consistent patterns for different types of queries:

**Standard Patterns**:
- **List Queries**: `['entity', 'list']` - Full list of entities (no parameters)
- **Item Queries**: `['entity', 'item', id]` - Individual entity by ID
- **Cache Queries**: `['entity-cache']` - Lightweight cache data
- **Query Queries**: `['entity', 'query']` - Parameterized queries (when needed)

**Why Null Parameters Were Removed**:
Previously, query keys included `null` or `undefined` parameters (e.g., `['items', 'list', null]`), which created duplicate cache entries with identical data. The current implementation uses simplified keys without parameters when endpoints don't accept query parameters, eliminating cache duplication and simplifying cache lookups.

**Example**:
```typescript
// Before: ['items', 'list', null] and ['items', 'list', undefined] created duplicates
// After: ['items', 'list'] - single cache entry
queryKeyBuilder: () => ['items', 'list']
```

### **Hook Types**

**useQuery Hooks**:
- Used for GET requests that fetch data
- Automatically cached by TanStack Query
- Support refetching, background updates, and stale-while-revalidate patterns
- Example: `useGetItems()`, `useGetItemById(id)`

**useMutation Hooks**:
- Used for POST, PUT, PATCH, DELETE requests that modify data
- Automatically invalidate related queries on success
- Support optimistic updates and error handling
- Example: `useCreateItem()`, `useUpdateItem(id)`

**Imperative Methods**:
- `fetch()`: Fetch data imperatively (outside React components)
- `mutate()`: Perform mutations imperatively
- `queryFn()`: Raw query function for advanced usage
- `queryKeyBuilder()`: Generate query keys programmatically

## 🔄 **Cache vs List Queries**

### **Cache Endpoints**

Cache endpoints provide lightweight data structures optimized for dropdowns, select components, and filtering operations. They contain minimal fields needed for common UI operations.

**Characteristics**:
- **Minimal Data**: Only essential fields (id, name, typeId, etc.)
- **Fast Loading**: Smaller payload size for faster API responses
- **Filtering Support**: Include fields needed for client-side filtering
- **Consistent Structure**: All cache endpoints follow the same pattern

**Cache Endpoints Available**:
- `/classes/cache` - Class cache data
- `/races/cache` - Race cache data
- `/feats/cache` - Feat cache data
- `/items/cache` - Item cache data (includes weaponCategory, armorCategory)
- `/spells/cache` - Spell cache data
- `/skills/cache` - Skill cache data
- `/deities/cache` - Deity cache data
- `/domains/cache` - Domain cache data
- `/monsters/cache` - Monster cache data
- `/sourcebooks/cache` - Sourcebook cache data

**When to Use Cache Endpoints**:
- Populating dropdown/select components
- Client-side filtering operations
- When only basic entity information is needed
- Performance-critical scenarios where payload size matters

### **List Queries**

List queries return complete entity data with all relationships and detailed information. They are used when full entity details are required.

**Characteristics**:
- **Complete Data**: All entity fields and relationships
- **Composite Data**: May include related entity information (e.g., feats with feature info)
- **Larger Payload**: More data per entity
- **Rich Information**: Suitable for detail views and complex operations

**List Endpoints Examples**:
- `/feats/with-feature-info` - Feats with feature descriptions and summaries
- `/items` - Complete item data with weapon/armor relationships
- `/spells` - Full spell data
- `/companions` - Companion data with monster names

**When to Use List Queries**:
- Displaying full entity details
- When relationships or composite data are needed
- Detail views and edit forms
- When cache data is insufficient

### **Data Structure Differences**

**Cache Schema Example (ItemCacheSchema)**:
```typescript
{
    id: number;
    name: string;
    typeId: number;
    weaponCategory: number | null;  // Extended for filtering
    armorCategory: number | null;   // Extended for filtering
}
```

**List Schema Example (ItemWithDetailsSchema)**:
```typescript
{
    id: number;
    name: string;
    description: string | null;
    typeId: number;
    cost: Decimal | null;
    weight: Decimal | null;
    weapon: WeaponSchema | null;    // Full weapon object
    armor: ArmorSchema | null;      // Full armor object
    // ... all other fields
}
```

## 🎯 **Client-Side Filtering**

### **Design Rationale**

Client-side filtering eliminates the need for server-side query endpoints when filtering can be performed efficiently on cached data. This approach reduces API complexity, leverages TanStack Query's caching capabilities, and provides faster filtering operations.

**Benefits**:
- **Reduced API Endpoints**: Fewer endpoints to maintain
- **Leverages Cache**: Uses already-cached data for filtering
- **Faster Operations**: No network latency for filtering
- **Consistent Caching**: All filtering uses the same cache source

**Trade-offs**:
- **Cache Size**: Cache must include fields needed for filtering
- **Client Memory**: All filtered data must be in memory
- **Initial Load**: Cache must be loaded before filtering

### **Implementation Pattern**

Client-side filtering follows a consistent pattern:

1. **Fetch Cache Data**: Get data from cache endpoint using `CacheQueryHooks`
2. **Filter Client-Side**: Use JavaScript array methods to filter
3. **Transform Results**: Transform to match expected format if needed

**Example: FeatureSystemService.getItemsByProficiencyType**:
```typescript
// 1. Get items from cache
const cacheData = await CacheQueryHooks.getItemsCache();

// 2. Filter by typeId and category
const filteredItems = cacheData.results.filter(item => {
    if (item.typeId !== proficiencyInfo.itemTypeId) return false;
    if (proficiencyInfo.itemTypeId === ITEM_TYPE_ENUM.Weapon) {
        return item.weaponCategory === proficiencyInfo.category;
    }
    // ... additional filtering logic
});

// 3. Transform to expected format
return {
    results: filteredItems.map(item => ({
        id: item.id,
        name: item.name,
        // ... transform as needed
    })),
    total: filteredItems.length
};
```

### **When to Extend Cache Schemas**

Cache schemas should be extended when:
- **Filtering Requirements**: Fields are needed for client-side filtering
- **Common Operations**: Fields are frequently used in filtering operations
- **Balance**: The benefit of filtering outweighs the cache size increase

**Example: ItemCacheSchema Extension**:
The `ItemCacheSchema` was extended to include `weaponCategory` and `armorCategory` to enable client-side filtering by proficiency type. This eliminated the need for the `/items/query` endpoint while maintaining filtering capability.

**Extension Pattern**:
```typescript
export const ItemCacheSchema = ItemSchema.omit({
    description: true,
    cost: true,
    weight: true,
    // ... omit heavy fields
}).extend({
    weaponCategory: z.number().int().nullable(),  // Added for filtering
    armorCategory: z.number().int().nullable(),   // Added for filtering
});
```

## ⚡ **Cache Optimization Patterns**

### **Cache-Checking in Individual Item Queries**

Individual item queries (e.g., `getItemById`, `getSpellById`) check the list cache first before making API calls. This optimization reduces API requests and improves performance.

**Implementation Pattern**:
1. Check if list cache exists for the entity type
2. Search list cache for the requested item
3. Return cached item if found
4. Fall back to API call if not in cache

**Example: ItemQueryHooks.getItemById**:
```typescript
// Custom queryFn that checks cache first
const createItemByIdQueryFn = (originalQueryFn) => {
    return async (contextOrParams) => {
        // Check list cache first
        const allItemsData = context.client.getQueryData(['items', 'list']);
        if (allItemsData?.results) {
            const item = allItemsData.results.find(i => i.id === itemId);
            if (item) return item;
        }
        // Fall back to API call
        return originalQueryFn(contextOrParams);
    };
};
```

**Benefits**:
- **Reduced API Calls**: Avoids unnecessary network requests
- **Faster Responses**: Instant responses from cache
- **Leverages Existing Data**: Uses already-loaded list data

### **List Cache as Source of Truth**

The list cache (`['entity', 'list']`) serves as the primary source of truth for entity data. Individual item queries check this cache first, and mutations invalidate it to ensure consistency.

**Cache Hierarchy**:
1. **List Cache** (`['entity', 'list']`) - Primary source, checked first
2. **Item Cache** (`['entity', 'item', id]`) - Individual items, populated from list cache
3. **Cache Endpoints** (`['entity-cache']`) - Lightweight data for filtering

**Invalidation Strategy**:
- Mutations invalidate the list cache
- List cache invalidation cascades to individual item caches
- Cache endpoints are independent and may have different invalidation strategies

## 📖 **Usage Guidelines**

### **Choosing Between Hooks and Imperative Methods**

**Use Hooks When**:
- Inside React components
- Need automatic refetching and cache management
- Want reactive updates when data changes
- Component lifecycle should manage query state

**Use Imperative Methods When**:
- Outside React components (event handlers, utilities)
- Need one-time data fetching
- In async functions that aren't React hooks
- Need more control over when queries execute

**Example Hook Usage**:
```typescript
function ItemList() {
    const { data, isLoading } = ItemQueryHooks.useGetItems();
    // Component automatically re-renders when data changes
}
```

**Example Imperative Usage**:
```typescript
async function handleExport() {
    const items = await ItemQueryHooks.getItems();
    // One-time fetch, no reactive updates
}
```

### **Choosing Between Cache and List Queries**

**Use Cache Queries When**:
- Populating dropdowns or select components
- Performing client-side filtering
- Only basic entity information is needed
- Performance is critical (smaller payload)

**Use List Queries When**:
- Displaying full entity details
- Need relationships or composite data
- Building detail views or edit forms
- Cache data is insufficient

**Example Cache Usage**:
```typescript
// For dropdown population
const { data: items } = CacheQueryHooks.useItemsCache();
const options = items?.results.map(item => ({ id: item.id, name: item.name }));
```

**Example List Usage**:
```typescript
// For detail view
const { data: item } = ItemQueryHooks.useGetItemById(itemId);
// item contains full details including weapon/armor objects
```

### **Best Practices for Filtering**

1. **Use Cache for Filtering**: Always use cache endpoints for client-side filtering
2. **Extend Cache When Needed**: Add fields to cache schemas if needed for filtering
3. **Transform Results**: Transform filtered results to match expected formats
4. **Handle Edge Cases**: Account for null/undefined values in cache data
5. **Performance**: Consider memoization for expensive filtering operations

### **Performance Considerations**

- **Cache Size**: Balance cache completeness with payload size
- **Stale Time**: Configure appropriate stale times for different data types
- **Garbage Collection**: TanStack Query automatically manages cache cleanup
- **Background Refetching**: Use stale-while-revalidate for better UX
- **Query Deduplication**: TanStack Query automatically deduplicates identical queries

## 🔄 **Migration Notes**

### **Changes from Previous Implementation**

**Removed Patterns**:
- **Null Parameters in Query Keys**: Removed `null`/`undefined` from query keys to eliminate duplicate cache entries
- **itemQueryConfig**: Removed server-side query endpoint in favor of client-side filtering
- **featListConfig**: Removed unused list configuration

**Updated Patterns**:
- **Simplified Query Keys**: List queries use `['entity', 'list']` without parameters
- **Client-Side Filtering**: Filtering operations now use cache data with client-side filtering
- **Extended Cache Schemas**: Cache schemas include fields needed for filtering (e.g., weaponCategory, armorCategory)

**Migration Path**:
1. Replace `itemQuery()` calls with `CacheQueryHooks.getItemsCache()` + client-side filtering
2. Update query key lookups from `['items', 'list', undefined]` to `['items', 'list']`
3. Extend cache schemas if additional filtering fields are needed
4. Update components to use cache endpoints for dropdown/select population

### **Removed Endpoints**

- `/items/query` - Replaced by client-side filtering of `/items/cache`
- `/feats/list` - Unused endpoint removed

### **Updated Usage Patterns**

**Before**:
```typescript
// Server-side filtering
const result = await ItemQueryHooks.itemQuery({
    queryType: 'byCategory',
    typeId: '1',
    category: '2'
});
```

**After**:
```typescript
// Client-side filtering
const cacheData = await CacheQueryHooks.getItemsCache();
const filtered = cacheData.results.filter(item => 
    item.typeId === 1 && item.weaponCategory === 2
);
```

## 🔗 **Cross-References**

- [TanStack Query Documentation](https://tanstack.com/query/latest) - Official TanStack Query documentation
- [Backend Implementation](../backend-implementation.md) - API endpoint implementation details
- [Validation Schemas](validation-schemas.md) - Zod schema validation patterns
- [Frontend Components](frontend-components.md) - Component usage examples
- [Performance Optimization](performance-optimization.md) - Caching strategies and performance patterns

## 📚 **Related Documentation**

- [Equipment System Backend Implementation](../equipment-system/backend-implementation.md) - Item service implementation
- [Feature System Frontend Components](../feature-system/frontend-components.md) - FeatureSystemService usage
- [Database Schema Patterns](database-schema.md) - Database schema patterns and conventions
