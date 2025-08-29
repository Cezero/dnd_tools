# Frontend Components Overview

*Consolidated documentation for shared frontend component patterns, architecture principles, and best practices across all systems in D&D Tools.*

## 📋 **Overview**

This document consolidates shared frontend component patterns, architecture principles, and best practices that are common across the class, race, and feature systems. It provides a single source of truth for frontend development standards and patterns.

**Related Documentation**:
- [Class System Frontend Components](../class-system/frontend-components.md) - Class-specific frontend components
- [Race System Frontend Components](../race-system/frontend-components.md) - Race-specific frontend components  
- [Feature System Frontend Components](../feature-system/frontend-components.md) - Feature-specific frontend components
- [Dice Box System Frontend Components](../dice-box-system/frontend-components.md) - Dice Box system frontend components
- [Log Panel Component](log-panel.md) - Global logging system component
- [Toast Component](toast.md) - Global notification system component

## 🏗️ **Shared Component Architecture**

### **Hierarchical Component Structure**

All systems follow a consistent hierarchical component architecture:

**List Components**: Display collections of entities with filtering and pagination
**Detail Components**: Show complete entity information with all related data
**Edit Components**: Provide forms for creating and modifying entities
**Tab Components**: Organize complex entity data into manageable sections
**Utility Components**: Reusable components for specific functionality
**API Layer**: Centralized API clients for backend communication

### **Component Relationships**

**List** → **Detail** → **Display**: Standard navigation flow from list to detail view
**List** → **Edit**: Direct navigation to editing interface
**Edit** → **Tab Components**: Tab-based organization of editing functionality
**All Components** → **API Layer**: Backend communication through API layer

### **Data Flow Pattern**

**API Layer** → **State Management** → **Component Props** → **User Interface**

## 🔧 **Shared Core Components**

### **GenericList Component**

The GenericList component is a comprehensive, reusable list component that provides advanced table functionality with filtering, sorting, pagination, and column configuration capabilities. It serves as the foundation for all list views across the application.

**Source Files**:
- [GenericList.tsx](../../../apps/frontend/src/components/generic-list/GenericList.tsx) - Main component implementation
- [types.ts](../../../apps/frontend/src/components/generic-list/types.ts) - Type definitions and interfaces
- [filterFunctions.ts](../../../apps/frontend/src/components/generic-list/filterFunctions.ts) - Custom filter function implementations
- [ColumnHeaderContextMenu.tsx](../../../apps/frontend/src/components/generic-list/ColumnHeaderContextMenu.tsx) - Context menu for column operations

**Purpose and Function**:
- **Data Display**: Present entities in a searchable, sortable table format using TanStack Table
- **Advanced Filtering**: Support multiple filter types including text input, single select, multi-select, and boolean filters
- **Column Management**: Enable column visibility, resizing, reordering, and configuration
- **Pagination**: Handle large datasets with efficient pagination
- **State Persistence**: Automatically save and restore table state in localStorage
- **Option Selection**: Support bulk selection mode for multi-item operations
- **Navigation Integration**: Seamless integration with routing for detail and edit views

**Key Features**:
- **Type Safety**: Full TypeScript support with generic type parameters
- **Responsive Design**: Mobile-friendly design with drag-and-drop column reordering
- **Dark Mode**: Built-in dark mode support
- **Accessibility**: ARIA labels and keyboard navigation support
- **Performance**: Optimized rendering with virtual scrolling capabilities
- **Extensibility**: Custom cell renderers and filter functions

**Detailed Documentation**:
For comprehensive documentation on GenericList configuration, usage patterns, and advanced features, see [GenericList Component Documentation](generic-list.md).

**Example Implementation**:
See [SpellList.tsx](../../../apps/frontend/src/features/spell/SpellList.tsx) and [SpellColumns.ts](../../../apps/frontend/src/features/spell/SpellColumns.ts) for a complete implementation example.

### **Log Panel Component**

The Log Panel component provides a global logging system that enables any component in the application to add log entries for debugging, user feedback, and system monitoring. The panel is hidden by default and can be activated by moving the mouse to the bottom edge of the viewport.

