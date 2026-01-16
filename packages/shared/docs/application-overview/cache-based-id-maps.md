# Cache-Based ID Maps

*Shared pattern for entity ID lookups using TanStack Query cache instead of static data maps.*

## Overview

The cache-based ID map system provides a consistent, efficient way to perform entity name-to-ID and ID-to-name lookups across all entity types in the application. Instead of using large static data maps (like `SPELL_ID_MAP`, `SPELL_NAME_MAP`), the system derives ID maps on-the-fly from pre-populated TanStack Query caches.

## Architecture

The system consists of three main components:

1. **Thin Cache Model**: All entity caches follow a consistent pattern with essential fields only
2. **Consolidated Cache Population**: Single `CacheProvider` component pre-loads all entity caches on app startup
3. **Helper Functions**: Consistent helper functions for all entity types provide uniform lookup interface

## Thin Cache Model

All entity cache schemas follow a consistent pattern to minimize bundle size and memory usage:

### Included Fields

- `id`: Entity identifier
- `name`: Entity name (required for name-to-ID lookups)
- `abbreviation`: Short form name (if applicable)
- `editionId`: Edition identifier
- `isVisible`: Visibility flag
- Metadata fields: Type-specific metadata (e.g., `isPrestige` for classes, `abilityId` for skills)

### Excluded Fields

- Large text blocks (descriptions) - Note: `summary` is included for spells-cache to support domain spell display
- Nested components (feature progressions, relationships)
- Complex relationships (full entity objects)

### Entity Types Following This Pattern

- **Spells**: `id`, `name`, `editionId`, `baseLevel`, `isVisible`, `summary` (included for domain spell display and other use cases)
- **Monsters**: `id`, `name`, `editionId`, `isVisible`, `typeIds`
- **Classes**: `id`, `name`, `abbreviation`, `editionId`, `isPrestige`, `isVisible`
- **Races**: `id`, `name`, `abbreviation`, `editionId`, `isVisible`
- **Skills**: `id`, `name`, `abilityId`, `trainedOnly`, `isAnalog`, `isVisible`, `editionId`
- **Feats**: `id`, `name`, `typeId`, `fighterBonus`, `useSubId`, `editionId`, `isVisible`
- **Domains**: `id`, `name`, `editionId`, `isVisible`
- **Deities**: `id`, `name`, `editionId`, `isVisible`, `pantheonId`
- **Items**: `id`, `name`, `abbreviation`, `editionId`, `isVisible`, `typeId`
- **Source Books**: `id`, `name`, `abbreviation`, `editionId`, `isVisible`, `settingId`, `hasCore`, `hasClasses`, `hasSpells`, `hasRaces`, `hasDomains`, `hasDeities`, `hasItems`

## Consolidated Cache Population

All entity caches are pre-populated on app startup via the `CacheProvider` component.

**Source**: `frontend/src/providers/CacheProvider.tsx`

### Configuration

All caches use consistent configuration:
- `enabled: isAuthenticated` - Only fetch when user is authenticated
- `staleTime: Infinity` - Cache never becomes stale
- `gcTime: Infinity` - Cache never garbage collected

### Pre-Populated Caches

The following caches are pre-populated in parallel on app startup:
- `classes-cache`
- `races-cache`
- `spells-cache`
- `skills-cache`
- `feats-cache`
- `deities-cache`
- `domains-cache`
- `monsters-cache`
- `items-cache`
- `sourcebooks-cache`

### Integration

The `CacheProvider` component is integrated into the app via `App.tsx` and ensures all caches are loaded before any components attempt to use them.

## Unified Cache Interface

The cache system provides a unified interface for accessing cached entity data through the `useCacheFunctions` hook for React components and standalone functions for non-React code.

**Source**: `frontend/src/services/cache/CacheFunctions.ts`

### React Components

React components use the `useCacheFunctions` hook which provides both synchronous and asynchronous cache access functions. The hook manages the QueryClient internally, so components don't need to pass it as a parameter.

The hook provides two types of functions:

1. **Synchronous Lookups**: Direct cache reads for immediate use in render (e.g., `getSpellNameFromCache`, `getClassNameFromCache`)
2. **Asynchronous Lookups**: Functions that ensure cache is loaded before reading (e.g., `getSpellNameById`, `getClassNameById`)
3. **Complex Functions**: Filtered selections and edition-based queries (e.g., `getClassSelectByEdition`, `getFeatSelectByEdition`)

### Non-React Code

For services, utilities, and other non-React code, standalone synchronous functions are exported that use the global QueryClient instance. These functions work the same way as the hook-based functions but can be called directly without a hook.

