# Adding New Formatters with Labels and Grouping

*Guide for adding new formatters, labelers, and grouping support to the formatting system.*

## Overview

The formatting system uses a **registry pattern** to manage formatters, labelers, and grouping strategies. When adding support for a new `EntityAppliesToType`, you need to register components in three places:

1. **Formatter Registry**: Maps entity types to formatter implementations
2. **Labeler Registry**: Maps entity types to labeler functions for individual and grouped display
3. **Grouping Strategy**: Automatic grouping support for Choice and Allocation types

## Step-by-Step Guide

### Step 1: Create or Extend a Formatter

If you're adding a new choice type (like `AnimalCompanion`), you typically use the existing `FeatureEntityFormatter` which handles choice formatting generically. For other entity types, you may need to create a new formatter class.

**Location**: `apps/frontend/src/lib/formatters/pure-formatters.ts`

**Example**: For Animal Companion choices, the formatter should return the companion name or a placeholder:

```typescript
private getAnimalCompanionName(choice: CalculatedEntity): string {
    // Priority 1: Use included entity data (specific companion selected)
    if (choice.companion) {
        return choice.companion.name;
    }

    // Priority 2: Use static data filter type name (filter type is set)
    if (choice.filterType && FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType]) {
        return FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType].name;
    }

    // Priority 3: Fall back to base name (labeler will add "Select" or "Choose a" prefix)
    return 'Animal Companion';
}
```

### Step 2: Register the Formatter

Register the formatter in the `FormatterRegistry.initializeDefaultFormatters()` method.

**Location**: `apps/frontend/src/lib/formatters/formatter-registry.ts`

**For Choice Types**:
```typescript
// Choice-compatible types
const featureEntityFormatter = new FeatureEntityFormatter();
this.registerEntityFormatter(EntityType.Choice, EntityAppliesToType.AnimalCompanion, featureEntityFormatter);
```

**For Other Entity Types**:
```typescript
// Other-compatible types
this.registerOtherFormatter(EntityAppliesToType.YourNewType, yourFormatter);
```

### Step 3: Register Individual Labeler (if needed)

Most entity types use default labelers. Choice types use a global `choiceLabeler` that adds "Select " prefix to individual choices.

**Location**: `apps/frontend/src/lib/formatters/labeler-registry.ts`

**For Choice Types**:
Choice types automatically use the global `choiceLabeler` registered for `EntityType.Choice`. The labeler registry includes a fallback mechanism: if no specific labeler is found for a particular `appliesToId`, it falls back to the global labeler registered for the `EntityType`. This means the global `choiceLabeler` works for all choice types including Domain, Feat, Animal Companion, etc. No additional registration needed unless you need a custom labeler for a specific choice type.

**For Other Entity Types**:
```typescript
// EntityType.Other - use emptyString labeler for most types (no labels)
this.registerOtherLabeler(EntityAppliesToType.YourNewType, yourLabeler);
```

**Labeler Function Signature**:
```typescript
export function yourLabeler(value: string, modifier: CalculatedEntity): string {
    return `Your Label: ${value}`;
}
```

### Step 4: Register Grouped Labeler (if needed)

For Choice and Allocation types, grouping is handled automatically. The system uses `groupedChoiceLabeler` as a fallback, which formats grouped choices as "Choose a {TypeName}: ({formatted items})".

**Location**: `apps/frontend/src/lib/formatters/labeler-registry.ts`

**For Choice Types**:
Choice types automatically use `groupedChoiceLabeler` when grouped. No additional registration needed unless you need a custom grouped labeler.

**For Other Entity Types** (that need special grouped formatting):
```typescript
private initializeDefaultGroupedLabelers(): void {
    this.registerGroupedLabeler(EntityAppliesToType.YourNewType, yourGroupedLabeler);
}
```

**Grouped Labeler Function Signature**:
```typescript
export function yourGroupedLabeler(formattedItems: string): string {
    return `Your Grouped Format: ${formattedItems}`;
}
```

### Step 5: Update Grouping Strategy (if needed)

For Choice and Allocation types, grouping is handled automatically by the `EntityGroupingStrategy` class. The strategy:
- Detects Choice/Allocation types
- Uses ' | ' delimiter for grouped items
- Applies the grouped labeler automatically

**Location**: `apps/frontend/src/lib/formatters/grouping-strategies.ts`

**For Choice Types**: No changes needed - automatic grouping works for all Choice types.

**For Other Entity Types**: If you need special grouping behavior, you may need to update the `formatGroupedItems` method in `EntityGroupingStrategy`.

## Complete Example: Adding Animal Companion Support

### 1. Formatter Implementation

**File**: `apps/frontend/src/lib/formatters/pure-formatters.ts`

```typescript
private getAnimalCompanionName(choice: CalculatedEntity): string {
    if (choice.companion) {
        return choice.companion.name;
    }
    if (choice.filterType && FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType]) {
        return FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType].name;
    }
    return 'Animal Companion';
}
```

