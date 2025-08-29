# Formatter System Usage Guidelines for Agents

## Overview

This document provides comprehensive guidelines for agents working with the D&D Tools formatter system. The formatter system implements a 6-layer clean architecture that must be used correctly to maintain proper separation of concerns and avoid architectural violations.

## 🏗️ **Architecture Principles**

For complete architecture overview and layer descriptions, see **[README.md](./README.md)**.

### **Critical Architecture Rules**

#### ✅ **CORRECT: Proper Dependency Flow**
- **High-level layers** (6) depend on **abstractions** (interfaces)
- **Low-level layers** (1-5) implement **abstractions**
- **Display Strategies orchestrate** all lower layers through the 6-layer process
- **Factory pattern** handles strategy creation when needed
- **Display Strategies handle workflow** - input validation, layer coordination, result processing
- **Each layer has single responsibility** - pure formatting, calculation, grouping, etc.

#### ❌ **WRONG: Architecture Inversions**
- **Never** create layers above Display Strategies (Layer 6)
- **Never** create circular dependencies between layers
- **Never** mix coordination and object creation responsibilities
- **Never** violate single responsibility principle
- **Never** create wrapper functions that bypass display strategies
- **Never** access lower layers directly from consumer code

## 🎯 **Usage Patterns**

### **1. Using Display Strategies Directly**

#### ✅ **CORRECT: Use display strategies for complete formatting workflow**
```typescript
import { displayStrategyFactory } from '@/lib/formatters';
import { DisplayType } from '@shared/static-data';

// ✅ CORRECT: Use display strategies that orchestrate the complete 6-layer process
const editStrategy = displayStrategyFactory.createStrategy(DisplayType.Edit);
const editResult = editStrategy.formatProgression(progression, context, metadata);

const detailStrategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
const detailResult = detailStrategy.formatProgressions(progressions, context, metadata);

const characterStrategy = displayStrategyFactory.createStrategy(DisplayType.CharacterSheet);
const characterResult = characterStrategy.formatProgressions(progressions, context, metadata);
```

#### ❌ **WRONG: Don't create wrapper functions or orchestrators**
```typescript
// ❌ WRONG: Don't create wrapper functions
function formatProgressionForEdit(progression, context, metadata) {
    const strategy = displayStrategyFactory.createStrategy(DisplayType.Edit);
    return strategy.formatProgression(progression, context, metadata);
}

// ❌ WRONG: Don't create orchestrators above display strategies
class FormatterOrchestrator {
    formatProgressionForEdit(progression, context, metadata) {
        // This violates the 6-layer architecture
    }
}

// ❌ WRONG: Don't access lower layers directly
import { formatterRegistry } from '@/lib/formatters';
const formatter = formatterRegistry.getFormatter(FeatureType.Modifier, ModifierType.Bonus, ModifierAppliesToType.Damage);
```

### **2. Using Pure Formatters (Internal Use Only)**

#### ✅ **CORRECT: Use formatter registry for internal formatter access**
```typescript
import { formatterRegistry } from '@/lib/formatters';

// ✅ CORRECT: Get formatter from registry (for internal use within display strategies)
const formatter = formatterRegistry.getFormatter(FeatureType.Modifier, ModifierType.Bonus, ModifierAppliesToType.Damage);
const formattedValue = formatter.format(value, modifier, metadata);
```

#### ❌ **WRONG: Don't access formatters from consumer code**
```typescript
// ❌ WRONG: Don't access formatters directly from components
import { formatterRegistry } from '@/lib/formatters';
const formatter = formatterRegistry.getFormatter(FeatureType.Modifier, ModifierType.Bonus, ModifierAppliesToType.Damage);
// This bypasses the display strategy orchestration
```

### **3. Using Pure Formatters (Internal Use Only)**

#### ✅ **CORRECT: Use formatter registry for internal access**
```typescript
import { formatterRegistry } from '@/lib/formatters';

// ✅ CORRECT: Get formatter from registry (for internal use within display strategies)
const formatter = formatterRegistry.getFormatter(FeatureType.Modifier, ModifierType.Bonus, ModifierAppliesToType.Damage);
const formattedValue = formatter.format(value, modifier, metadata);
```

#### ❌ **WRONG: Don't use convenience methods from consumer code**
```typescript
// ❌ WRONG: Don't access formatters directly from components
// All formatting should go through display strategies
```

## 🔧 **Implementation Guidelines**

### **When Adding New Formatters**

#### ✅ **CORRECT: Register in formatter registry**
```typescript
// ✅ CORRECT: Register new formatter
formatterRegistry.registerBonusFormatter(ModifierAppliesToType.Damage, new DamageBonusFormatter());
formatterRegistry.registerEffectFormatter(FeatureSpecialEffectType.Other, new OtherEffectFormatter());
```

#### ❌ **WRONG: Don't create wrapper functions**
```typescript
// ❌ WRONG: Don't add formatter logic to wrapper functions
function formatDamageBonus() { /* Don't add specific formatter logic here */ }
```

### **When Adding New Display Strategies**