### Available Functions

The unified interface provides consistent helper functions for all entity types:

#### Name-to-ID Lookups

- `getSpellIdByName(name: string): number | undefined`
- `getMonsterIdByName(name: string): number | undefined`
- `getFeatIdByName(name: string): number | undefined`
- `getSkillIdByName(name: string): number | undefined`
- `getClassIdByName(name: string): number | undefined`
- `getRaceIdByName(name: string): number | undefined`
- `getDomainIdByName(name: string): number | undefined`
- `getDeityIdByName(name: string): number | undefined`
- `getItemIdByName(name: string): number | undefined`
- `getSourceBookIdByName(name: string): number | undefined`

#### ID-to-Name Lookups

- `getSpellNameFromCache(id: number): string | undefined`
- `getSpellSummaryFromCache(id: number): string | null | undefined`
- `getMonsterNameFromCache(id: number): string | undefined`
- `getFeatNameFromCache(id: number): string | undefined`
- `getFeatByIdFromCache(id: number): { id: number; name: string; useSubId: boolean } | undefined`
- `getSkillNameFromCache(id: number): string | undefined`
- `getClassNameFromCache(id: number): string | undefined`
- `getRaceNameFromCache(id: number): string | undefined`
- `getRaceSizeIdFromCache(id: number): number | undefined`
- `getDomainNameFromCache(id: number): string | undefined`
- `getDeityNameFromCache(id: number): string | undefined`
- `getItemNameFromCache(id: number): string | undefined`
- `getSourceBookNameFromCache(id: number): string | undefined`
- `getSourceBookFromCache(id: number): { id: number; name: string; abbreviation: string } | undefined`

#### Complex Selection Functions

- `getClassSelectByEdition(editionId: number, includePrestige?: boolean, includeVariant?: boolean): Promise<ClassCacheEntry[]>`
- `getBaseClassSelectByEdition(editionId: number): Promise<ClassCacheEntry[]>`
- `getSpellcasterClassSelectByEdition(editionId: number): Promise<ClassCacheEntry[]>`
- `getRaceSelectByEdition(editionId: number): Promise<RaceCacheEntry[]>`
- `getFeatSelectByEdition(editionId: number): Promise<FeatCacheEntry[]>`
- `getDeitySelectByEdition(editionId: number): Promise<DeityCacheEntry[]>`
- `getDomainSelectByEdition(editionId: number): Promise<DomainCacheEntry[]>`

#### Item Selection Functions

- `getItemSelectFull()`: Returns all items from cache
- `getAllWeapons()`: Returns all weapons (filtered by typeId)
- `getAllWeaponsByCategory(categoryId: number)`: Returns weapons filtered by weaponCategory
- `getAllArmor()`: Returns all armor (filtered by typeId)
- `getAllArmorByCategory(categoryId: number)`: Returns armor filtered by armorCategory

### Behavior

- **Case-Insensitive Matching**: All name lookups use case-insensitive matching (convert to lowercase)
- **Synchronous Access**: Since caches are pre-populated by CacheProvider, synchronous lookups read directly from cache
- **Asynchronous Functions**: Some functions use `fetchQuery` to ensure cache is loaded, useful for edge cases
- **Undefined Returns**: Functions return `undefined` if cache not populated or entity not found
- **Unified Interface**: Single import provides all cache access functions for both React and non-React code

## Usage Patterns

### In React Components

React components use the `useCacheFunctions` hook to access cache functions. The hook provides both synchronous and asynchronous functions:

```tsx
import { useCacheFunctions } from '@/services/cache';

function MyComponent() {
  const { getSpellNameFromCache, getClassNameById } = useCacheFunctions();
  
  // Synchronous lookup (for immediate use in render)
  const spellName = getSpellNameFromCache(spellId);
  
  // Async lookup (for async operations)
  useEffect(() => {
    const loadClassName = async () => {
      const classData = await getClassNameById(classId);
      // Use classData...
    };
    loadClassName();
  }, [classId, getClassNameById]);
}
```

### In Non-React Code

Services, utilities, and other non-React code use standalone exported functions that work with the global QueryClient:

```tsx
import { getMonsterIdByName, getSkillNameFromCache } from '@/services/cache';

function createEntityLink(type: string, rawValue: string) {
  const id = getMonsterIdByName(rawValue);
  // Use id for entity link...
}

export function formatSkillName(skillId: number): string {
  return getSkillNameFromCache(skillId) || 'Unknown Skill';
}
```

### Item Selection Example

Item selection functions provide convenient access to weapons and armor from the cache:

