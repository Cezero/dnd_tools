# Spell System Frontend Components

*Documentation for spell-related frontend components.*

## Overview

This document describes the frontend components used for displaying and interacting with spells in the D&D Tools application.

## Components

### SpellDisplayContent

Reusable component that displays spell information without navigation or page structure.

**Source**: `frontend/src/features/spell/SpellDisplayContent.tsx`

**Props**:
- `spell`: Spell data (Spell or GetSpellResponse) - required
- `showHeader`: Whether to display the header with name, edition, and source - optional, defaults to false
- `classLevelDisplay`: Pre-formatted class level display string - optional

**Features**:
- Displays all spell metadata: name, edition, source, schools, subschools, descriptors, level, components, casting time, effect, area, range, target, duration, saving throw, spell resistance
- Shows class level mappings (requires `classLevelDisplay` prop)
- Renders spell description using markdown processing
- Used in both `SpellDetail` page and `SpellTooltip` for consistent display

**Usage Example**:
```tsx
<SpellDisplayContent 
    spell={spell} 
    showHeader={true} 
    classLevelDisplay={classLevelDisplay} 
/>
```

### SpellTooltip

Tooltip component that displays spell information when hovering over spell links.

**Source**: `frontend/src/components/entity-tooltip/SpellTooltip.tsx`

**Props**:
- `spellId`: Numeric spell ID - required
- `children`: Trigger element (typically a link) - required
- `href`: Optional navigation URL

**Features**:
- Lazy loading: Only fetches spell data when tooltip is opened
- Uses `SpellDisplayContent` for consistent spell display
- Handles loading and error states
- Integrates with Base UI PreviewCard component

**Usage Example**:
```tsx
<SpellTooltip spellId={123} href="/spells/123">
    <a href="/spells/123">Fireball</a>
</SpellTooltip>
```

### SpellDetail

Full page component for displaying spell details.

**Source**: `frontend/src/features/spell/SpellDetail.tsx`

**Features**:
- Uses `SpellDisplayContent` for spell information display
- Handles navigation, loading, and error states
- Provides edit functionality for admin users
- Maintains list navigation state

## Integration with Entity Tooltip System

Spell tooltips are part of the generic [Entity Tooltip System](../application-overview/entity-tooltips.md). The system allows spell links throughout the application to display preview cards on hover.

### Where Tooltips Are Used

1. **Spell List**: Spell names in `GenericList` use `EntityLink` for tooltip support
2. **Spell Selection**: Spell names in character spell selection use `EntityLink`
3. **Markdown Links**: Spell links in markdown content automatically get tooltip support
4. **Custom Links**: Any spell link can use `EntityLink` or `SpellTooltip` directly

## Related Documentation

- [Entity Tooltip System](../application-overview/entity-tooltips.md) - Generic tooltip system documentation
- [Spell System Database Schema](./database-schema.md) - Spell data structure
- [Spell System Validation Schemas](./validation-schemas.md) - Spell validation rules