**Source Files**:
- [LogPanelProvider.tsx](../../../apps/frontend/src/components/log-panel/LogPanelProvider.tsx) - Main provider component for global state management
- [LogPanel.tsx](../../../apps/frontend/src/components/log-panel/LogPanel.tsx) - Main panel component for display and interaction
- [LogEntry.tsx](../../../apps/frontend/src/components/log-panel/LogEntry.tsx) - Individual log entry rendering component
- [LogPanelHooks.ts](../../../apps/frontend/src/components/log-panel/LogPanelHooks.ts) - React hook for accessing log panel functionality

**Purpose and Function**:
- **Global Logging**: Provide centralized logging system accessible from any component
- **User Interface**: Display log entries in a collapsible panel with smooth animations
- **Entry Management**: Maintain configurable number of entries with automatic cleanup
- **System Integration**: Integrate with Dice Box and other systems for automatic logging
- **Type Support**: Support different log types (info, success, warning, error) with appropriate styling

**Key Features**:
- **Universal Access**: Any component can add log entries using the `useLogPanel` hook
- **Mouse Activation**: Panel appears when mouse is moved to bottom edge of viewport
- **Auto-scroll**: Automatically scrolls to show the most recent entries
- **Entry Management**: Maintains last 500 entries with automatic cleanup
- **Dice Integration**: Automatically logs dice roll results with the same formatting as toasts
- **Type Support**: Supports different log types (info, success, warning, error)
- **Dark Mode**: Fully supports dark mode styling

**Detailed Documentation**:
For comprehensive documentation on Log Panel usage patterns, integration, and advanced features, see [Log Panel Component Documentation](log-panel.md).

**Example Implementation**:
See [LogPanelTest.tsx](../../../apps/frontend/src/components/log-panel/LogPanelTest.tsx) for a complete implementation example.

### **Toast Component**

The Toast component provides a global notification system that enables any component in the application to display user-friendly notifications, success messages, error feedback, and system alerts. The system is built on top of the base UI toast library and provides a consistent, accessible notification experience.

**Source Files**:
- [ToastProvider.tsx](../../../apps/frontend/src/components/toast/ToastProvider.tsx) - Main provider component for global toast state management
- [GenericToast.tsx](../../../apps/frontend/src/components/toast/GenericToast.tsx) - Individual toast rendering component
- [useToast.ts](../../../apps/frontend/src/components/toast/useToast.ts) - React hook for accessing toast functionality

**Purpose and Function**:
- **Global Notifications**: Provide centralized notification system accessible from any component
- **User Feedback**: Display success, warning, error, and informational messages
- **Rich Content**: Support for complex formatted content including React elements
- **System Integration**: Integrate with Dice Box and other systems for automatic notifications
- **Accessibility**: Provide accessible notification experience with proper screen reader support

**Key Features**:
- **Universal Access**: Any component can add toast notifications using the `useToast` hook
- **Fixed Positioning**: Toast notifications appear in the bottom-right corner of the viewport
- **Smooth Animations**: Smooth entrance and exit animations for better user experience
- **Swipe Dismissal**: Users can swipe up to dismiss toast notifications
- **Auto-dismiss**: Toast notifications automatically dismiss after a configurable duration
- **Stack Management**: Multiple toasts are stacked with proper spacing and z-index management
- **Dark Mode**: Fully supports dark mode styling and theming

**Detailed Documentation**:
For comprehensive documentation on Toast usage patterns, integration, and advanced features, see [Toast Component Documentation](toast.md).

**Example Implementation**:
See [DiceBoxProvider.tsx](../../../apps/frontend/src/components/dice-box/DiceBoxProvider.tsx) for integration example with dice roll notifications.

### **List Components**

All systems implement list components with consistent patterns:

**Purpose and Function**:
- **Data Display**: Present entities in a searchable, sortable table format
- **User Interaction**: Enable entity selection, filtering, and navigation
- **Performance**: Handle large datasets with pagination and virtual scrolling
- **Responsive Design**: Adapt to different screen sizes and orientations

**User Interface Features**:
- **Data Table**: Sortable columns for entity attributes
- **Search Functionality**: Real-time search across entity names and descriptions
- **Filter Controls**: Filter by various entity attributes
- **Pagination**: Navigate through large entity collections efficiently
- **Admin Actions**: Create new entities and manage features (admin only)

