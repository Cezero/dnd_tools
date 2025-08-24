# Generic List System

*Complete documentation for generic list and table components, filtering, sorting, and data management in D&D Tools.*

## Overview

The GenericList component is the primary data table solution in D&D Tools. It provides a consistent, feature-rich interface for displaying and managing data across the application. Built on TanStack Table (React Table), it handles all the common table operations like filtering, sorting, pagination, and column management automatically.

Think of GenericList as a smart table that knows how to work with your data. You tell it what data to show, how to display it, and what actions users can take - it handles everything else.

## Core Concepts

### What GenericList Does

GenericList transforms your raw data into an interactive table with these built-in capabilities:

- **Data Display**: Shows your data in organized columns with proper formatting
- **Filtering**: Lets users search and filter data using text inputs, dropdowns, or checkboxes
- **Sorting**: Allows clicking column headers to sort data
- **Pagination**: Breaks large datasets into manageable pages
- **Column Management**: Users can resize, reorder, and hide columns
- **Selection**: Supports checkbox selection for bulk operations
- **Actions**: Provides edit, delete, and detail buttons for each row
- **State Persistence**: Remembers user preferences like column settings and filters

### How It Works

1. **Data Source**: You provide a function that fetches data from your API
2. **Column Definition**: You define how each piece of data should be displayed
3. **Configuration**: You specify what features to enable (filtering, sorting, etc.)
4. **Rendering**: GenericList handles all the UI and user interactions

The component automatically manages the complex state of filters, sorting, pagination, and user preferences, so you don't have to write that logic yourself.

## Getting Started

### Basic Setup

To create a simple list, you need three things:

1. **A data fetching function** that returns your data
2. **Column definitions** that describe how to display each field
3. **The GenericList component** with your configuration

Here's the minimal setup:

```typescript
import { GenericList } from '@/components/generic-list/GenericList';

const MyList = () => {
    // Define how to fetch data
    const fetchData = async () => {
        const response = await fetch('/api/my-data');
        const data = await response.json();
        return { results: data.items, total: data.total };
    };

    // Define how to display columns
    const columns = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'type', header: 'Type' },
        { accessorKey: 'status', header: 'Status' }
    ];

    return (
        <GenericList
            storageKey="my-list"
            columns={columns}
            serviceFunction={fetchData}
            itemDesc="item"
        />
    );
};
```

That's it! You now have a fully functional table with sorting, pagination, and column management.

## Column Configuration

### Understanding Columns

Columns define how each piece of data is displayed and what users can do with it. Each column has several aspects:

- **Data Access**: Which field from your data to display
- **Display**: How to format and show the data
- **Behavior**: Whether users can sort, filter, or resize the column
- **Filtering**: What type of filter to use (text search, dropdown, etc.)

### Column Types

GenericList supports several types of columns based on your data and needs:

#### Simple Display Columns
For basic data that just needs to be shown without filtering:

```typescript
{
    accessorKey: 'description',
    header: 'Description',
    enableResizing: true,
    size: 200
}
```

#### Filterable Text Columns
For data that users want to search through:

```typescript
{
    accessorKey: 'name',
    header: 'Name',
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: createContainsFilter(),
    meta: {
        filterType: FilterType.TEXT_INPUT,
        placeholder: 'Search by name...'
    }
}
```

#### Select Filter Columns
For data with predefined options (like status, type, category):

```typescript
{
    accessorKey: 'status',
    header: 'Status',
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: createEqualsFilter(),
    meta: {
        filterType: FilterType.SINGLE_SELECT,
        options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
        ]
    }
}
```

#### Multi-Select Columns
For data that can have multiple values (like tags, categories):

```typescript
{
    accessorKey: 'categories',
    header: 'Categories',
    enableColumnFilter: true,
    filterFn: createArrayIdFilter('id'),
    meta: {
        filterType: FilterType.MULTI_SELECT,
        options: categoryOptions
    }
}
```

### Column Behavior Options

You can control what users can do with each column:

- **`enableSorting`**: Allow clicking header to sort
- **`enableColumnFilter`**: Show filter controls
- **`enableResizing`**: Allow users to resize column width
- **`size`**: Set initial column width
- **`required`**: Prevent users from hiding this column

## Filtering System

### How Filtering Works

GenericList provides a flexible filtering system that adapts to your data types. Users can filter data in several ways:

- **Text Search**: Type to search within text fields
- **Dropdown Selection**: Choose from predefined options
- **Multi-Select**: Select multiple options for complex filtering
- **Boolean**: True/false/null selection

