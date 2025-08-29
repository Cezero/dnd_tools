# GenericList Component

*Comprehensive documentation for the GenericList component, a powerful and flexible table component used throughout the D&D Tools application.*

## 📋 **Overview**

The GenericList component is the foundation for all list views in the D&D Tools application. It provides a comprehensive, reusable table component with advanced filtering, sorting, pagination, and column configuration capabilities. Built on top of TanStack Table, it offers enterprise-grade table functionality with a consistent user experience across all systems.

**Source Files**:
- [GenericList.tsx](../../../apps/frontend/src/components/generic-list/GenericList.tsx) - Main component implementation
- [types.ts](../../../apps/frontend/src/components/generic-list/types.ts) - Type definitions and interfaces
- [filterFunctions.ts](../../../apps/frontend/src/components/generic-list/filterFunctions.ts) - Custom filter function implementations
- [ColumnHeaderContextMenu.tsx](../../../apps/frontend/src/components/generic-list/ColumnHeaderContextMenu.tsx) - Context menu for column operations
- [FilterSubmenu.tsx](../../../apps/frontend/src/components/generic-list/FilterSubmenu.tsx) - Filter submenu implementation
- [FloatingTextInput.tsx](../../../apps/frontend/src/components/generic-list/FloatingTextInput.tsx) - Floating text input for filters

**Related Documentation**:
- [Frontend Components Overview](frontend-components.md) - General frontend component patterns
- [System Architecture](system-architecture.md) - Overall system architecture

## 🏗️ **Architecture and Design**

### **Component Structure**

GenericList is built using a layered architecture that separates concerns and provides maximum flexibility:

**Core Layer**: TanStack Table provides the foundation for table functionality
**Filter Layer**: Custom filter functions and filter components handle data filtering
**UI Layer**: Context menus, floating inputs, and interactive elements
**State Layer**: Persistent state management with localStorage integration
**Integration Layer**: Routing, navigation, and external service integration

### **Key Design Principles**

**Type Safety**: Full TypeScript support with generic type parameters ensures compile-time safety
**Performance**: Optimized rendering with virtual scrolling and efficient state management
**Accessibility**: ARIA labels, keyboard navigation, and screen reader support
**Responsive Design**: Mobile-friendly design with adaptive layouts
**Extensibility**: Custom cell renderers, filter functions, and component overrides
**Consistency**: Uniform behavior and appearance across all implementations

## 🔧 **Core Features**

### **Data Display and Management**

**Table Functionality**:
- **Sortable Columns**: Click headers to sort data in ascending or descending order
- **Resizable Columns**: Drag column borders to adjust column widths
- **Reorderable Columns**: Drag and drop column headers to reorder columns
- **Column Visibility**: Show/hide columns with persistent state
- **Pagination**: Navigate through large datasets with configurable page sizes
- **Row Selection**: Checkbox selection for bulk operations

**Data Integration**:
- **Service Functions**: Integrate with any data service that returns `{ results: T[], total: number }`
- **Type Safety**: Generic type parameters ensure type safety throughout
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Loading indicators and skeleton screens during data fetch

### **Advanced Filtering System**

**Filter Types**:
GenericList supports multiple filter types defined in the `FilterType` enum from `@shared/static-data`:

- **TEXT_INPUT**: Text-based filtering with debounced input and floating text field
- **SINGLE_SELECT**: Dropdown selection for single values with clear visual feedback
- **MULTI_SELECT**: Multi-selection with OR/AND logic support and dynamic options
- **BOOLEAN**: True/False/Null selection with clear visual indicators

**Filter Functions**:
Custom filter functions provide specialized filtering capabilities:

- `createContainsFilter<T>()`: Case-insensitive text search with debouncing
- `createEqualsFilter<T>()`: Exact value matching for precise filtering
- `createArrayIdFilter<T>(idField)`: Filtering arrays of objects by ID field with logic support

**Filter Features**:
- **Tooltip Display**: Hover over filter icons to see current filter values
- **Dynamic Options**: Filter options can be generated dynamically based on current data
- **Logic Types**: Multi-select filters support both OR and AND logic
- **Clear Filters**: Easy filter clearing with visual indicators
- **Persistent State**: Filter state is automatically saved and restored

### **Column Configuration System**

**Column Definition Format**:
GenericList uses TanStack Table's `ColumnDef<T, unknown>[]` format for column definitions, providing maximum flexibility and type safety.

