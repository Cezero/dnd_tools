# Log Panel Component

A global log panel that provides a centralized logging system for the application. The panel is hidden by default and can be activated by moving the mouse to the bottom edge of the viewport.

## Features

- **Global Access**: Any component can add log entries using the `useLogPanel` hook
- **Mouse Activation**: Panel appears when mouse is moved to bottom edge of viewport
- **Auto-scroll**: Automatically scrolls to show the most recent entries
- **Entry Management**: Maintains last 500 entries with automatic cleanup
- **Dice Integration**: Automatically logs dice roll results with the same formatting as toasts
- **Type Support**: Supports different log types (info, success, warning, error)
- **Dark Mode**: Fully supports dark mode styling

## Usage

### Basic Usage

```tsx
import { useLogPanel } from '@/components/log-panel';

function MyComponent() {
  const logPanel = useLogPanel();

  const handleAction = () => {
    logPanel.addLogEntry({
      message: 'Action completed successfully',
      type: 'success',
      source: 'my-component'
    });
  };

  return <button onClick={handleAction}>Do Action</button>;
}
```

### Log Types

- `'info'` - Default informational messages
- `'success'` - Successful operations
- `'warning'` - Warning messages
- `'error'` - Error messages

### Dice Integration

The log panel automatically integrates with the DiceBox system. When dice are rolled, the results are automatically logged with the same formatting as the toast notifications.

## Components

### LogPanelProvider

The main provider component that manages the global log state. Must wrap the application.

### LogPanel

The main panel component that handles display and interaction.

### LogEntryComponent

Renders individual log entries with proper formatting.

### useLogPanel

Hook for accessing the log panel functionality from any component.

## API

### LogPanelContextType

```tsx
interface LogPanelContextType {
  addLogEntry: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLog: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  entries: LogEntry[];
}
```

### LogEntry

```tsx
interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  source?: string;
  data?: ParsedDiceResult | any;
}
```

## Integration

The LogPanel is automatically integrated into the main Layout component and provides global access to all child components. The DiceBox system automatically logs all dice roll results. 
