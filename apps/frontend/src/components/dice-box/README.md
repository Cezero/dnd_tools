# DiceBox Integration

This module provides a clean, reusable interface for 3D dice rolling functionality using the `@3d-dice/dice-box` library.

## Features

- **Centralized Management**: All DiceBox initialization and lifecycle management is handled by the `DiceBoxProvider`
- **Simple API**: Components can easily roll dice using the `useDiceBox` hook
- **Type Safety**: Full TypeScript support with proper interfaces
- **Automatic Cleanup**: Proper cleanup and event listener management
- **Roll Tracking**: Track pending rolls and results with grouping support

## Usage

### 1. Setup (Already done in Layout.tsx)

The `DiceBoxProvider` is already set up in the main `Layout.tsx` component, so all child components have access to the dice functionality.

#### Theme Configuration

You can configure the DiceBox theme by passing a `themeConfig` prop to the `DiceBoxProvider`:

```tsx
<DiceBoxProvider 
    themeConfig={{
        theme: 'rock',           // 'default', 'rock', 'dice-of-rolling', 'blue-green-metal', 'gemstone', 'rust', 'smooth', 'wooden'
        themeColor: '#3937b8',   // Any hex color
        scale: 3                 // 2, 3, or 4
    }}
>
    {children}
</DiceBoxProvider>
```

### 2. Using in Components

```tsx
import React from 'react';
import { useDiceBox } from '@/components/dice-box';

export function MyComponent(): React.JSX.Element {
    const { rollDice, isReady, isRolling, pendingRoll, lastResult } = useDiceBox();

    const handleRoll = () => {
        rollDice('3d6', 'my-roll-group');
    };

    return (
        <div>
            <button 
                onClick={handleRoll}
                disabled={!isReady || isRolling}
            >
                {isRolling && pendingRoll === 'my-roll-group' ? 'Rolling...' : 'Roll 3d6'}
            </button>
            
            {lastResult && lastResult.group === 'my-roll-group' && (
                <div>
                    <p>Result: {lastResult.total}</p>
                    <p>Individual rolls: [{lastResult.results.join(', ')}]</p>
                </div>
            )}
        </div>
    );
}
```

### 3. API Reference

#### `useDiceBox()` Hook

Returns an object with the following properties:

- **`rollDice(notation: string, group?: string)`**: Roll dice with the given notation (e.g., '3d6', '1d20+5')
- **`isReady: boolean`**: Whether the DiceBox is initialized and ready to use
- **`isRolling: boolean`**: Whether any dice are currently rolling
- **`pendingRoll: string | null`**: The group name of the currently pending roll (if any)
- **`lastResult: DiceResult | null`**: The result of the last completed roll
- **`onRollComplete(callback)`**: Register a callback to be called when rolls complete
- **`clearResults()`**: Clear the last result

#### `DiceResult` Interface

```tsx
interface DiceResult {
    notation: string;    // The dice notation that was rolled (e.g., '3d6')
    results: number[];   // Individual die results
    total: number;       // Sum of all results
    group?: string;      // The group name passed to rollDice
}
```

### 4. Advanced Usage

#### Using Roll Complete Callbacks

```tsx
import React, { useEffect } from 'react';
import { useDiceBox } from '@/components/dice-box';

export function AdvancedComponent(): React.JSX.Element {
    const { rollDice, onRollComplete } = useDiceBox();

    useEffect(() => {
        // Register a callback for when rolls complete
        const cleanup = onRollComplete((result) => {
            console.log(`Roll completed: ${result.notation} = ${result.total}`);
            // Do something with the result
        });

        // Cleanup the callback when component unmounts
        return cleanup;
    }, [onRollComplete]);

    return (
        <button onClick={() => rollDice('1d20', 'initiative')}>
            Roll Initiative
        </button>
    );
}
```

#### Multiple Roll Groups

```tsx
export function CharacterSheet(): React.JSX.Element {
    const { rollDice, lastResult, pendingRoll } = useDiceBox();

    return (
        <div>
            <button onClick={() => rollDice('4d6', 'strength')}>
                Roll Strength
            </button>
            <button onClick={() => rollDice('4d6', 'dexterity')}>
                Roll Dexterity
            </button>
            
            {lastResult && (
                <div>
                    <h3>{lastResult.group} Result</h3>
                    <p>Total: {lastResult.total}</p>
                </div>
            )}
        </div>
    );
}
```

## Migration from Old Pattern

### Before (Old Pattern)
```tsx
// Lots of boilerplate code in useEffect
useEffect(() => {
    let mounted = true;
    const waitForDiceBoxContainer = async () => {
        // 40+ lines of initialization code
    };
    waitForDiceBoxContainer();
    return () => {
        mounted = false;
        destroyDiceBox();
    };
}, []);
```

### After (New Pattern)
```tsx
// Simple hook usage
const { rollDice, isReady, lastResult } = useDiceBox();
```

## Architecture

- **`DiceBoxProvider.tsx`**: Context provider that manages DiceBox lifecycle
- **`useDiceBox.ts`**: Hook for easy access to dice functionality
- **`DiceBox.ts`**: Core DiceBox singleton management with theme configuration
- **`Layout.tsx`**: Wraps the app with DiceBoxProvider and provides the container
- **`DiceBoxThemeExample.tsx`**: Example component demonstrating theme configuration

The DiceBox canvas is attached to the `[data-dice-box]` element in the Layout component, which covers the entire viewport for the 3D dice animation.

## Available Themes

The following themes are available (based on the assets in `/public/assets/dice-box/themes/`):

- **`default`**: Default dice theme
- **`rock`**: Rock-themed dice
- **`dice-of-rolling`**: Dice of Rolling theme
- **`blue-green-metal`**: Blue green metal dice
- **`gemstone`**: Gemstone-textured dice
- **`rust`**: Rust-textured dice
- **`smooth`**: Smooth dice
- **`wooden`**: Wooden dice

## Theme Configuration

The `DiceBoxThemeConfig` interface allows you to customize:

- **`theme`**: The dice theme to use
- **`themeColor`**: The color of the dice (hex color string)
- **`scale`**: The size of the dice (2 = small, 3 = medium, 4 = large)

**Note**: Theme changes require re-initialization of the DiceBox instance. In a production application, you would implement theme switching by destroying and recreating the DiceBox with new configuration.
