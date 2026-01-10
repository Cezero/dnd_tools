# Monster System Frontend Components

*Frontend components for displaying and interacting with monster data.*

## Overview

The monster system frontend components provide reusable UI components for displaying monster information consistently across the application, including both full detail pages and tooltip previews.

## Components

### MonsterDisplayContent

Reusable component for displaying monster information without navigation or page structure.

**Source**: `frontend/src/features/monster/MonsterDisplayContent.tsx`

**Props**:
- `monster`: Monster data (`GetMonsterResponse | null | undefined`)
- `showHeader`: Whether to display the header with name, edition, and source (default: `false`)

**Features**:
- Manages async data resolution internally:
  - Spell names (async resolution using `getSpellNameById`)
  - Feat names (async resolution using `getFeatNameById`)
  - Skill names (synchronous cache lookup using `getSkillNameFromCache`)
- Displays complete monster statblock:
  - Basic information (name, edition, source, size, type, subtypes)
  - Combat statistics (hit dice, initiative, speed, armor class, base attack/grapple, attack, full attack, space/reach)
  - Special abilities (special attacks, special qualities)
  - Saves, abilities, skills, feats
  - Organization, challenge rating, treasure, alignment, advancement, level adjustment
- Displays descriptive content:
  - Flavor text
  - Description (with collapsible section)
  - Combat description (with collapsible section)
  - Special abilities (with collapsible sections by type)
  - Prepared spells (with spell links using `EntityLink` for tooltip support)
  - Extra descriptions (with collapsible sections)
- Handles hierarchy data (parent monsters)
- Uses `ProcessMarkdown` for markdown content rendering
- Spell links in markdown content are automatically handled by the markdown processing pipeline

**Usage**: Used in both `MonsterDetail` page and `MonsterTooltip` for consistent monster display.

**Example**:
```tsx
<MonsterDisplayContent 
  monster={monsterData} 
  showHeader={true} 
/>
```

### MonsterTooltip

Monster-specific tooltip implementation that displays monster information in a preview card.

**Source**: `frontend/src/components/entity-tooltip/MonsterTooltip.tsx`

**Props**:
- `monsterId`: The numeric ID of the monster
- `children`: The trigger element (typically a link)
- `href`: Optional navigation URL

**Features**:
- Lazy loading: Only fetches monster data when tooltip is opened (on hover)
- Uses `MonsterDisplayContent` for consistent monster display
- Handles loading and error states
- Integrates with Base UI PreviewCard component
- Shows statblock fields and flavor text (excludes description, combat, hierarchy, and extra descriptions for tooltip view via `showHeader={false}`)

**Usage**: Automatically used by `EntityTooltip` when `entityType="monster"`. Can also be used directly for monster-specific tooltips.

**Example**:
```tsx
<MonsterTooltip monsterId={123} href="/monsters/123">
  <Link to="/monsters/123">Goblin</Link>
</MonsterTooltip>
```

### MonsterDetail

Page component for displaying full monster details with navigation and admin actions.

**Source**: `frontend/src/features/monster/MonsterDetail.tsx`

**Features**:
- Navigation (back to list, edit, delete)
- Admin actions (if user has admin permissions)
- Delegates all display logic to `MonsterDisplayContent`
- Handles loading and error states
- Manages monster data fetching

**Usage**: Used as a route component for `/monsters/:id` pages.

## Integration Points

### EntityLink Integration

Monster names throughout the application use `EntityLink` for tooltip support:

- **CompanionColumns**: Monster names in companion list link to companion detail pages
- **CompanionDetail**: Monster links use `EntityLink` for tooltip support
- **SelectedEntityDisplay**: Companion monster names use `EntityLink` for tooltip support
- **MonsterDisplayContent**: Spell links in "Prepared Spells" section use `EntityLink` for tooltip support

### Markdown Processing

Monster descriptions, combat text, and special abilities can contain markdown with entity links:

- **Spell Links**: `[spell:name]` directives or `/spells/:id` URLs are automatically converted to tooltip-enabled links
- **Monster Links**: `[monster:name]` directives or `/monsters/:id` URLs are automatically converted to tooltip-enabled links
- **Other Entities**: Feat, item, class, race, domain, and deity links are also supported

The markdown processing pipeline (`customProcessors.ts`, `RehypeLinkPreviews.ts`, `RenderHastToReact.tsx`) automatically handles entity link conversion.

### Cache-Based Lookups

Monster-related components use cache-based lookups for efficient entity name resolution:

- **Skill Names**: Uses `getSkillNameFromCache()` for synchronous skill name lookups
- **Spell Names**: Uses `getSpellNameById()` for async spell name resolution
- **Feat Names**: Uses `getFeatNameById()` for async feat name resolution
- **Monster Names**: Uses `getMonsterIdByName()` for markdown directive processing

**Source**: `frontend/src/services/cache/IdMapHelpers.ts`

## Design Decisions

1. **Reusable Display Component**: `MonsterDisplayContent` is used in both detail pages and tooltips for consistency
2. **Internal State Management**: `MonsterDisplayContent` manages all async data resolution internally to simplify the component API
3. **Simplified Tooltip Display**: Monster tooltips show statblock + flavor text only (via `showHeader={false}`) to keep tooltips manageable
4. **EntityLink for Spells**: Spell links in "Prepared Spells" section use `EntityLink` for tooltip support, while markdown content is handled automatically
5. **Collapsible Sections**: Description, combat, and extra descriptions use collapsible sections for better UX
6. **Cache-Based Lookups**: Uses cache-based lookups for efficient synchronous access to entity names

## Related Documentation

- [Entity Tooltip System](../application-overview/entity-tooltips.md) - Generic tooltip system documentation
- [Cache-Based ID Maps](../application-overview/cache-based-id-maps.md) - Cache-based entity ID lookup system
- [Monster System Database Schema](database-schema.md) - Monster system database schema
- [Monster System Validation Schemas](../application-overview/validation-schemas.md) - Monster validation schemas