### **Detail Components**

Container components that manage entity detail views and navigation:

**Purpose and Function**:
- **Data Loading**: Fetch and manage entity data from the API
- **Navigation Management**: Handle back navigation and edit mode transitions
- **Error Handling**: Manage loading states and error conditions
- **Admin Integration**: Provide edit functionality for admin users

**User Interface Features**:
- **Loading States**: Display loading indicators during data fetch
- **Error Handling**: Show appropriate error messages for failed requests
- **Navigation Controls**: Back button and edit button for admin users
- **Responsive Layout**: Adapt to different screen sizes

### **Display Components**

Comprehensive components for displaying complete entity information:

**Purpose and Function**:
- **Information Display**: Present all entity details in a readable format
- **Feature Integration**: Display entity features and abilities
- **Markdown Processing**: Render entity descriptions with markdown support
- **Responsive Design**: Adapt layout to different screen sizes

**User Interface Features**:
- **Header Section**: Entity name, edition, and basic information
- **Description Section**: Markdown-rendered entity description
- **Feature Display**: Organized display of entity features and abilities
- **Action Buttons**: Edit and back navigation (configurable)
- **Responsive Layout**: Mobile-friendly design

### **Edit Components**

Main components for entity creation and editing with tab-based organization:

**Purpose and Function**:
- **Form Management**: Handle entity creation and editing forms
- **Tab Navigation**: Organize editing functionality into logical sections
- **Feature Integration**: Integrate with feature system for entity abilities
- **Validation**: Provide real-time form validation and error handling

**User Interface Features**:
- **Tab Navigation**: Organized tabs for different aspects of entity editing
- **Form Validation**: Real-time validation with error display
- **Feature Management**: Add, edit, and remove entity features
- **State Management**: Comprehensive state management for form data
- **API Integration**: Seamless integration with backend services

## 📑 **Shared Tab Components**

### **BasicInfoTab Components**

Specialized components for editing basic entity information:

**Purpose and Function**:
- **Basic Information**: Name, edition, visibility, and core attributes
- **Form Validation**: Real-time validation of basic entity properties
- **User Experience**: Intuitive form layout with proper labeling

**User Interface Features**:
- **Text Input**: Entity name with validation
- **Select Dropdowns**: Edition and other classification selections
- **Number Input**: Numeric values with validation
- **Checkbox**: Visibility toggle
- **Responsive Layout**: Grid-based layout for different screen sizes

### **FeaturesTab Components**

Components for managing entity features:

**Purpose and Function**:
- **Feature Management**: Add, edit, and remove entity features
- **Feature System Integration**: Use shared FeaturesTab component
- **Progression Management**: Handle feature progression details

**User Interface Features**:
- **Feature Selection**: Choose features to add to the entity
- **Progression Display**: Show feature progression details
- **Edit/Remove Controls**: Manage existing features
- **Integration**: Seamless integration with feature system

### **DescriptionTab Components**

Components for editing entity descriptions:

**Purpose and Function**:
- **Description Editing**: Provide markdown editor for entity descriptions
- **Preview Support**: Real-time preview of markdown content
- **Validation**: Ensure proper description formatting

**User Interface Features**:
- **Markdown Editor**: Rich text editing with markdown support
- **Preview Mode**: Real-time preview of formatted content
- **Validation**: Ensure proper markdown syntax

## 🔌 **Shared API Integration**

### **API Service Pattern**

All systems implement consistent API service patterns:

**API Endpoints**:
- **GET /entities**: Retrieve all entities with filtering and pagination
- **GET /entities/:id**: Retrieve specific entity by ID
- **POST /entities**: Create new entity
- **PUT /entities/:id**: Update existing entity
- **DELETE /entities/:id**: Delete entity

**Features**:
- **Type Safety**: Full TypeScript integration with Zod validation
- **Error Handling**: Comprehensive error handling and validation
- **Path Parameters**: Support for path-based parameters
- **Response Validation**: Automatic response validation

### **Data Flow**

**Component** → **API Service** → **Backend Service** → **Database**

## 🎨 **Shared User Interface Patterns**

### **Tab-Based Organization**

All editing interfaces use tab-based organization to separate concerns:

