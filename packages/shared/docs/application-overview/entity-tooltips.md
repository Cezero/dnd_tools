# Entity Tooltip System

*Generic tooltip system for displaying entity previews when hovering over entity links.*

## Overview

The entity tooltip system provides a consistent way to display preview cards when users hover over entity links (spells, monsters, items, feats, etc.) throughout the application. The system is designed to be extensible for future entity types while maintaining a generic architecture.

## Architecture

The system consists of three main layers:

1. **Display Components**: Reusable components that render entity information (e.g., `SpellDisplayContent`, `MonsterDisplayContent`)
2. **Tooltip Infrastructure**: Generic tooltip components that handle hover states and data fetching (e.g., `EntityTooltip`, `SpellTooltip`, `MonsterTooltip`)
3. **Link Components**: Wrapper components that combine navigation and tooltip functionality (e.g., `EntityLink`)

## Components

### EntityTooltip

Generic tooltip component that routes to entity-specific tooltip implementations based on entity type.

**Source**: `frontend/src/components/entity-tooltip/EntityTooltip.tsx`

**Props**:
- `entityType`: The type of entity ('spell', 'monster', 'item', 'feat', etc.)
- `entityId`: The numeric ID of the entity
- `children`: The trigger element (typically a link)
- `href`: Optional navigation URL

**Usage**: Routes to appropriate tooltip component based on entity type. Currently supports 'spell' and 'monster', with extensibility for other types.

### SpellTooltip

Spell-specific tooltip implementation that displays spell information in a preview card.

**Source**: `frontend/src/components/entity-tooltip/SpellTooltip.tsx`

**Features**:
- Lazy loading: Only fetches spell data when tooltip is opened (on hover)
- Uses `SpellDisplayContent` for consistent spell display
- Handles loading and error states
- Integrates with Base UI PreviewCard component

### EntityLink

Generic link component that combines navigation and tooltip functionality.

**Source**: `frontend/src/components/entity-link/EntityLink.tsx`

**Props**:
- `entityType`: The type of entity
- `entityId`: The numeric ID of the entity
- `href`: Navigation URL
- `children`: Link content
- `className`: Optional CSS class (defaults to 'entity-link')

**Usage**: Wraps content with appropriate tooltip and provides navigation on click.

### MonsterTooltip

Monster-specific tooltip implementation that displays monster information in a preview card.

**Source**: `frontend/src/components/entity-tooltip/MonsterTooltip.tsx`

**Features**:
- Lazy loading: Only fetches monster data when tooltip is opened (on hover)
- Uses `MonsterDisplayContent` for consistent monster display
- Handles loading and error states
- Integrates with Base UI PreviewCard component
- Shows statblock fields and flavor text (excludes description, combat, hierarchy, and extra descriptions for tooltip view)

### SpellDisplayContent

Reusable component that displays spell information without navigation or page structure.

**Source**: `frontend/src/features/spell/SpellDisplayContent.tsx`

**Props**:
- `spell`: Spell data (Spell or GetSpellResponse)
- `showHeader`: Whether to display the header with name, edition, and source
- `classLevelDisplay`: Pre-formatted class level display string

**Usage**: Used in both `SpellDetail` page and `SpellTooltip` for consistent spell display.

### MonsterDisplayContent

Reusable component that displays monster information without navigation or page structure.

**Source**: `frontend/src/features/monster/MonsterDisplayContent.tsx`

**Props**:
- `monster`: Monster data (GetMonsterResponse or null)
- `showHeader`: Whether to display the header with name, edition, and source

**Usage**: Used in both `MonsterDetail` page and `MonsterTooltip` for consistent monster display. Manages async data resolution internally (spell names, feat names, skill names).

## Integration Points

### Markdown Links

Entity links in markdown are automatically converted to tooltip-enabled links:

1. **Directive Processing**: `createEntityLink` in `customProcessors.ts` adds `data-entity-type` and `data-entity-id` attributes
2. **Link Detection**: `RehypeLinkPreviews` adds data attributes to links matching entity URL patterns
3. **Rendering**: `RenderHastToReact` detects entity links and replaces them with `EntityLink` components

