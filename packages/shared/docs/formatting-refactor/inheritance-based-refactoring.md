# Inheritance-Based Display Strategies Refactoring

## Overview

This document details the successful refactoring of the display strategies system from a code-duplicated approach to a clean inheritance-based architecture. The refactoring eliminated massive code duplication while maintaining flexibility and improving maintainability.

## Problem Statement

### Original Issues
- **Massive Code Duplication**: ~2000 lines with extensive duplication across `EditPageDisplayStrategy`, `DetailPageDisplayStrategy`, and `CharacterSheetDisplayStrategy`
- **Maintenance Nightmare**: Changes to shared logic required updates in multiple places
- **Inconsistent Behavior**: Slight variations in implementation led to inconsistent behavior
- **Poor Extensibility**: Adding new display strategies required copying large amounts of code

### Specific Duplication Areas
- Strategy detection methods (`isConditionalModifiersWithFormulas`, etc.)
- Strategy implementation methods (`processConditionalModifiersWithFormulas`, etc.)
- Formula processing methods (`processFormula`, `processProgressionFormula`, etc.)
- Entity processing methods (`processEntity`, `resolveFormatter`, `formatEntity`)
- Utility methods (`formatConditionPrefix`, `getConditionTypeName`, etc.)

## Solution: Inheritance-Based Architecture