### Filter Types Explained

#### Text Input Filters
Best for: Names, descriptions, any text content
- Users type to search within the field
- Searches are case-insensitive
- Matches partial text (contains search)

#### Single Select Filters
Best for: Status, type, category fields with predefined values
- Users choose from a dropdown of options
- Only one option can be selected at a time
- Good for mutually exclusive values

#### Multi-Select Filters
Best for: Tags, categories, relationships where items can have multiple values
- Users can select multiple options
- Supports both "OR" and "AND" logic
- Perfect for complex filtering scenarios

#### Boolean Filters
Best for: Yes/no fields, active/inactive status
- Users can select true, false, or show all
- Simple three-state selection

### Filter Logic

For multi-select filters, you can control how multiple selections work:

- **OR Logic** (default): Show items that match ANY selected option
- **AND Logic**: Show items that match ALL selected options

This is useful for complex scenarios like "Show spells that are both Evocation AND Fire type" vs "Show spells that are either Evocation OR Fire type."

## Selection System

### Bulk Operations

The selection system allows users to select multiple items for bulk operations. This is useful for:

- Bulk deletion
- Bulk status changes
- Exporting selected items
- Applying actions to multiple items at once

### How Selection Works

1. **Enable Selection**: Set `isOptionSelector={true}` on GenericList
2. **Track Selection**: Use `selectedIds` and `onSelectedIdsChange` props
3. **Handle Actions**: Create functions that work with the selected IDs

### Selection Example

```typescript
const [selectedIds, setSelectedIds] = useState([]);

const handleBulkDelete = async () => {
    for (const id of selectedIds) {
        await deleteItem(id);
    }
    setSelectedIds([]);
};

return (
    <div>
        {selectedIds.length > 0 && (
            <button onClick={handleBulkDelete}>
                Delete {selectedIds.length} selected
            </button>
        )}
        <GenericList
            isOptionSelector={true}
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
            // ... other props
        />
    </div>
);
```

## Action Integration

### Built-in Actions

GenericList provides three standard actions for each row:

- **Detail**: View detailed information about the item
- **Edit**: Modify the item
- **Delete**: Remove the item

### How Actions Work

You provide functions that define what happens when users click these action buttons:

```typescript
const functions = {
    detail: (item) => navigate(`/items/${item.id}`),
    edit: (item) => navigate(`/items/${item.id}/edit`),
    delete: async (item) => {
        await deleteItem(item.id);
        // Refresh the list
    }
};
```

### Custom Action Handling

You can also provide a `deleteServiceFunction` for consistent delete behavior:

```typescript
const deleteServiceFunction = createIdDeleteServiceFunction(ItemService.deleteItem);

<GenericList
    deleteServiceFunction={deleteServiceFunction}
    // ... other props
/>
```

## State Persistence

### What Gets Saved

GenericList automatically saves user preferences to localStorage:

- Column visibility (which columns are shown/hidden)
- Column order (the sequence of columns)
- Column sizing (width of each column)
- Filter values (what filters are currently applied)
- Sort settings (which column is sorted and in what direction)
- Pagination state (current page and items per page)

### How Persistence Works

Each GenericList instance uses a unique `storageKey` to save its state:

```typescript
<GenericList
    storageKey="unique-identifier-for-this-list"
    // ... other props
/>
```

When users return to the page, their previous settings are automatically restored. This creates a consistent experience across sessions.

## Navigation Integration

### Route Configuration

GenericList can integrate with your routing system to provide navigation buttons:

```typescript
const routes = [
    { path: '/items/new', label: 'New Item' },
    { path: '/items/import', label: 'Import Items' }
];

<GenericList
    routes={routes}
    // ... other props
/>
```

### Custom Navigation

You can also add custom navigation buttons outside the GenericList:

```typescript
const handleNewItem = () => {
    navigate('/items/new', { 
        state: { fromListParams: location.search } 
    });
};

return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h1>Items</h1>
            <button onClick={handleNewItem}>New Item</button>
        </div>
        <GenericList
            // ... props
        />
    </div>
);
```

## Advanced Features

### Custom Cell Rendering

Sometimes you need to display data in a special way. You can provide custom cell renderers:

```typescript
{
    accessorKey: 'status',
    header: 'Status',
    cell: info => {
        const status = info.getValue();
        const color = status === 'active' ? 'green' : 'red';
        return (
            <span className={`px-2 py-1 rounded bg-${color}-500 text-white`}>
                {status}
            </span>
        );
    }
}
```

### Conditional Rendering