### 2. Formatter Registration

**File**: `apps/frontend/src/lib/formatters/formatter-registry.ts`

```typescript
// Choice-compatible types
const featureEntityFormatter = new FeatureEntityFormatter();
this.registerEntityFormatter(EntityType.Choice, EntityAppliesToType.AnimalCompanion, featureEntityFormatter);
```

### 3. Labeler Registration

**File**: `apps/frontend/src/lib/formatters/labeler-registry.ts`

No additional registration needed - Choice types automatically use the global `choiceLabeler`.

### 4. Grouped Labeler Registration

**File**: `apps/frontend/src/lib/formatters/labeler-registry.ts`

No additional registration needed - Choice types automatically use `groupedChoiceLabeler` as a fallback.

## How It Works

### Individual Choice Display

When a choice entity is formatted individually (not grouped):
1. **Formatter** returns the base name (e.g., "Animal Companion")
2. **Labeler** adds "Select " prefix → "Select Animal Companion"

### Grouped Choice Display

When multiple choice entities are grouped together:
1. **Formatter** returns base names for each item
2. **Grouping Strategy** joins them with ' | ' delimiter
3. **Grouped Labeler** formats as "Choose a {TypeName}: ({items})" → "Choose a Animal Companion: (Animal Companion | Another Companion)"

### Display Context Awareness

The formatter can access `DisplayContext` to provide different formatting based on display type:

```typescript
format(choice: CalculatedEntity, context?: DisplayContext): string {
    // Check display type for special handling
    if (context?.displayType === DisplayType.Edit || context?.displayType === DisplayType.Detail) {
        // Special formatting for edit/detail views
    }
    // ... rest of formatting logic
}
```

## Key Files Reference

- **Formatters**: `apps/frontend/src/lib/formatters/pure-formatters.ts`
- **Formatter Registry**: `apps/frontend/src/lib/formatters/formatter-registry.ts`
- **Labelers**: `apps/frontend/src/lib/formatters/label-formatters.ts`
- **Labeler Registry**: `apps/frontend/src/lib/formatters/labeler-registry.ts`
- **Grouping Strategies**: `apps/frontend/src/lib/formatters/grouping-strategies.ts`
- **Formatting Phase**: `apps/frontend/src/lib/formatters/phases/FormattingPhase.ts`

## Common Patterns

### Pattern 1: Simple Choice Type (like Animal Companion)

1. Add formatter method to `FeatureEntityFormatter`
2. Register formatter in `FormatterRegistry`
3. No labeler registration needed (uses global Choice labeler)
4. No grouped labeler registration needed (uses default grouped choice labeler)

### Pattern 2: Custom Labeled Entity Type

1. Create or extend formatter
2. Register formatter
3. Create and register individual labeler
4. Optionally create and register grouped labeler if needed

### Pattern 3: Entity Type with Special Grouping

1. Create or extend formatter
2. Register formatter
3. Create and register labelers
4. Update grouping strategy if special grouping logic is needed

## Troubleshooting

### Formatter Not Being Called

- **Check**: Is the formatter registered for the correct `EntityType` and `EntityAppliesToType`?
- **Verify**: Check `formatter-registry.ts` for the registration

### Labeler Not Being Applied

- **Check**: Is the labeler registered for the correct `EntityType` and `EntityAppliesToType`?
- **Verify**: Check `labeler-registry.ts` for the registration
- **Note**: Labeling is skipped for cumulative modifiers and grouped entities that use grouped labelers

### Grouping Not Working

- **Check**: Is the entity type `Choice` or `Allocation`? (Automatic grouping)
- **Verify**: Check `groupingId` value - entities with `groupingId > 0` are grouped
- **Note**: Choice types automatically use `groupedChoiceLabeler` as a fallback

### Wrong Display Format

- **Check**: Is the formatter returning the correct base value?
- **Verify**: Is the labeler adding the correct prefix/suffix?
- **Note**: For grouped choices, the grouped labeler should format the final output

## Entity Precaching Requirements

When adding new formatters that display entity names (feats, features, spells, domains, classes, skills, races), ensure that entities are precached before formatting:

**Important**: Formatters use synchronous cache access and cannot trigger fetches. Entities must be precached before formatting begins to prevent "name not found" errors.

**Precaching Pattern**:
```tsx
// In components that use formatters
const { isComplete } = usePrecacheFeatureEntities(progressions);
if (!isComplete) return <div>Loading...</div>;
// Now safe to format
```

For comprehensive precaching documentation, see **[Entity Precaching System](./entity-precaching.md)**.

## Related Documentation

- [Formatting System Overview](./README.md) - Complete system architecture
- [Entity Precaching System](./entity-precaching.md) - Entity precaching architecture and usage
- [Usage Guidelines](./usage-guidelines.md) - How to use the formatting system
- [Architecture Decisions](./architecture-decisions.md) - Design rationale

