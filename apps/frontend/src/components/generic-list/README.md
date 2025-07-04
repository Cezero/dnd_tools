# GenericList Component

A comprehensive, reusable list component with filtering, sorting, pagination, and column configuration capabilities.

## Structure

```
genericList/
├── index.ts          # Main exports and types
├── types.ts          # Shared type definitions
├── GenericList.tsx   # Main list component
├── ColumnConfig.tsx  # Column configuration modal and hook
├── TextInput.tsx     # Text filter component
├── MultiSelect.tsx   # Multi-select filter component
├── SingleSelect.tsx  # Single-select filter component
├── BooleanInput.tsx  # Boolean filter component
└── README.md         # This documentation
```

## Components

### GenericList
The main list component that provides:
- Data fetching and pagination
- Column sorting
- Filtering with multiple filter types
- Column visibility configuration
- Option selector mode for bulk operations
- Edit/delete handlers

### Filter Components
- **TextInput**: Text-based filtering with optional dynamic filtering
- **MultiSelect**: Multi-option selection with OR/AND logic
- **SingleSelect**: Single option selection
- **BooleanInput**: True/False/Null selection

### ColumnConfig
- **UseColumnConfig**: Hook for managing column visibility
- **ColumnConfigModal**: Modal for configuring visible columns

## Usage

```tsx
import { GenericList } from '@/components/genericList';

const MyList = () => {
  const columnDefinitions = {
  name: {
    label: 'Name',
    sortable: true,
    isDefault: true, // Column is visible by default
    filterConfig: {
      type: 'text-input',
      props: { placeholder: 'Filter by name...' }
    }
  },
  category: {
    label: 'Category',
    sortable: true,
    isDefault: true, // Column is visible by default
    filterConfig: {
      type: 'multi-select',
      props: {
        options: categories,
        displayKey: 'name',
        valueKey: 'id'
      }
    }
  }
};

  return (
    <GenericList
      storageKey="myList"
      columnDefinitions={columnDefinitions}
      serviceFunction={fetchMyData}
      renderCell={renderMyCell}
      detailPagePath="/items/:id"
    />
  );
};
```

## Features

- **Type Safety**: Full TypeScript support with shared type definitions
- **Persistence**: Column visibility and filter state saved to localStorage
- **Accessibility**: ARIA labels and keyboard navigation support
- **Dark Mode**: Built-in dark mode support
- **Responsive**: Mobile-friendly design
- **Customizable**: Extensive customization options through props

## Type Definitions

All types are exported from the main index file and can be imported as needed:

```tsx
import type { 
  GenericListProps, 
  ColumnDefinition
} from '@/components/genericList';
```

# GenericList Filter Configuration

The GenericList component now supports a consolidated, type-safe filter configuration system that eliminates redundancy between `ColumnDefinition` and `FilterOption`.

## New Filter Configuration

Instead of defining separate `ColumnDefinition` and `FilterOption` objects like this:

```typescript
// OLD WAY - Redundant and confusing
const columnDefinitions = {
  name: {
    label: 'Name',
    sortable: true
  }
};

const filterOptions = {
  name: {
    type: 'text-input',
    props: { placeholder: 'Search by name...' }
  }
};
```

You can now define everything in one place:

```typescript
// NEW WAY - Clean and consolidated
const columnDefinitions = {
  name: {
    label: 'Name',
    sortable: true,
    isDefault: true, // Column is visible by default
    filterConfig: {
      type: 'text-input',
      props: { placeholder: 'Search by name...' }
    }
  },
  status: {
    label: 'Status',
    sortable: true,
    isDefault: true, // Column is visible by default
    filterConfig: {
      type: 'single-select',
      props: {
        options: [
          { value: 1, label: 'Active' },
          { value: 2, label: 'Inactive' }
        ],
        placeholder: 'Select status...'
      }
    }
  },
  tags: {
    label: 'Tags',
    sortable: false,
    isDefault: false, // Column is hidden by default
    filterConfig: {
      type: 'multi-select',
      props: {
        options: [
          { value: 1, label: 'Frontend' },
          { value: 2, label: 'Backend' },
          { value: 3, label: 'DevOps' }
        ]
      }
    }
  },
  isActive: {
    label: 'Active',
    sortable: true,
    isDefault: false, // Column is hidden by default
    filterConfig: {
      type: 'boolean'
    }
  }
};
```

## Supported Filter Types

### `text-input`
For text search filters.

**Props:**
- `placeholder?: string` - Placeholder text
- `type?: string` - Input type (defaults to "text")
- All base filter props

### `single-select`
For dropdown selection filters.

**Required Props:**
- `options: SingleSelectOption[]` - Array of options

**Optional Props:**
- `displayKey?: string` - Key for display text (defaults to 'label')
- `valueKey?: string` - Key for option value (defaults to 'value')
- `placeholder?: string` - Placeholder text
- All base filter props