**Basic Info**: Core entity properties and metadata
**Features**: Entity features and abilities
**Description**: Entity description and lore
**System-Specific Tabs**: Additional tabs for system-specific functionality

### **Form Validation**

Comprehensive form validation using Zod schemas:

**Real-time Validation**: Validate fields as users type
**Error Display**: Clear error messages for validation failures
**Debounced Validation**: Performance-optimized validation timing
**Schema-based**: Consistent validation across all forms

### **Feature System Integration**

Seamless integration with the feature system:

**Shared Components**: Use shared FeaturesTab component
**Feature Progression**: Full support for feature progression management
**Modifier Support**: Ability adjustments and bonuses
**Choice Support**: Player choice options and selections

### **Responsive Design**

Mobile-friendly design patterns:

**Grid Layouts**: Responsive grid systems for form fields
**Flexible Components**: Components that adapt to screen size
**Touch-friendly**: Optimized for touch interactions
**Accessibility**: Proper ARIA labels and keyboard navigation

## 🔧 **Shared State Management**

### **Form State Management**

Comprehensive state management for entity editing:

**Form Data**: Complete entity data structure
**Validation State**: Current validation status and errors
**Loading States**: Loading indicators for async operations
**Feature State**: Feature progression and association state

### **Tab State Management**

Tab navigation and state management:

**Active Tab**: Currently selected tab
**Tab Data**: Data specific to each tab
**Navigation**: Tab switching and validation
**Persistence**: Maintain state across tab switches

### **Feature Integration State**

State management for feature system integration:

**Feature Progressions**: Current feature progression data
**Dialog States**: Feature association and editing dialogs
**Selection State**: Currently selected features and options
**Validation State**: Feature-specific validation

## 🎯 **Shared User Experience Patterns**

### **Navigation Flow**

**List** → **Detail** → **Edit**: Standard navigation pattern
**Edit** → **Tab Navigation**: Organized editing experience
**Save/Cancel**: Clear action patterns for form submission

### **Error Handling**

**Validation Errors**: Real-time form validation feedback
**API Errors**: Clear error messages for backend failures
**Loading States**: Appropriate loading indicators
**Recovery Options**: Clear paths for error recovery

### **Admin Integration**

**Admin-only Features**: Create, edit, and delete functionality
**Feature Management**: Advanced feature system integration
**Bulk Operations**: Efficient management of multiple entities

## 🔗 **Shared Integration Points**

### **Feature System Integration**

**Shared Components**: Use shared FeaturesTab component
**Feature Progression**: Full feature progression management
**Modifier System**: Ability adjustments and bonuses
**Choice System**: Player choice options and selections

### **Backend Integration**

**API Communication**: Seamless backend communication
**Data Validation**: Consistent data validation patterns
**Error Handling**: Comprehensive error handling
**Performance**: Optimized data loading and caching

## 📊 **Shared Performance Considerations**

### **Data Loading**

**Lazy Loading**: Load data only when needed
**Caching**: Cache frequently accessed data
**Pagination**: Handle large datasets efficiently
**Optimization**: Optimize component rendering

### **User Interface**

**Debounced Input**: Performance-optimized form input
**Virtual Scrolling**: Handle large lists efficiently
**Component Optimization**: Minimize unnecessary re-renders
**Memory Management**: Proper cleanup and memory usage

## 🔧 **Shared Development Guidelines**

### **Component Creation**

**TypeScript**: Use TypeScript for all components
**Props Interface**: Define clear props interfaces
**Error Boundaries**: Implement proper error handling
**Testing**: Write comprehensive component tests

### **State Management**

**Local State**: Use React hooks for local state
**Form State**: Use validated form patterns
**API State**: Handle loading and error states
**Feature State**: Integrate with feature system state

### **User Experience**

**Accessibility**: Implement proper accessibility features
**Responsive Design**: Ensure mobile-friendly design
**Performance**: Optimize for performance
**Error Handling**: Provide clear error feedback

### **API Integration Best Practices**

**Type Safety**:
- **Always use typed schemas**: Import schemas from `@shared/schema`
- **Leverage TypeScript**: Let the compiler catch type errors
- **Validate at runtime**: Use Zod schemas for runtime validation