```tsx
import { useCacheFunctions } from '@/services/cache';
import { WEAPON_CATEGORY_ENUM } from '@shared/static-data';

function WeaponSelector() {
  const { getAllWeapons, getAllWeaponsByCategory } = useCacheFunctions();
  
  // Get all weapons
  const allWeapons = getAllWeapons();
  
  // Get weapons by category
  const simpleWeapons = getAllWeaponsByCategory(WEAPON_CATEGORY_ENUM.Simple);
  const martialWeapons = getAllWeaponsByCategory(WEAPON_CATEGORY_ENUM.Martial);
  
  // Use weapons in component...
}
```

### In Markdown Processors

Markdown processors use standalone functions for directive processing:

**Source**: `frontend/src/plugins/customProcessors.ts`

The markdown processor uses standalone cache functions to resolve entity names to IDs when processing entity directives like `[spell:fireball]` or `[monster:goblin]`.

## Benefits

1. **Bundle Size Reduction**: Removing static maps (SPELL_ID_MAP, SPELL_NAME_MAP, SKILL_MAP, SOURCE_BOOK_MAP, etc.) significantly reduces bundle size
2. **Dynamic Updates**: Cache data can be updated from the backend without code changes
3. **Consistency**: All entity types use the same lookup pattern
4. **Performance**: Synchronous cache access is fast and efficient
5. **Memory Efficiency**: Thin cache model minimizes memory footprint
6. **Type Safety**: TypeScript ensures type safety across all helper functions

## Migration from Static Maps

Components previously using static maps should migrate to cache-based lookups:

### Before (Static Map)

```tsx
import { SPELL_NAME_MAP } from '@shared/static-data';

const spellName = SPELL_NAME_MAP[spellId]?.name || 'Unknown';
```

### After (Cache-Based)

```tsx
import { useCacheFunctions } from '@/services/cache';

function MyComponent() {
  const { getSpellNameFromCache } = useCacheFunctions();
  const spellName = getSpellNameFromCache(spellId) || 'Unknown';
}
```

## Integration Points

### Markdown Processing

The markdown processing pipeline uses cache-based lookups for entity directive processing:

- `[spell:name]` → `getSpellIdByName()`
- `[monster:name]` → `getMonsterIdByName()`
- `[feat:name]` → `getFeatIdByName()`
- And so on for all entity types

**Source**: `frontend/src/plugins/customProcessors.ts`

### Entity Tooltips

Entity tooltip system uses cache-based lookups for entity name resolution in tooltips.

**Source**: `frontend/src/components/entity-tooltip/`

### Component Rendering

Components throughout the application use cache-based lookups for entity name display and filtering.

## Future Extensibility

To add cache-based lookups for a new entity type:

1. **Create Cache Schema**: Follow thin cache model pattern in `packages/shared/schema/src/`
2. **Create Backend Cache Endpoint**: Add `/entity-type/cache` endpoint following existing pattern
3. **Add to CacheProvider**: Add cache to `CacheProvider.tsx` pre-population list
4. **Add Helper Functions**: Add entity-specific synchronous and asynchronous helper functions to `CacheFunctions.ts` following the existing pattern
5. **Export Functions**: Ensure both hook-based (for React) and standalone (for non-React) versions are exported
6. **Update Components**: Replace static map usage with unified cache interface

## Lightweight Schema Pattern Integration

The cache-based ID map system integrates with the lightweight schema pattern for API responses:

**Design Decision**: Backend endpoints return only IDs for related entities, not nested objects with names/summaries.

**Benefits**:
- **Reduced Payload Size**: Endpoint responses are significantly smaller
- **Consistent Resolution**: All entity names resolved from pre-populated caches
- **Better Performance**: Smaller payloads reduce network transfer time
- **Single Source of Truth**: Entity caches provide consistent data

**Example**: A domain endpoint returns `domainSpells` with only `spellId`, not nested spell objects. The frontend resolves spell names and summaries from the `spells-cache` using helper functions like `getSpellNameFromCache()` and `getSpellSummaryFromCache()`.

**Related Documentation**: [Lightweight Schema Pattern](validation-schemas.md#lightweight-response-schemas) for schema design guidelines

## Related Documentation

- [Entity Tooltip System](entity-tooltips.md) - Entity tooltip system uses cache-based lookups
- [Query Hooks and Caching](query-hooks-and-caching.md) - TanStack Query caching patterns
- [Performance Optimization](performance-optimization.md) - Performance benefits of cache-based lookups
- [Monster System Frontend Components](../monster-system/frontend-components.md) - Example usage in monster components
- [Lightweight Schema Pattern](validation-schemas.md#lightweight-response-schemas) - Schema design pattern for lightweight responses