#### ✅ **CORRECT: Extend base class and register**
```typescript
// ✅ CORRECT: Extend DisplayStrategyBase
class NewDisplayStrategy extends DisplayStrategyBase {
    formatProgressions(progressions, context, metadata) {
        // Implementation that orchestrates all 6 layers
    }
}

// ✅ CORRECT: Create singleton instance and add to factory
const newStrategy = new NewDisplayStrategy();

export class DisplayStrategyFactory {
    static createStrategy(displayType: DisplayType): DisplayStrategy {
        switch (displayType) {
            case DisplayType.New:
                return newStrategy; // Return singleton instance
            // ... existing cases
        }
    }
}
```

#### ❌ **WRONG: Don't create orchestrators above display strategies**
```typescript
// ❌ WRONG: Don't create layers above display strategies
class FormatterOrchestrator {
    getNewDisplayStrategy() { /* This violates the 6-layer architecture */ }
}
```

## 🚨 **Common Anti-Patterns to Avoid**

### **1. Architecture Inversion**
```typescript
// ❌ ANTI-PATTERN: Creating layers above display strategies
class FormatterOrchestrator {
    formatProgressionForEdit(progression, context, metadata) {
        // This violates the 6-layer architecture
        const strategy = displayStrategyFactory.createStrategy(DisplayType.Edit);
        return strategy.formatProgression(progression, context, metadata);
    }
}
```

### **2. Wrapper Functions**
```typescript
// ❌ ANTI-PATTERN: Creating wrapper functions
function formatProgressionForEdit(progression, context, metadata) {
    const strategy = displayStrategyFactory.createStrategy(DisplayType.Edit);
    return strategy.formatProgression(progression, context, metadata);
}
```

### **3. Direct Lower Layer Access**
```typescript
// ❌ ANTI-PATTERN: Accessing lower layers directly from consumer code
import { formatterRegistry } from '@/lib/formatters';
const formatter = formatterRegistry.getFormatter(FeatureType.Modifier, ModifierType.Bonus, ModifierAppliesToType.Damage);
// This bypasses the display strategy orchestration
```

### **4. Mixed Responsibilities**
```typescript
// ❌ ANTI-PATTERN: Display strategies doing pure formatting
class EditPageDisplayStrategy extends DisplayStrategyBase {
    formatProgression(progression, context, metadata) {
        // Don't put specific formatting logic here
        return `${value}d6`; // Should use pure formatters
    }
}
```

## 📋 **Testing Guidelines**

### **Unit Testing**
```typescript
// ✅ CORRECT: Test each layer independently
describe('DamageFormatter', () => {
    it('should format damage values correctly', () => {
        const formatter = new DamageFormatter();
        const result = formatter.format(5, modifier, metadata);
        expect(result).toBe('5d6');
    });
});
```

### **Integration Testing**
```typescript
// ✅ CORRECT: Test display strategy orchestration
describe('DisplayStrategy Integration', () => {
    it('should orchestrate all layers correctly', () => {
        const strategy = displayStrategyFactory.createStrategy(DisplayType.Edit);
        const result = strategy.formatProgression(progression, context, metadata);
        expect(result.formattedValue).toBeDefined();
    });
});
```

## 🔍 **Debugging Guidelines**

### **When Formatting Issues Occur**

1. **Check layer responsibility**: Ensure each layer is doing its job
2. **Verify dependency flow**: Ensure no circular dependencies
3. **Check formatter registry**: Ensure formatters are properly registered
4. **Validate context**: Ensure proper context is passed through layers
5. **Check metadata**: Ensure metadata contains required information

### **Common Debugging Patterns**
```typescript
// ✅ CORRECT: Debug individual layers
const formatter = formatterRegistry.getFormatter(FeatureType.Modifier, ModifierType.Bonus, ModifierAppliesToType.Damage);
console.log('Formatter found:', !!formatter);

// ✅ CORRECT: Debug display strategy orchestration
const strategy = displayStrategyFactory.createStrategy(DisplayType.Edit);
const result = strategy.formatProgression(progression, context, metadata);
console.log('Display strategy result:', result);
```

## 📚 **Reference Links**

- **[README.md](./README.md)** - Architecture overview and navigation
- **[Final Implementation Summary](./final-implementation-summary.md)** - Complete implementation overview
- **[Refactoring Strategy](./refactoring-strategy.md)** - Architecture design decisions
- **[Feature System Overview](../README.md)** - Main feature system documentation
- **[Formula System Analysis](../formula-system-analysis.md)** - Formula system details

## 🎯 **Quick Reference**

### **Key Files**
- `display-strategies.ts` - Display strategy implementations (Layer 6 - highest layer)
- `formatter-registry.ts` - Formatter registration and lookup (Layer 1)
- `types.ts` - Type definitions and interfaces
- `pure-formatters.ts` - Pure formatter implementations (Layer 1)

### **Key Exports**
- `displayStrategyFactory` - Strategy creation factory (returns singletons)
- `formatterRegistry` - Formatter registration system (for internal use)

### **Key Methods**
- `displayStrategyFactory.createStrategy(DisplayType.Edit)` - Get edit page strategy
- `displayStrategyFactory.createStrategy(DisplayType.Detail)` - Get detail page strategy
- `displayStrategyFactory.createStrategy(DisplayType.CharacterSheet)` - Get character sheet strategy
- `strategy.formatProgression()` - Format single progression (edit pages)
- `strategy.formatProgressions()` - Format multiple progressions (detail/character sheets)