**Error Handling**:
- **Catch and handle errors**: Always wrap API calls in try-catch
- **Provide user feedback**: Show loading states and error messages
- **Graceful degradation**: Handle network failures gracefully

**Performance**:
- **Minimize API calls**: Use caching where appropriate
- **Optimistic updates**: Update UI immediately, sync with server
- **Batch operations**: Group related API calls when possible

**Code Organization**:
- **Feature-based services**: Organize services by feature domain
- **Consistent naming**: Use consistent naming patterns across services
- **Documentation**: Include usage examples in service comments

### **Common API Patterns**

**List with Pagination**:
```typescript
const [items, setItems] = useState([]);
const [pagination, setPagination] = useState({ page: 1, limit: 10 });

const loadItems = async () => {
    const result = await ItemService.getItems(pagination);
    setItems(result.results);
    setPagination(prev => ({ ...prev, total: result.total }));
};
```

**Search and Filter**:
```typescript
const [filters, setFilters] = useState({});
const [searchResults, setSearchResults] = useState([]);

const performSearch = async () => {
    const result = await ItemService.itemQuery(filters);
    setSearchResults(result.results);
};
```

**Real-time Updates**:
```typescript
const [item, setItem] = useState(null);

const updateItem = async (updates) => {
    const result = await ItemService.updateItem(updates, { id: item.id });
    setItem(result); // Optimistic update
};
```

### **Form Best Practices**

**Schema Design**:
1. **Start simple**: Begin with basic validation and add complexity as needed
2. **Use meaningful error messages**: Help users understand what went wrong
3. **Validate at the right level**: Don't over-validate simple fields
4. **Group related validations**: Use `.refine()` for complex cross-field validation

**Form Structure**:
1. **Logical grouping**: Group related fields together
2. **Clear labels**: Use descriptive, user-friendly labels
3. **Required indicators**: Clearly mark required fields with asterisks
4. **Helpful placeholders**: Provide examples or guidance in placeholders

**User Experience**:
1. **Immediate feedback**: Validate on change or blur for quick feedback
2. **Clear error messages**: Make error messages specific and actionable
3. **Accessibility**: Ensure forms work with screen readers and keyboard navigation
4. **Loading states**: Show loading indicators during form submission

**Performance**:
1. **Debounce validation**: Use debouncing for expensive validation operations
2. **Memoize schemas**: Don't recreate schemas on every render
3. **Efficient validation**: Only validate what's necessary
4. **Lazy validation**: Consider validating on blur rather than change for complex fields

### **List Component Best Practices**

**Column Organization**:
1. **Put important columns first**: Users see the most critical information immediately
2. **Use consistent sizing**: Similar types of data should have similar column widths
3. **Mark required columns**: Use `required: true` for columns that should always be visible
4. **Add filters to searchable columns**: Enable filtering on columns users commonly search

**Performance Considerations**:
1. **Efficient data fetching**: Implement proper pagination in your API
2. **Debounced filters**: For large datasets, consider debouncing text input filters
3. **Memoize column definitions**: Prevent unnecessary re-renders by memoizing your column arrays
4. **Lazy load data**: Only fetch data when the component is actually visible

**User Experience**:
1. **Provide meaningful column headers**: Use clear, descriptive names
2. **Add helpful filter placeholders**: Guide users on what they can search for
3. **Use appropriate filter types**: Match filter types to your data structure
4. **Consider mobile users**: Ensure your table works well on smaller screens

**Type Safety**:
Always define your data types and use them with GenericList. The component uses TanStack Table's `ColumnDef<T, unknown>[]` format for type-safe column definitions:

```typescript
interface MyDataType {
    id: number;
    name: string;
    status: 'active' | 'inactive';
    createdAt: Date;
}

const columns: ColumnDef<MyDataType, unknown>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
        enableSorting: true,
        enableColumnFilter: true,
        meta: {
            required: true,
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by name...'
        }
    }
];

<GenericList<MyDataType>
    storageKey="my-list"
    columns={columns}
    serviceFunction={fetchMyData}
    itemDesc="item"
/>
```

For complete examples, see the implementation in [SpellList.tsx](../../../apps/frontend/src/features/spell/SpellList.tsx) and [SpellColumns.ts](../../../apps/frontend/src/features/spell/SpellColumns.ts).