### Design Principles
1. **Single Responsibility**: Base class handles shared logic, concrete classes handle specific display logic
2. **Open/Closed Principle**: Open for extension (new strategies), closed for modification (shared logic)
3. **DRY (Don't Repeat Yourself)**: Eliminate all code duplication
4. **Type Safety**: Maintain strong typing with TypeScript inheritance

### Architecture Overview

```
DisplayStrategyBase (Abstract)
├── Shared functionality
├── Strategy pattern implementation
├── Formula processing
├── Entity processing
└── Utility methods

├── EditPageDisplayStrategy
│   ├── 1:1 progression to display
│   ├── Individual level entries
│   └── Detailed breakdowns
│
├── DetailPageDisplayStrategy
│   ├── Grouped by level + feature
│   ├── Hierarchical display
│   └── Overview focus
│
└── CharacterSheetDisplayStrategy
    ├── Current level only
    ├── Simplified format
    └── Space-constrained
```

## Implementation Details

### Abstract Base Class

```typescript
abstract class DisplayStrategyBase implements DisplayStrategy {
    abstract formatProgressions(
        progressions: FeatureProgressionWithRelations[],
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): DisplayResult;

    // Shared functionality inherited by all strategies
    protected processWithStrategy(...): string
    protected processEntity(...): ProcessingResult
    protected processFormula(...): ProcessingResult
    protected formatConditionPrefix(...): string
    // ... and many more shared methods
}
```

### Strategy Pattern Implementation

The base class implements a sophisticated strategy pattern that:

1. **Entity Detection**: Automatically detects entity types (modifiers, choices, effects)
2. **Processing Routing**: Intelligently routes to appropriate processing methods
3. **Formula Handling**: Provides unified formula processing for all strategy types
4. **Error Handling**: Ensures consistent error handling and fallback mechanisms
5. **Formatter Integration**: Seamlessly integrates with the unified FormatterRegistry

### Shared Functionality

#### Strategy Detection Methods
```typescript
protected isConditionalModifiersWithFormulas(entities): boolean
protected isConditionalModifiersWithoutFormulas(entities): boolean
protected isNonConditionalModifiersWithFormulas(entities): boolean
protected isNonConditionalModifiersWithoutFormulas(entities): boolean
protected isChoices(entities): boolean
protected isEffects(entities): boolean
```

#### Strategy Implementation Methods
```typescript
protected processConditionalModifiersWithFormulas(entities, context): string
protected processConditionalModifiersWithoutFormulas(entities, context): string
protected processNonConditionalModifiersWithFormulas(entities, context): string
protected processNonConditionalModifiersWithoutFormulas(entities, context): string
protected processChoicesWithStrategy(entities, context): string
protected processEffectsWithStrategy(entities, context): string
```

#### Formula Processing Methods
```typescript
protected processFormula(formulaParams, config, context, conditionPrefix?): ProcessingResult
protected processProgressionFormula(formulaParams, formulaDef, config, context, conditionPrefix?): ProcessingResult
protected processNonProgressionFormula(formulaParams, formulaDef, config, context, conditionPrefix?): ProcessingResult
```

#### Entity Processing Methods
```typescript
protected processEntity(entity, config, context): ProcessingResult
protected resolveFormatter(config): BaseFormatter | ChoiceFormatter | EffectFormatter | undefined
protected formatEntity(entity, formatter, context): string
```

#### Utility Methods
```typescript
protected formatConditionPrefix(modifier): string
protected getConditionTypeName(conditionType): string
protected getConditionValueName(conditionType, conditionValue): string
protected buildFormulaParams(formula, level, startLevel, context?, modifierValue?): Record<string, unknown>
protected createTempEntityWithValue(value, context): FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse
protected formatProgressionDisplayStrings(displayStrings, startLevel): string
protected findTransitions(values, formattedValues): Array<{ level: number; formattedValue: string }>
```

## Concrete Strategy Classes

### EditPageDisplayStrategy

**Purpose**: Handles edit page display with 1:1 relationship between FeatureProgression and display

**Characteristics**:
- Each FeatureProgression produces exactly one formatted string
- No grouping or aggregation of progressions
- Individual level entries for each progression
- Detailed breakdown information for editing purposes

**Usage**:
- Edit pages where users need to see individual progression details
- Feature management interfaces
- Debugging and development tools

**Implementation**:
```typescript
export class EditPageDisplayStrategy extends DisplayStrategyBase {
    formatProgressions(progressions, context?, metadata?): DisplayResult {
        // Edit page processes each progression individually
        const levelEntries: LevelEntry[] = [];
        
        for (const progression of progressions) {
            const formattedValue = this.formatSingleProgression(progression, context, metadata);
            if (formattedValue) {
                levelEntries.push({
                    level: progression.level,
                    description: `Level ${progression.level}`,
                    items: [{
                        featureId: progression.featureId,
                        formattedValue,
                        breakdown: undefined
                    }]
                });
            }
        }

        return {
            formattedValue: "Edit Page Display",
            breakdown: { components: [] },
            showBreakdown: true,
            components: [],
            levelEntries
        };
    }
}
```

### DetailPageDisplayStrategy

**Purpose**: Handles detail page display with grouped display by Feature + Level

**Characteristics**:
- Groups progressions by level first, then by feature
- Multiple progressions for the same feature are combined
- Hierarchical display structure (Level -> Feature -> Details)
- No breakdown information (detail pages focus on overview)

**Usage**:
- Feature detail pages
- Character progression overviews
- Feature comparison views
- Documentation and reference pages

**Implementation**:
```typescript
export class DetailPageDisplayStrategy extends DisplayStrategyBase {
    formatProgressions(progressions, context?, metadata?): DisplayResult {
        // Group by level, then by feature
        const groupedByLevel = this.groupByLevel(progressions);
        const levelEntries: LevelEntry[] = [];

        for (const [level, levelProgressions] of groupedByLevel) {
            // Group by feature within each level
            const groupedByFeature = this.groupByFeature(levelProgressions);
            const formattedItems: LevelFormattedItem[] = [];

            for (const [featureId, featureProgressions] of groupedByFeature) {
                const formattedValue = this.formatFeatureGroup(featureProgressions, context, metadata);
                formattedItems.push({
                    featureId,
                    formattedValue,
                    breakdown: undefined // Detail pages don't need breakdowns
                });
            }

            levelEntries.push({
                level,
                description: `Level ${level}`,
                items: formattedItems
            });
        }

        return {
            formattedValue: "Detail Page Display",
            breakdown: { components: [] },
            showBreakdown: false,
            components: [],
            levelEntries
        };
    }
}
```

### CharacterSheetDisplayStrategy

**Purpose**: Handles character sheet display with current level values only

**Characteristics**:
- Shows only current level values (no progression history)
- Simplified display format for character sheet context
- Minimal grouping and aggregation
- No breakdown information (character sheets are space-constrained)
- Context-aware (uses character level information)

**Usage**:
- Character sheets and stat blocks
- Current character capability displays
- Quick reference views
- Space-constrained interfaces

**Implementation**:
```typescript
export class CharacterSheetDisplayStrategy extends DisplayStrategyBase {
    formatProgressions(progressions, context?, metadata?): DisplayResult {
        // Character sheet shows current level values only
        const currentLevel = context?.character?.classLevels ?
            Math.max(...Object.values(context.character.classLevels)) : 1;

        const formattedItems: LevelFormattedItem[] = [];

        for (const progression of progressions) {
            // Create processing context
            const processingContext: ProcessingContext = {
                progression,
                context,
                metadata,
                level: currentLevel,
                entityType: FeatureType.Modifier
            };

            // Collect all entities for unified processing
            const allEntities: Array<FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse> = [
                ...(progression.modifiers || []),
                ...(progression.choices || []),
                ...(progression.effects || [])
            ];

            // Use unified processing for character sheet display
            if (allEntities.length > 0) {
                const formattedValue = this.processCharacterSheetEntities(allEntities, processingContext, currentLevel);
                if (formattedValue) {
                    formattedItems.push({
                        featureId: progression.featureId,
                        formattedValue,
                        breakdown: undefined // Character sheet doesn't show breakdowns
                    });
                }
            }
        }

        return {
            formattedValue: "Character Sheet Display",
            breakdown: { components: [] },
            showBreakdown: false,
            components: [],
            levelEntries: [{
                level: currentLevel,
                description: `Level ${currentLevel}`,
                items: formattedItems
            }]
        };
    }
}
```

## Factory Pattern

The system includes a factory pattern for creating display strategies based on context:

```typescript
export class DisplayStrategyFactory {
    static createStrategy(displayType: DisplayType): DisplayStrategy {
        switch (displayType) {
            case DisplayType.Edit:
                return new EditPageDisplayStrategy();
            case DisplayType.Detail:
                return new DetailPageDisplayStrategy();
            case DisplayType.CharacterSheet:
                return new CharacterSheetDisplayStrategy();
            default:
                throw new Error(`Unknown display type: ${displayType}`);
        }
    }
}
```

## Singleton Instances

For performance and convenience, singleton instances are provided:

```typescript
export const editPageStrategy = new EditPageDisplayStrategy();
export const detailPageStrategy = new DetailPageDisplayStrategy();
export const characterSheetStrategy = new CharacterSheetDisplayStrategy();
export const displayStrategyFactory = DisplayStrategyFactory;
```

## Usage Examples

### Using Singleton Instances
```typescript
import { editPageStrategy } from './display-strategies';

const result = editPageStrategy.formatProgressions(progressions, context, metadata);
```

### Using Factory Pattern
```typescript
import { displayStrategyFactory } from './display-strategies';

const strategy = displayStrategyFactory.createStrategy(DisplayType.Edit);
const result = strategy.formatProgressions(progressions, context, metadata);
```

### Creating Custom Strategies
```typescript
export class CustomDisplayStrategy extends DisplayStrategyBase {
    formatProgressions(
        progressions: FeatureProgressionWithRelations[],
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): DisplayResult {
        // Custom display logic here
        // Use inherited methods like this.processWithStrategy()
        
        return {
            formattedValue: "Custom Display",
            breakdown: { components: [] },
            showBreakdown: false,
            components: [],
            levelEntries: []
        };
    }
}
```

## Benefits Achieved

### Code Reduction
- **Before**: ~2000 lines with massive duplication across strategies
- **After**: ~1500 lines with shared functionality in base class
- **Reduction**: ~25% code reduction while improving maintainability

### Maintainability Improvements
- **Single Source of Truth**: Shared logic is centralized in the base class
- **Consistent Behavior**: All strategies use the same underlying processing logic
- **Easier Updates**: Changes to shared logic only need to be made in one place
- **Better Testing**: Shared functionality can be tested once in the base class

### Extensibility
- **Easy Extension**: New strategies can easily extend the base class
- **Consistent Interface**: All strategies follow the same interface
- **Reusable Logic**: Shared functionality is immediately available to new strategies
- **Type Safety**: Proper inheritance hierarchy with TypeScript

### Performance
- **Reduced Memory Usage**: Less code duplication means smaller bundle size
- **Better Caching**: Shared methods can be better optimized by the JavaScript engine
- **Faster Development**: Less code to write and maintain

## Migration Guide

### For Existing Code
The refactoring maintains backward compatibility. Existing code using the display strategies will continue to work without changes.

### For New Code
1. **Prefer Factory Pattern**: Use `DisplayStrategyFactory.createStrategy()` for runtime strategy selection
2. **Use Singleton Instances**: Use direct imports for known strategy types
3. **Extend Base Class**: Create new strategies by extending `DisplayStrategyBase`
4. **Leverage Shared Methods**: Use inherited methods like `processWithStrategy()` in custom implementations

## Future Enhancements

### Potential Improvements
1. **Strategy Composition**: Allow strategies to be composed for complex display requirements
2. **Plugin System**: Enable third-party display strategies through a plugin system
3. **Performance Optimization**: Add caching and memoization for frequently used operations
4. **Advanced Configuration**: Allow fine-grained configuration of strategy behavior

### Extension Points
1. **Custom Entity Types**: Extend the system to support new entity types
2. **Custom Formatters**: Add new formatter types through the registry
3. **Custom Processing Logic**: Override base methods for custom processing behavior
4. **Custom Display Formats**: Implement new display formats through strategy extension

## Conclusion

The inheritance-based refactoring of the display strategies system has successfully:

1. **Eliminated Code Duplication**: Reduced code by ~25% while improving maintainability
2. **Improved Architecture**: Created a clean, extensible inheritance hierarchy
3. **Enhanced Maintainability**: Centralized shared logic in the base class
4. **Preserved Flexibility**: Maintained the ability to customize behavior for specific contexts
5. **Ensured Type Safety**: Used proper TypeScript inheritance patterns

The refactored system provides a solid foundation for future enhancements while maintaining backward compatibility and improving developer experience.