**Source Files**:
- `frontend/src/plugins/customProcessors.ts`
- `frontend/src/plugins/RehypeLinkPreviews.ts`
- `frontend/src/plugins/RenderHastToReact.tsx`

### GenericList

Spell names in `GenericList` can be wrapped with tooltips by using `EntityLink` in column cell renderers.

**Example**: See `SpellColumns.tsx` for spell name column implementation.

### ScrollableCategorizedList

Spell names in `ScrollableCategorizedList` can be wrapped with tooltips similarly to `GenericList`.

### Spell Selection Tab

Spell names in the "spells added to spellbook" section use `EntityLink` for tooltip support.

**Source**: `frontend/src/features/character/tabs/SpellSelectionTab.tsx`

### Companion Components

Monster names in companion-related components use `EntityLink` for tooltip support:

- **CompanionColumns**: Monster names in the companion list link to companion detail pages with tooltip support
- **CompanionDetail**: Monster links use `EntityLink` for tooltip support
- **SelectedEntityDisplay**: Companion monster names use `EntityLink` for tooltip support

**Source Files**:
- `frontend/src/features/companion/CompanionColumns.tsx`
- `frontend/src/features/companion/CompanionDetail.tsx`
- `frontend/src/features/character/SelectedEntityDisplay.tsx`

### Monster Display Content

Spell links in the "Prepared Spells" section of `MonsterDisplayContent` use `EntityLink` for tooltip support. Markdown content (descriptions, combat, special abilities) automatically handles spell links via the markdown processing pipeline.

**Source**: `frontend/src/features/monster/MonsterDisplayContent.tsx`

## Extending for New Entity Types

To add tooltip support for a new entity type (e.g., items):

1. **Create Entity Tooltip Component**: Create `ItemTooltip.tsx` following the pattern of `SpellTooltip.tsx` or `MonsterTooltip.tsx`
   - Use appropriate query hook to fetch entity data
   - Create or reuse display component for entity information
   - Handle loading and error states

2. **Update EntityTooltip**: Add case for new entity type in `EntityTooltip.tsx`

3. **Update EntityType Union**: Add new type to `EntityType` in `types.ts`

4. **Update RehypeLinkPreviews**: Add URL pattern matching for new entity type (if not already handled)

5. **Update EntityLink**: Ensure `EntityLink` supports the new entity type (should work automatically)

6. **Update Markdown Directives**: Add directive support in `customProcessors.ts` if needed (e.g., `[item:name]`)

**Example**: Monster tooltip implementation demonstrates this pattern:
- `MonsterTooltip.tsx` - Monster-specific tooltip component
- `MonsterDisplayContent.tsx` - Reusable monster display component
- Integration in `EntityTooltip.tsx` with `case 'monster'`
- `[monster:name]` markdown directive support in `customProcessors.ts`

## Design Decisions

1. **Lazy Loading**: Tooltips only fetch data when opened (on hover) to avoid unnecessary API calls
2. **Base UI PreviewCard**: Uses Base UI PreviewCard component for consistent styling and behavior
3. **Generic Architecture**: System is designed to be extensible without modifying core components
4. **Progressive Enhancement**: Tooltips enhance the experience but don't break functionality if they fail
5. **Consistent Display**: Reusable display components ensure consistent entity information presentation

## Related Documentation

- [Spell System Frontend Components](../spell-system/frontend-components.md) - Spell-specific component documentation
- [Monster System Frontend Components](../monster-system/frontend-components.md) - Monster-specific component documentation
- [Cache-Based ID Maps](../application-overview/cache-based-id-maps.md) - Cache-based entity ID lookup system
- [Markdown Processing](../application-overview/markdown-processing.md) - How markdown links are processed
- [Base UI PreviewCard](../../base-ui/preview-card.md) - Base UI component documentation
