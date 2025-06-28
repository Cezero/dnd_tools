# Static Data Module

This module contains shared static data and utilities for the D&D Tools application, now converted to TypeScript.

## Structure

- `src/types.ts` - TypeScript type definitions for all data structures
- `src/AbilityData.ts` - Ability scores, modifiers, and saving throws
- `src/SkillData.ts` - Skills data (currently empty)
- `src/CommonData.ts` - Common game data (dice, currency, alignments, sizes, languages, editions)
- `src/ClassData.ts` - Character classes and prestige classes
- `src/SourceData.ts` - Source books and publications
- `src/SpellData.ts` - Spell components, descriptors, schools, and spell IDs
- `src/FeatData.ts` - Feat types and categories
- `src/ItemData.ts` - Item categories and types

## Usage

```typescript
import { 
  ABILITY_MAP, 
  GetAbilityModifier, 
  CLASS_MAP, 
  SOURCE_BOOK_MAP 
} from '@shared/static-data';

// Get ability modifier
const strengthModifier = GetAbilityModifier(16); // Returns 3

// Access class data
const wizardClass = CLASS_MAP[11]; // Wizard class data

// Access source book data
const phb = SOURCE_BOOK_MAP[45]; // Player's Handbook 3.5E
```

## TypeScript Features

- Full type safety for all data structures
- Interface definitions for all data types
- Proper type annotations for functions
- ES module exports

## Building

To compile the TypeScript files:

```bash
npx tsc
```

This will generate JavaScript files in the `dist/` directory.

## Data Structure

All data is organized as maps with numeric keys for easy lookup, along with corresponding lists for iteration:

```typescript
// Map for direct access
const ability = ABILITY_MAP[1]; // Strength

// List for iteration
const allAbilities = ABILITY_LIST;
``` 