## 🎨 **Shared Form Design Patterns**

### **Progressive Disclosure**

**Basic Information**: Start with essential fields
**Advanced Options**: Reveal advanced options as needed
**Contextual Help**: Provide help text for complex fields
**Validation Feedback**: Show validation errors immediately

### **Data Entry Patterns**

**Auto-save**: Save data automatically to prevent loss
**Draft Mode**: Allow saving incomplete data as drafts
**Validation**: Real-time validation with clear error messages
**Confirmation**: Confirm destructive actions before execution

## 🧭 **Shared Navigation Patterns**

### **Breadcrumb Navigation**

**Hierarchical Structure**: Show current location in hierarchy
**Quick Navigation**: Allow quick navigation to parent levels
**Context Awareness**: Maintain context during navigation
**History Support**: Support browser back/forward navigation

### **Tab Navigation**

**Logical Grouping**: Group related information in tabs
**Persistent State**: Maintain tab state during navigation
**Quick Access**: Allow direct access to specific tabs
**Visual Feedback**: Clear indication of active tab

## 📢 **Shared Feedback Patterns**

### **Loading States**

**Skeleton Screens**: Show content structure while loading
**Progress Indicators**: Show progress for long operations
**Optimistic Updates**: Update UI immediately for better perceived performance
**Error Recovery**: Provide clear options for error recovery

### **Success Feedback**

**Toast Notifications**: Show success messages briefly
**Visual Confirmation**: Provide visual confirmation of actions
**State Updates**: Update UI state to reflect changes
**Navigation**: Navigate to appropriate location after success

## 🛡️ **Shared Error Handling**

### **Error Types**

**Network Errors**:
- **Connection Errors**: Handle network connectivity issues
- **Timeout Errors**: Handle request timeouts
- **Server Errors**: Handle server-side errors
- **API Errors**: Handle API-specific error responses

**Validation Errors**:
- **Form Validation**: Handle form validation errors
- **Schema Validation**: Handle schema validation errors
- **Business Rule Errors**: Handle business rule violations
- **User Input Errors**: Handle user input errors

### **Error Recovery**

**Automatic Recovery**:
- **Retry Logic**: Automatically retry failed requests
- **Fallback Data**: Use fallback data when primary data unavailable
- **Graceful Degradation**: Degrade functionality gracefully
- **State Recovery**: Recover component state after errors

**User Recovery**:
- **Error Messages**: Provide clear, actionable error messages
- **Recovery Options**: Provide options for error recovery
- **Manual Retry**: Allow users to manually retry failed operations
- **Alternative Actions**: Provide alternative actions when primary action fails

## 🔧 **Shared Testing and Quality Assurance**

### **Component Testing**

**Unit Testing**:
- **Component Rendering**: Test component rendering and props
- **User Interactions**: Test user interactions and event handlers
- **State Changes**: Test component state changes
- **Error Handling**: Test error handling and edge cases

**Integration Testing**:
- **API Integration**: Test integration with backend APIs
- **Data Flow**: Test data flow through components
- **User Workflows**: Test complete user workflows
- **Error Scenarios**: Test error scenarios and recovery

### **Quality Assurance**

**Accessibility**:
- **ARIA Labels**: Proper ARIA labels for screen readers
- **Keyboard Navigation**: Full keyboard navigation support
- **Color Contrast**: Adequate color contrast for readability
- **Focus Management**: Proper focus management for accessibility

**Responsive Design**:
- **Mobile Support**: Full support for mobile devices
- **Tablet Support**: Optimized for tablet devices
- **Desktop Support**: Full functionality on desktop devices
- **Cross-browser**: Support for major browsers

## 📋 **Summary**

This consolidated frontend components documentation provides shared patterns and principles that apply across all systems:

- **Consistent Architecture**: All systems follow the same hierarchical component structure
- **Shared Patterns**: Common patterns for forms, navigation, and user experience
- **Performance Optimization**: Shared strategies for performance and optimization
- **Error Handling**: Consistent error handling and recovery patterns
- **Development Standards**: Common development guidelines and best practices
- **Integration Patterns**: Shared patterns for system integration

By following these shared patterns, developers can create consistent, maintainable, and user-friendly frontend components across all systems in the D&D Tools application.