### `multi-select`
For multi-selection filters with OR/AND logic.

**Required Props:**
- `options: MultiSelectOption[]` - Array of options

**Optional Props:**
- `displayKey?: string` - Key for display text (defaults to 'label')
- `valueKey?: string` - Key for option value (defaults to 'value')
- All base filter props

### `boolean`
For true/false filters.

**Props:**
- All base filter props

## Base Filter Props

All filter types support these common props:

- `open?: boolean` - Whether the filter is open
- `onOpenChange?: (open: boolean) => void` - Open/close handler
- `dynamic?: boolean` - Enable dynamic filtering
- `dynamicFilterDelay?: number` - Delay for dynamic filtering
- `multiColumn?: string[]` - Multi-column search configuration
- `appendClassName?: string` - Additional CSS classes
- `id?: string` - HTML id attribute
- `className?: string` - CSS classes

## Default Values

For `single-select` and `multi-select` filters, the following defaults are used if not specified:

- `displayKey` defaults to `'label'`
- `valueKey` defaults to `'value'`

This means you can use the standard `{ value: X, label: 'Y' }` format without specifying keys:

```typescript
const simpleFilterOptions = {
  status: {
    type: 'single-select',
    props: {
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
      // No need to specify displayKey or valueKey!
    }
  }
};
```

## Column Properties

The following properties control column behavior, all defaulting to `false` for safety:

### `isDefault`
Controls which columns are visible by default:
- `isDefault: true` - Column is visible by default
- `isDefault: false` - Column is hidden by default  
- `isDefault: undefined` - Column is hidden by default (same as `false`)

### `sortable`
Controls whether the column can be sorted:
- `sortable: true` - Column can be sorted
- `sortable: false` - Column cannot be sorted
- `sortable: undefined` - Column cannot be sorted (same as `false`)

### `isRequired`
Controls whether the column is required for navigation (clicking navigates to detail page):
- `isRequired: true` - Column is required and cannot be hidden
- `isRequired: false` - Column is not required
- `isRequired: undefined` - Column is not required (same as `false`)

This eliminates the need for separate `DEFAULT_COLUMNS` arrays and makes column configuration more intuitive:

```typescript
const columnDefinitions = {
  name: {
    label: 'Name',
    isDefault: true, // Visible by default
    sortable: true, // Can be sorted
    isRequired: true, // Required for navigation
    filterConfig: { // Automatically makes column filterable
      type: 'text-input',
      props: { placeholder: 'Filter by name...' }
    }
    // ... other properties
  },
  email: {
    label: 'Email', 
    isDefault: false, // Hidden by default
    sortable: false, // Cannot be sorted
    isRequired: false, // Not required for navigation
    filterConfig: { // Automatically makes column filterable
      type: 'text-input',
      props: { placeholder: 'Filter by email...' }
    }
    // ... other properties
  },
  description: {
    label: 'Description',
    // All properties not specified = false (hidden, not sortable, not required)
    // No filterConfig = not filterable
    // ... other properties
  }
};
```

## Backward Compatibility

The old legacy filter configuration is still supported for backward compatibility:

```typescript
// Legacy way still works
const legacyFilterOptions = {
  name: {
    component: CustomTextInput,
    props: { placeholder: 'Search...' }
  }
};
```

## Column Definition

Make sure your column definitions specify the correct `filterConfig` and `isDefault`:

```typescript
const columnDefinitions = {
  name: {
    label: 'Name',
    sortable: true,
    isDefault: true, // Column is visible by default
    alwaysVisible: true,
    filterConfig: {
      type: 'text-input'
    }
  },
  status: {
    label: 'Status',
    sortable: true,
    isDefault: true, // Column is visible by default
    filterConfig: {
      type: 'single-select'
    }
  },
  tags: {
    label: 'Tags',
    sortable: false,
    isDefault: false, // Column is hidden by default
    filterConfig: {
      type: 'multi-select'
    }
  },
  isActive: {
    label: 'Active',
    sortable: true,
    isDefault: false, // Column is hidden by default
    filterConfig: {
      type: 'boolean'
    }
  }
};
```

## Benefits

1. **Eliminates Redundancy**: No more separate `ColumnDefinition` and `FilterOption` objects, or separate `DEFAULT_COLUMNS` arrays
2. **Single Source of Truth**: All column and filter configuration in one place
3. **Type Safety**: Full TypeScript support with proper IntelliSense
4. **Simplified API**: No need to pass separate `filterOptions` or `defaultColumns` props
5. **Better Maintainability**: Easier to understand and modify filter configurations
6. **Consistent Components**: Built-in filter components ensure consistency
7. **Backward Compatible**: Legacy filter configurations still work
8. **Intuitive Defaults**: `isDefault` property makes it clear which columns are visible by default 