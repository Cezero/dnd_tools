# DiceBox Toast Integration

This document describes the toast notification system for dice roll results in the DiceBox component.

## Overview

The DiceBox now automatically shows toast notifications when dice rolls are completed. The toasts display:
- Roll notation and group (if specified)
- Individual die results with special styling for critical hits/failures
- Total result
- Automatic timeout and swipe-to-dismiss functionality

## Features

### Automatic Toast Display
- **Real-time notifications**: Toasts appear immediately when dice rolls complete
- **Critical hit detection**: Natural 20s and max values get special green styling
- **Critical failure detection**: Natural 1s (except d1) get special red styling
- **Group support**: Shows context like "Initiative Roll", "Damage Roll", etc.
- **Responsive design**: Works on all screen sizes
- **Theme support**: Light/dark mode compatible

### Toast Styling
- **Critical Success**: Green gradient background with shadow
- **Critical Failure**: Red gradient background with shadow  
- **Regular Rolls**: Subtle background with border
- **Position**: Top-right corner, non-intrusive
- **Animation**: Smooth enter/exit transitions
- **Accessibility**: Screen reader friendly with proper ARIA labels

## Usage

### Automatic Integration
The toast system is automatically integrated into the `DiceBoxProvider`. No additional setup required:

```tsx
import { DiceBoxProvider } from '@/components/dice-box';

function App() {
  return (
    <DiceBoxProvider userDiceConfig={userConfig}>
      {/* Your app content */}
    </DiceBoxProvider>
  );
}
```

### Manual Toast Creation
You can manually create toasts for testing or custom scenarios:

```tsx
import { useDiceBoxToast, DiceResultParser, createDiceResultToastData } from '@/components/dice-box';

function MyComponent() {
  const toastManager = useDiceBoxToast();
  
  const showCustomToast = () => {
    const result = {
      notation: '1d20',
      results: [20], // Critical success
      total: 20,
      group: 'custom'
    };
    
    const parsedResult = DiceResultParser.parseResult(result);
    const toastData = createDiceResultToastData(parsedResult);
    toastManager.add(toastData);
  };
  
  return <button onClick={showCustomToast}>Show Custom Toast</button>;
}
```

### Testing
Use the `DiceBoxToastTest` component to test the toast system:

```tsx
import { DiceBoxToastTest } from '@/components/dice-box';

function TestPage() {
  return <DiceBoxToastTest />;
}
```

## Configuration

### Toast Settings
The toast system is configured with these defaults:
- **Limit**: 5 concurrent toasts
- **Timeout**: 5 seconds (6 seconds for special results)
- **Position**: Top-right corner
- **Swipe direction**: Up to dismiss

### Customization
You can customize the toast appearance by modifying:
- `DiceResultToast.module.css` - Styling
- `DiceResultParser.ts` - Result formatting
- `DiceResultToast.tsx` - Component structure

## API Reference

### Hooks
- `useDiceBox()` - Main DiceBox context
- `useDiceBoxToast()` - Access toast manager

### Components
- `DiceResultToast` - Custom toast component
- `DiceBoxToastTest` - Testing component

### Utilities
- `DiceResultParser.parseResult()` - Parse dice results
- `createDiceResultToastData()` - Create toast data
- `DiceResultParser.generateSummary()` - Generate compact summaries

### Types
- `ParsedDiceResult` - Parsed result structure
- `DiceResult` - Raw dice result

## Examples

### Different Roll Types
```tsx
// Simple roll
rollDice('1d6'); // Shows: "Dice Roll: 1d6 → 4 = 4"

// Grouped roll  
rollDice('1d20', 'initiative'); // Shows: "Initiative Roll: 1d20 → 20 = 20"

// Multiple dice
rollDice('3d6'); // Shows: "Dice Roll: 3d6 → 4, 6, 2 = 12"

// Critical success
rollDice('1d20'); // If result is 20: "Dice Roll: 1d20 → 🎯20 = 20"

// Critical failure  
rollDice('1d20'); // If result is 1: "Dice Roll: 1d20 → 💥1 = 1"
```

### Manual Toast Examples
```tsx
// Test critical success
const testResult = {
  notation: '1d20',
  results: [20],
  total: 20,
  group: 'test'
};

// Test critical failure
const testResult = {
  notation: '1d20', 
  results: [1],
  total: 1,
  group: 'test'
};

// Test mixed results
const testResult = {
  notation: '3d6',
  results: [6, 1, 4], // Critical success, critical failure, regular
  total: 11,
  group: 'test'
};
```

## Browser Support
- Modern browsers with CSS Grid and Flexbox support
- Mobile-friendly with touch gestures
- Screen reader compatible
- Keyboard navigation support

## Performance
- Lightweight toast system
- Efficient result parsing
- Automatic cleanup of expired toasts
- No impact on dice rolling performance 
