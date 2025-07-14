# Spell Feature

This feature provides comprehensive spell management functionality with advanced filtering capabilities.

## Components

### SpellList
The main spell list component that displays spells in a sortable, filterable table.

### SpellColumns
Defines the column configuration for the spell table with generic filter functions.

### SpellService
Handles API communication for spell data.

## Filter Functions

The spell feature uses generic filter functions from the `@/components/generic-list/filterFunctions` module. These functions handle the complex nested data structures returned from the backend and can be reused across different features.

### Generic Filter Functions

1. **`createArrayIdFilter(idField: string)`** - For columns with nested arrays of objects:
   - `createArrayIdFilter('schoolId')` - Filters by school IDs in the `schoolIds` array
   - `createArrayIdFilter('descriptorId')` - Filters by descriptor IDs in the `descriptorIds` array
   - `createArrayIdFilter('componentId')` - Filters by component IDs in the `componentIds` array
   - `createArrayIdFilter('sourceBookId')` - Filters by source book IDs in the `sourceBookInfo` array
   - `createArrayIdFilter('classId')` - Filters by class IDs in the `levelMapping` array

2. **`createEqualsFilter()`** - For exact value matching:
   - Used for the `baseLevel` column

3. **`createContainsFilter()`** - For case-insensitive text search:
   - Used for the `name` column

### Multi-Select Logic

The filter functions support both OR and AND logic for multi-select filters:

- **OR Logic (default)**: Shows spells that match ANY of the selected values
- **AND Logic**: Shows spells that match ALL of the selected values

### Filter Value Structure

The filter functions handle the custom filter structure used by the GenericList component:

```typescript
// Single value filter
{ id: 'columnId', value: 123 }

// Multi-select filter with OR logic
{ 
  id: 'columnId', 
  value: { 
    values: [1, 2, 3], 
    logicType: 'or' 
  } 
}

// Multi-select filter with AND logic
{ 
  id: 'columnId', 
  value: { 
    values: [1, 2, 3], 
    logicType: 'and' 
  } 
}
```

## Column Configuration

Each column in `SpellColumns.ts` is configured with:

- `filterFn`: The generic filter function to use
- `meta.filterType`: The type of filter UI to display
- `meta.options`: Available options for select filters
- `meta.placeholder`: Placeholder text for text inputs

### Example Column Configuration

```typescript
{
    accessorKey: 'schoolIds',
    header: 'School',
    enableColumnFilter: true,
    filterFn: createArrayIdFilter('schoolId'),
    cell: info => {
        const schools = info.getValue() as { schoolId: number }[];
        const labels = SpellSchoolNameList(schools.map(s => s.schoolId));
        return labels;
    },
    meta: {
        filterType: FilterType.MULTI_SELECT,
        options: SPELL_SCHOOL_SELECT_LIST,
    },
}
```

## Data Structure

The filter functions expect the following data structure from the backend:

```typescript
interface SpellInQueryResponse {
    name: string;
    baseLevel: number;
    schoolIds: { schoolId: number }[];
    descriptorIds: { descriptorId: number }[];
    componentIds: { componentId: number }[];
    sourceBookInfo: { sourceBookId: number, pageNumber: number }[];
    levelMapping: { classId: number, level: number }[];
    // ... other fields
}
```

## Usage

To use the spell list with filtering:

```tsx
import { SpellList } from '@/features/spell/SpellList';

function App() {
    return <SpellList />;
}
```

The component will automatically handle:
- Loading spell data from the API
- Applying filters based on user selections
- Persisting filter state in localStorage
- Providing a responsive, accessible interface

## Reusability

The generic filter functions can be used in other features with similar data structures:

```typescript
// For any feature with array-based relationships
import { createArrayIdFilter, createEqualsFilter, createContainsFilter } from '@/components/generic-list/filterFunctions';

// Example for a different feature
const MY_COLUMNS = [
    {
        accessorKey: 'tags',
        filterFn: createArrayIdFilter('tagId'),
        // ...
    },
    {
        accessorKey: 'status',
        filterFn: createEqualsFilter(),
        // ...
    },
    {
        accessorKey: 'description',
        filterFn: createContainsFilter(),
        // ...
    }
];
```

## Future Enhancements

1. **Advanced Search**: Full-text search across multiple fields
2. **Filter Presets**: Save and load common filter combinations
3. **Export Filtered Results**: Export filtered spells to various formats
4. **Filter Analytics**: Track most-used filter combinations
5. **Custom Filter Logic**: Allow users to create complex filter rules 