You can show different content based on conditions:

```typescript
{
    accessorKey: 'actions',
    header: 'Actions',
    cell: info => {
        const item = info.row.original;
        const { isAdmin } = useAuthAuto();
        
        return (
            <div className="flex gap-2">
                <button onClick={() => viewItem(item)}>View</button>
                {isAdmin && (
                    <button onClick={() => editItem(item)}>Edit</button>
                )}
            </div>
        );
    }
}
```

### Text Truncation

For long text fields, you can automatically truncate content:

```typescript
{
    accessorKey: 'description',
    header: 'Description',
    meta: {
        truncate: 100  // Show only first 100 characters
    }
}
```

### Markdown Rendering

For rich text content, you can render markdown:

```typescript
{
    accessorKey: 'content',
    header: 'Content',
    meta: {
        isMarkdown: true,
        truncate: 200
    }
}
```

## Best Practices

### Column Organization

1. **Put important columns first**: Users see the most critical information immediately
2. **Use consistent sizing**: Similar types of data should have similar column widths
3. **Mark required columns**: Use `required: true` for columns that should always be visible
4. **Add filters to searchable columns**: Enable filtering on columns users commonly search

### Performance Considerations

1. **Efficient data fetching**: Implement proper pagination in your API
2. **Debounced filters**: For large datasets, consider debouncing text input filters
3. **Memoize column definitions**: Prevent unnecessary re-renders by memoizing your column arrays
4. **Lazy load data**: Only fetch data when the component is actually visible

### User Experience

1. **Provide meaningful column headers**: Use clear, descriptive names
2. **Add helpful filter placeholders**: Guide users on what they can search for
3. **Use appropriate filter types**: Match filter types to your data structure
4. **Consider mobile users**: Ensure your table works well on smaller screens

### Type Safety

Always define your data types and use them with GenericList:

```typescript
interface MyDataType {
    id: number;
    name: string;
    status: 'active' | 'inactive';
    createdAt: Date;
}

<GenericList<MyDataType>
    // ... props
/>
```

## Common Patterns

### List with Actions

Most lists need some form of actions. Here's the typical pattern:

```typescript
const MyList = () => {
    const navigate = useNavigate();
    
    const functions = {
        detail: (item) => navigate(`/items/${item.id}`),
        edit: (item) => navigate(`/items/${item.id}/edit`),
        delete: async (item) => {
            await deleteItem(item.id);
            // Optionally refresh the list
        }
    };

    return (
        <GenericList
            functions={functions}
            deleteServiceFunction={createIdDeleteServiceFunction(deleteItem)}
            // ... other props
        />
    );
};
```

### List with Selection

For bulk operations:

```typescript
const MyList = () => {
    const [selectedIds, setSelectedIds] = useState([]);
    
    const handleBulkAction = async () => {
        // Process selected items
        for (const id of selectedIds) {
            await processItem(id);
        }
        setSelectedIds([]);
    };

    return (
        <div>
            {selectedIds.length > 0 && (
                <button onClick={handleBulkAction}>
                    Process {selectedIds.length} items
                </button>
            )}
            <GenericList
                isOptionSelector={true}
                selectedIds={selectedIds}
                onSelectedIdsChange={setSelectedIds}
                // ... other props
            />
        </div>
    );
};
```

### List with Custom Navigation

For complex navigation scenarios:

```typescript
const MyList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const handleNewItem = () => {
        navigate('/items/new', { 
            state: { fromListParams: location.search } 
        });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1>Items</h1>
                <button onClick={handleNewItem}>New Item</button>
            </div>
            <GenericList
                // ... props
            />
        </div>
    );
};
```

## Troubleshooting

### Common Issues

**Filters not working**: Make sure you've set `enableColumnFilter: true` and provided the correct `filterFn` and `meta.filterType`.

**Columns not showing**: Check that your `accessorKey` matches the actual field names in your data.

**Actions not appearing**: Ensure you've provided the `functions` prop with the appropriate action handlers.

**State not persisting**: Verify you've set a unique `storageKey` for your GenericList instance.

**Performance issues**: Consider implementing server-side filtering and pagination for large datasets.

### Debugging Tips

1. **Check browser console** for JavaScript errors
2. **Verify data structure** matches your column definitions
3. **Test filter functions** independently to ensure they work correctly
4. **Check localStorage** to see if state is being saved properly
5. **Use React DevTools** to inspect component props and state

The GenericList component is designed to handle most common table scenarios automatically, but understanding these concepts will help you configure it effectively for your specific needs.
