# Filter Tooltip Functionality

## Overview

The GenericList component now includes tooltip functionality for filter icons. When a column has an active filter, hovering over the filter icon (funnel) will display a tooltip showing the current filter value.

## Features

### Text Input Filters
- Shows the exact text value being filtered
- Example: "Dragon" or "Fireball"
- **Click to open**: Clicking the filter icon directly opens the text input field

### Single Select Filters
- Shows the human-readable label for the selected option
- Example: "School of Evocation" instead of "evocation"
- **Click to open**: Clicking the filter icon opens the filter options menu

### Multi-Select Filters
- Shows all selected values with appropriate delimiters
- Uses `&` for AND logic: "Fire & Ice & Lightning"
- Uses `|` for OR logic: "Fire | Ice | Lightning"
- Displays human-readable labels when available
- **Click to open**: Clicking the filter icon opens the filter options menu

### Interactive Filter Icons
- **Hover**: Shows tooltip with current filter value
- **Click**: Opens filter interface directly
  - Text inputs: Shows the floating text input field
  - Select filters: Opens the filter submenu within the existing context menu

## Implementation

### Components

1. **Base UI Tooltip Component** (`@base-ui-components/react/tooltip`)
   - Uses the official Base UI Tooltip component
   - Provides consistent styling and behavior
   - Supports dark mode and proper positioning

2. **Enhanced Context Menu** (`ColumnHeaderContextMenu.tsx`)
   - Reuses existing context menu structure
   - Supports both right-click on header and left-click on filter icon
   - Controlled context menu and filter submenu state for direct access
   - Proper state management to ensure menu opens when filter icon is clicked
   - Smart positioning: context menu appears at click location for all interactions
   - Right-click position capture for unfiltered columns
   - Submenu stability: temporarily disables main menu items to prevent accidental closure

3. **Filter Tooltip Utils** (`filterTooltipUtils.ts`)
   - `formatFilterTooltip()` function that formats filter values for display
   - Handles different filter types appropriately

### Usage

The tooltip and click functionality are automatically applied to filter icons in the `ColumnHeaderContextMenu` component:

```tsx
{header.column.getCanFilter() && columnFilters.some(f => f.id === header.id) && (
    <Tooltip.Root>
        <Tooltip.Trigger>
            <FunnelIconSolid 
                className="w-4 h-4 ml-1 inline-block cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" 
                onClick={handleFilterIconClick}
            />
        </Tooltip.Trigger>
        <Tooltip.Portal>
            <Tooltip.Positioner>
                <Tooltip.Popup className="px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded shadow-lg">
                    {formatFilterTooltip(
                        columnFilters.find(f => f.id === header.id),
                        header.column.columnDef.meta as any
                    )}
                </Tooltip.Popup>
            </Tooltip.Positioner>
        </Tooltip.Portal>
    </Tooltip.Root>
)}
```

### Click Handler

The click handler determines the appropriate action based on filter type:

```tsx
const handleFilterIconClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const filterConfig = header.column.columnDef.meta as any;
    
    if (filterConfig?.filterType === FilterType.TEXT_INPUT) {
        // For text input, trigger the text input visibility toggle
        handleFilterChange(header.id, { type: 'toggle_text_input' });
    } else {
        // For other filter types, open the context menu and filter submenu at click position
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setIsProgrammaticallyOpened(true);
        setIsContextMenuOpen(true);
        setIsFilterSubmenuOpen(true);
    }
};
```

## Example Outputs

### Text Input
```
Filter: "Dragon"
Tooltip: Dragon
```

### Single Select
```
Filter: School of Magic = "evocation"
Tooltip: School of Evocation
```

### Multi-Select (OR Logic)
```
Filter: Schools = ["evocation", "conjuration"] (OR)
Tooltip: School of Evocation | School of Conjuration
```

### Multi-Select (AND Logic)
```
Filter: Schools = ["evocation", "conjuration"] (AND)
Tooltip: School of Evocation & School of Conjuration
```

## Technical Details

### Filter Value Structure

The tooltip function expects filter values in this format:

```typescript
// Text input
{ id: "name", value: "Dragon" }

// Single select
{ id: "school", value: "evocation" }

// Multi select
{ 
  id: "schools", 
  value: { 
    values: ["evocation", "conjuration"], 
    logicType: "or" 
  } 
}
```

### Column Meta Structure

The column meta should contain:

```typescript
{
  filterType: FilterType.SINGLE_SELECT,
  options: [
    { value: "evocation", label: "School of Evocation" },
    { value: "conjuration", label: "School of Conjuration" }
  ]
}
```

## Styling

The tooltip uses Base UI's built-in styling with custom Tailwind classes:
- Dark background with white text
- Rounded corners and shadow
- Proper z-index and positioning handled by Base UI
- Responsive positioning to avoid screen edges
- Consistent with other Base UI components 
