# Monster System Documentation

*Complete documentation for the monster system, including database schema, data structures, and import processes.*

## Overview

The monster system provides a comprehensive framework for storing and managing D&D 3.5 monsters and their variants. The system supports base monsters with shared descriptions and abilities, and variant monsters that inherit from base entries while having their own specific statistics.

## Documentation Structure

### Database Schema

- **[Database Schema](database-schema.md)** - Complete documentation of the monster system database schema, including all models, relationships, constraints, and design decisions.

## Key Features

### Base and Variant Monsters

The system uses a single table approach with self-referential relationships:

- **Base Monsters**: Store shared descriptive text, flavor text, and common abilities
- **Variant Monsters**: Store specific statblocks with reference to base monster
- **Inheritance**: Variants inherit base monster information for display

### Special Ability Deduplication

Special abilities are automatically reused across monsters:

- **Unique Constraint**: Prevents duplicate abilities with same name+description+type
- **Shared Abilities**: Common abilities like "Vermin Traits" are stored once
- **Efficient Storage**: Reduces data duplication and ensures consistency

### Structured Spell Storage

Spells are stored in a structured format:

- **Spell-Like Abilities**: Stored with uses per day and save DCs
- **Prepared Spells**: Stored with quantity and spell level
- **Enum-Based Uses**: Uses per day stored as enum (At Will, 1/Day, etc.)

### AC Breakdown

Only non-derivable components are stored:

- **Derived**: Size modifier (from SIZE_MAP) and Dexterity modifier (from GetAbilityModifier)
- **Stored**: Natural armor, equipment, and other components
- **Efficient**: Reduces storage and ensures consistency

## Integration Points

The monster system integrates with:

- **Item System**: Equipment associations and AC breakdown
- **Skill System**: Monster skill ranks and notes
- **Feat System**: Monster feat associations
- **Spell System**: Spell-like abilities and prepared spells
- **Source Book System**: Source attribution following standard pattern

## Related Documentation

- [Database Schema Patterns](../application-overview/database-schema.md) - Common database patterns
- [Static Data Documentation](../application-overview/static-data.md) - Static data enums and maps
- [Equipment System](../equipment-system/) - Equipment system integration
- [Skill System](../skill-system/) - Skill system integration
- [Feat System](../feat-system/) - Feat system integration
- [Spell System](../spell-system/) - Spell system integration

