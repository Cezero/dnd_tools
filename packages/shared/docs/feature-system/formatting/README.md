# Feature Formatting System Documentation

## Overview

The Feature Formatting System is a core component of the D&D Tools feature system that implements a 6-layer clean architecture for formatting feature progressions, modifiers, choices, and effects. This system provides consistent, maintainable, and extensible formatting across all feature-related displays in the application.

## Architecture

The formatting system follows a **6-layer clean architecture**:

```
Layer 6: Display Strategies (Highest Layer - Orchestrators)
├── EditPageDisplayStrategy (orchestrates all layers for edit pages)
├── DetailPageDisplayStrategy (orchestrates all layers for detail pages)
├── CharacterSheetDisplayStrategy (orchestrates all layers for character sheets)
└── DisplayStrategyFactory (creates strategy instances)

Layer 5: Grouping Strategies
├── ModifierGroupingStrategy
├── PipeGroupingStrategy
└── Other grouping strategies

Layer 4: Transition Detection
├── TransitionDetector
└── Progression value analysis

Layer 3: Progression Generation
├── ProgressionGenerator
└── Formula-based value generation

Layer 2: Value Calculation
├── FormulaCalculator
└── Calculation breakdown generation

Layer 1: Pure Formatters (Lowest Layer)
├── BaseFormatter implementations
├── ChoiceFormatter implementations
└── EffectFormatter implementations
```

## Key Principles

### **Dependency Inversion**
- High-level layers (6) depend on abstractions (interfaces)
- Low-level layers (1-5) implement abstractions
- Display Strategies orchestrate all lower layers through the 6-layer process

### **Single Responsibility**
- Each layer has one clear, well-defined responsibility
- Pure formatters only format values
- Calculators only calculate values
- Display strategies only orchestrate the process

### **Formula Property-Based Routing**
The system intelligently routes formula calls based on formula properties:
- **`isCharacterDependent: true`** + no character data → Use `.getDisplayString()`
- **`isCharacterDependent: true`** + has character data → Use `.calculate()`
- **`isCharacterDependent: false`** → Always use `.calculate()`
- **`hasProgression: false`** → Don't generate progression values

## Documentation Structure

### **Core Documentation**
- **[Usage Guidelines](./usage-guidelines.md)** - Comprehensive guidelines for agents and developers
- **[Final Implementation Summary](./final-implementation-summary.md)** - Complete implementation overview
- **[Refactoring Strategy](./refactoring-strategy.md)** - Architecture design decisions and patterns

### **Key Files**
- `frontend/src/lib/formatters/display-strategies.ts` - Display strategy implementations (Layer 6)
- `frontend/src/lib/formatters/formatter-registry.ts` - Formatter registration and lookup (Layer 1)
- `frontend/src/lib/formatters/types.ts` - Type definitions and interfaces
- `frontend/src/lib/formatters/pure-formatters.ts` - Pure formatter implementations (Layer 1)

### **Key Exports**
- `displayStrategyFactory` - Strategy creation factory (returns singletons)
- `formatterRegistry` - Formatter registration system (for internal use)

## Usage Patterns

### **Using Display Strategies (Recommended)**
```typescript
import { displayStrategyFactory } from '@/lib/formatters';
import { DisplayType } from '@shared/static-data';

// Edit page formatting
const editStrategy = displayStrategyFactory.createStrategy(DisplayType.Edit);
const editResult = editStrategy.formatProgression(progression, context, metadata);

// Detail page formatting
const detailStrategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
const detailResult = detailStrategy.formatProgressions(progressions, context, metadata);

// Character sheet formatting
const characterStrategy = displayStrategyFactory.createStrategy(DisplayType.CharacterSheet);
const characterResult = characterStrategy.formatProgressions(progressions, context, metadata);
```

### **Display Types**
- **`DisplayType.Edit`** - For feature editing interfaces (no character data needed)
- **`DisplayType.Detail`** - For feature detail displays (no character data needed)
- **`DisplayType.CharacterSheet`** - For character sheet displays (character data available)

## Integration with Feature System

The formatting system is tightly integrated with the feature system:

- **Feature Progressions** - Formatted based on level and progression data
- **Feature Modifiers** - Formatted based on type, value, and conditions
- **Feature Choices** - Formatted based on choice type and behavior
- **Feature Effects** - Formatted based on effect type and parameters

## Recent Refactoring

The formatting system underwent a major refactoring to fix architectural inversions:

1. **Removed FormatterOrchestrator** - Eliminated the incorrect Layer 7
2. **Enhanced Display Strategies** - Made them true orchestrators of all 6 layers
3. **Fixed Formula Routing** - Implemented intelligent routing based on formula properties
4. **Resolved Circular Dependencies** - Fixed dependency issues between components

## Testing

The formatting system includes comprehensive testing patterns:

- **Unit Testing** - Test each layer independently
- **Integration Testing** - Test display strategy orchestration
- **Formula Testing** - Test formula property-based routing

## Contributing

When contributing to the formatting system:

1. **Follow the 6-layer architecture** - Don't create layers above Display Strategies
2. **Use the factory pattern** - Access strategies through `displayStrategyFactory`
3. **Respect formula properties** - Use `isCharacterDependent` and `hasProgression` for routing
4. **Maintain separation of concerns** - Each layer should have single responsibility

## Related Documentation

- **[Feature System Overview](../README.md)** - Main feature system documentation
- **[Formula System Analysis](../formula-system-analysis.md)** - Formula system details
- **[Feature Progression Management](../feature-progression-management.md)** - Progression system details
