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
import { GenericList, TextInput, MultiSelect } from '@/components/genericList';

const MyList = () => {
  const columnDefinitions = {
    name: {
      label: 'Name',
      sortable: true,
      filterable: true,
      filterType: 'input'
    },
    category: {
      label: 'Category',
      sortable: true,
      filterable: true,
      filterType: 'multi-select'
    }
  };

  const filterOptions = {
    name: {
      component: TextInput,
      props: { placeholder: 'Filter by name...' }
    },
    category: {
      component: MultiSelect,
      props: {
        options: categories,
        displayKey: 'name',
        valueKey: 'id'
      }
    }
  };

  return (
    <GenericList
      storageKey="myList"
      defaultColumns={['name', 'category']}
      columnDefinitions={columnDefinitions}
      requiredColumnId="name"
      fetchData={fetchMyData}
      renderCell={renderMyCell}
      filterOptions={filterOptions}
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
  ColumnDefinition, 
  FilterOption 
} from '@/components/genericList';
``` 