**Basic Column Properties**:
- `accessorKey`: Data field to display in the column (string key of the data object)
- `header`: Column header text or React component
- `enableSorting`: Whether the column can be sorted (default: false)
- `enableColumnFilter`: Whether the column supports filtering (default: false)
- `enableResizing`: Whether the column can be resized (default: true)
- `size`: Initial column width in pixels
- `cell`: Custom cell renderer function for specialized display logic

**Meta Configuration**:
The `meta` property contains GenericList-specific configuration:

- `required`: Whether the column is required for navigation (clicking navigates to detail page)
- `filterType`: Type of filter to use (from `FilterType` enum)
- `options`: Filter options for select-based filters (array or function)
- `placeholder`: Placeholder text for text input filters
- `truncate`: Number of characters to truncate text to (with ellipsis)
- `isMarkdown`: Whether to render content as markdown using ProcessMarkdown component

**Column Management Features**:
- **Context Menu**: Right-click on headers for sort, filter, and visibility options
- **Drag and Drop**: Reorder columns by dragging headers with visual feedback
- **Resize Handles**: Drag column borders to adjust widths with persistent state
- **Visibility Toggle**: Show/hide columns with automatic state persistence
- **Restore Hidden**: Context menu option to restore previously hidden columns

### **State Persistence and Management**

**Automatic State Persistence**:
- **localStorage Integration**: Table state is automatically saved to localStorage
- **State Restoration**: Column visibility, filters, sorting, and pagination are restored on page reload
- **Storage Keys**: Each GenericList instance uses a unique storage key for state isolation
- **State Validation**: Automatic validation and recovery from corrupted state

**Persisted State Elements**:
- **Column Visibility**: Which columns are currently visible
- **Column Order**: Current order of columns
- **Column Sizing**: Width of each column
- **Sorting State**: Current sort column and direction
- **Filter State**: Active filters and their values
- **Pagination State**: Current page and page size

**State Management Features**:
- **Automatic Saving**: State changes are automatically persisted
- **State Isolation**: Each list instance has independent state
- **State Recovery**: Graceful handling of corrupted or missing state
- **State Reset**: Built-in functionality to reset to default state

## 📝 **Configuration and Usage**

### **Basic Implementation Pattern**

The standard implementation pattern for GenericList involves several key steps:

1. **Define Data Types**: Create TypeScript interfaces for your data structure
2. **Create Column Definitions**: Define columns using `ColumnDef<T, unknown>[]` format
3. **Implement Service Function**: Create a service function that returns paginated data
4. **Configure Routes**: Define navigation routes for detail and edit views
5. **Render Component**: Use the GenericList component with proper props

### **Column Definition Examples**

**Text Input Filter Column**:
```typescript
{
    accessorKey: 'name',
    header: 'Name',
    enableSorting: true,
    enableColumnFilter: true,
    size: 200,
    meta: {
        required: true,
        filterType: FilterType.TEXT_INPUT,
        placeholder: 'Filter by name...'
    }
}
```

**Single Select Filter Column**:
```typescript
{
    accessorKey: 'status',
    header: 'Status',
    enableSorting: true,
    enableColumnFilter: true,
    size: 120,
    meta: {
        filterType: FilterType.SINGLE_SELECT,
        options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'pending', label: 'Pending' }
        ]
    }
}
```

**Multi-Select Filter Column**:
```typescript
{
    accessorKey: 'tags',
    header: 'Tags',
    enableColumnFilter: true,
    size: 150,
    filterFn: createArrayIdFilter<MyDataType>('tagId'),
    cell: info => {
        const tags = info.getValue() as { tagId: number }[];
        return tags.map(tag => tag.tagId).join(', ');
    },
    meta: {
        filterType: FilterType.MULTI_SELECT,
        options: availableTags
    }
}
```

**Custom Cell Renderer Column**:
```typescript
{
    accessorKey: 'description',
    header: 'Description',
    enableSorting: false,
    size: 300,
    meta: {
        truncate: 100,
        isMarkdown: true
    }
}
```

### **Service Function Implementation**

Service functions must return data in the expected format:

```typescript
const fetchMyData = async (): Promise<{ results: MyDataType[], total: number }> => {
    const response = await MyApiService.getAllItems();
    return {
        results: response.items,
        total: response.total
    };
};
```

### **Complete Implementation Example**

See the complete implementation in [SpellList.tsx](../../../apps/frontend/src/features/spell/SpellList.tsx) and [SpellColumns.ts](../../../apps/frontend/src/features/spell/SpellColumns.ts) for a real-world example of GenericList usage.

### **Advanced Configuration Options**

**Option Selection Mode**:
Enable bulk selection for multi-item operations:

```typescript
<GenericList<MyDataType>
    storageKey="my-list"
    columns={columns}
    serviceFunction={fetchMyData}
    isOptionSelector={true}
    selectedIds={selectedIds}
    onSelectedIdsChange={setSelectedIds}
/>
```

**Custom Functions**:
Provide custom functions for detail, edit, and delete operations:

```typescript
<GenericList<MyDataType>
    storageKey="my-list"
    columns={columns}
    serviceFunction={fetchMyData}
    functions={{
        detail: (item) => navigate(`/items/${item.id}`),
        edit: (item) => navigate(`/items/${item.id}/edit`),
        delete: async (item) => {
            await deleteItem(item.id);
            // Refresh data
        }
    }}
/>
```

**Route-Based Navigation**:
Configure navigation using route definitions:

```typescript
const routes = [
    { routeType: 'detail', path: 'items/:id', requireAdmin: false },
    { routeType: 'edit', path: 'items/:id/edit', requireAdmin: true }
];

<GenericList<MyDataType>
    storageKey="my-list"
    columns={columns}
    serviceFunction={fetchMyData}
    routes={routes}
    basePath="/admin"
/>
```

## 🎨 **User Interface Features**

### **Interactive Elements**

**Context Menu System**:
- **Right-Click Headers**: Access sort, filter, and visibility options
- **Filter Submenus**: Nested menus for complex filter configurations
- **Keyboard Navigation**: Full keyboard support for accessibility
- **Visual Feedback**: Clear visual indicators for current state

**Drag and Drop**:
- **Column Reordering**: Drag column headers to reorder
- **Visual Feedback**: Clear visual indicators during drag operations
- **Drop Zones**: Highlighted drop zones for precise positioning
- **Touch Support**: Full touch support for mobile devices

**Filter Interface**:
- **Floating Text Input**: Floating text input for text filters
- **Filter Icons**: Visual indicators for active filters
- **Tooltip Display**: Hover tooltips showing current filter values
- **Clear Options**: Easy filter clearing with visual feedback

### **Responsive Design**

**Mobile Optimization**:
- **Touch-Friendly**: Optimized for touch interactions
- **Responsive Layout**: Adaptive layouts for different screen sizes
- **Scrollable Tables**: Horizontal scrolling for wide tables
- **Collapsible Columns**: Automatic column hiding on small screens

**Desktop Features**:
- **Full Functionality**: Complete feature set on desktop
- **Keyboard Shortcuts**: Keyboard navigation and shortcuts
- **Mouse Interactions**: Precise mouse-based interactions
- **Large Screen Optimization**: Optimized for large displays

### **Accessibility Features**

**Screen Reader Support**:
- **ARIA Labels**: Comprehensive ARIA labels for screen readers
- **Semantic HTML**: Proper semantic structure for accessibility
- **Focus Management**: Proper focus management and keyboard navigation
- **Status Announcements**: Screen reader announcements for state changes

**Keyboard Navigation**:
- **Tab Navigation**: Full tab navigation support
- **Arrow Keys**: Arrow key navigation for table cells
- **Enter/Space**: Activation of interactive elements
- **Escape**: Cancel operations and close menus

## 🔧 **Performance and Optimization**

### **Rendering Optimization**

**Virtual Scrolling**: Efficient rendering of large datasets
**Memoization**: Optimized re-rendering with React.memo and useMemo
**Debounced Input**: Performance-optimized text input with debouncing
**Lazy Loading**: Load data only when needed

### **State Management**

**Efficient Updates**: Minimal re-renders through optimized state updates
**Persistent State**: Automatic state persistence without performance impact
**State Validation**: Fast state validation and recovery
**Memory Management**: Proper cleanup and memory usage optimization

### **Data Handling**

**Pagination**: Efficient handling of large datasets through pagination
**Filtering**: Optimized filtering algorithms for different data types
**Sorting**: Efficient sorting with proper algorithm selection
**Caching**: Intelligent caching of frequently accessed data

## 🛠️ **Development and Extension**

### **Custom Filter Functions**

Create custom filter functions for specialized filtering needs:

```typescript
export const createCustomFilter = <TData extends Record<string, unknown>>() => {
    const filterFn = (row: Row<TData>, columnId: string, filterValue: unknown) => {
        // Custom filtering logic
        return true; // or false
    };
    
    // Add autoRemove behavior
    filterFn.autoRemove = (val: unknown) => !val;
    
    return filterFn;
};
```

### **Custom Cell Renderers**

Implement custom cell renderers for specialized display logic:

```typescript
{
    accessorKey: 'customField',
    header: 'Custom Field',
    cell: ({ row, getValue }) => {
        const value = getValue();
        return <CustomComponent value={value} />;
    }
}
```

### **Component Extension**

Extend GenericList functionality through composition and props:

```typescript
const CustomGenericList = <T extends DataItem>(props: GenericListProps<T>) => {
    // Add custom functionality
    return <GenericList<T> {...props} />;
};
```

## 📊 **Integration Patterns**

### **API Integration**

**Service Function Pattern**:
- **Consistent Interface**: All service functions follow the same interface
- **Error Handling**: Comprehensive error handling and recovery
- **Type Safety**: Full type safety throughout the data flow
- **Performance**: Optimized data fetching and caching

**Data Flow**:
1. **Component Mount**: GenericList calls service function
2. **Data Fetch**: Service function fetches data from API
3. **State Update**: Component state is updated with fetched data
4. **UI Update**: Table is re-rendered with new data

### **Routing Integration**

**Navigation Patterns**:
- **Detail Navigation**: Click required columns to navigate to detail views
- **Edit Navigation**: Use edit functions or routes for editing
- **Breadcrumb Support**: Compatible with breadcrumb navigation
- **History Management**: Proper browser history management

**Route Configuration**:
- **Route Types**: Support for detail, edit, and delete routes
- **Admin Protection**: Route-level admin protection
- **Base Path**: Support for nested routing structures
- **Dynamic Routes**: Support for dynamic route parameters

### **State Integration**

**External State**:
- **Selection State**: Integration with external selection state
- **Filter State**: External filter state management
- **Sort State**: External sorting state management
- **Pagination State**: External pagination state management

**State Synchronization**:
- **Bidirectional Sync**: Synchronize state between components
- **State Validation**: Validate state consistency
- **State Recovery**: Recover from state inconsistencies
- **State Persistence**: Persistent state across sessions

## 🎯 **Best Practices**

### **Column Configuration**

**Column Organization**:
1. **Put Important Columns First**: Users see critical information immediately
2. **Use Consistent Sizing**: Similar data types should have similar column widths
3. **Mark Required Columns**: Use `required: true` for navigation columns
4. **Add Filters to Searchable Columns**: Enable filtering on commonly searched columns

**Performance Considerations**:
1. **Efficient Data Fetching**: Implement proper pagination in your API
2. **Debounced Filters**: Use debouncing for text input filters
3. **Memoize Column Definitions**: Prevent unnecessary re-renders
4. **Lazy Load Data**: Only fetch data when needed

### **User Experience**

**Column Headers**:
1. **Use Clear, Descriptive Names**: Make column purposes obvious
2. **Add Helpful Filter Placeholders**: Guide users on what they can search for
3. **Use Appropriate Filter Types**: Match filter types to data structure
4. **Consider Mobile Users**: Ensure tables work well on small screens

**Filter Configuration**:
1. **Choose Appropriate Filter Types**: Match filter types to data characteristics
2. **Provide Meaningful Options**: Use descriptive labels for filter options
3. **Support Dynamic Options**: Generate options based on current data
4. **Handle Empty States**: Provide clear feedback when no data matches filters

### **Type Safety**

**Data Type Definition**:
1. **Define Complete Interfaces**: Include all fields that will be displayed
2. **Use Generic Types**: Leverage TypeScript generics for type safety
3. **Validate Data**: Ensure data matches expected types
4. **Handle Optional Fields**: Properly handle optional and nullable fields

**Column Type Safety**:
1. **Use accessorKey**: Ensure column keys match data structure
2. **Type Filter Functions**: Use properly typed filter functions
3. **Validate Meta Properties**: Ensure meta properties are correctly typed
4. **Handle Complex Data**: Properly type complex data structures

## 📋 **Summary**

The GenericList component provides a comprehensive, flexible, and performant table solution for the D&D Tools application. Its key strengths include:

- **Comprehensive Functionality**: Advanced filtering, sorting, pagination, and column management
- **Type Safety**: Full TypeScript support with generic type parameters
- **Performance**: Optimized rendering and efficient state management
- **Accessibility**: Complete accessibility support with ARIA labels and keyboard navigation
- **Extensibility**: Custom filter functions, cell renderers, and component overrides
- **Consistency**: Uniform behavior and appearance across all implementations
- **Integration**: Seamless integration with routing, state management, and API services

By following the patterns and best practices outlined in this documentation, developers can create consistent, maintainable, and user-friendly list views across all systems in the D&D Tools application.
