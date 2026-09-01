# Monster System Database Schema

*Complete documentation for the monster system database schema, including all models, relationships, and constraints.*

## 📋 **Overview**

The monster system database schema provides a comprehensive framework for storing D&D 3.5 monsters and their variants. The schema supports base monsters with shared descriptions and abilities, and variant monsters that inherit from base entries while having their own specific statistics.

The schema is designed to handle the complexity of monster data, including statblocks, special abilities, spells, equipment, and relationships between base monsters and variants.

**Source File**: [`backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (Monster-related models)

## 🏗️ **Core Models**

### **Monster Model**

The core monster definition containing basic information about monsters, their statistics, and relationships.

**Purpose**: Defines the fundamental characteristics of a monster, including its name, statistics, abilities, and variant relationships.

**Key Fields**:
- **`id`**: Unique identifier for the monster
- **`name`**: Human-readable monster name
- **`baseMonsterId`**: Self-referential foreign key for variant relationships (nullable)
- **`editionId`**: Reference to the D&D edition
- **`isVisible`**: Boolean flag for visibility
- **`flavorText`**: Italicized introductory text (typically at parent level only)
- **`description`**: Full descriptive text about the monster
- **`combatDescription`**: Combat behavior and tactics description
- **`sizeId`**: Reference to monster size (nullable, uses `@SizeId` enum from [`CommonData.ts`](../../static-data/src/CommonData.ts))
- **Speed**: `baseSpeed` (Int, nullable, base land speed in feet, can be 0 for creatures with no land movement)
- **Alternate speeds**: Stored in `MonsterAlternateSpeed` table (fly, swim, climb, burrow)
- **AC fields**: `armorClass`, `touchAC`, `flatFootedAC` (all Int, nullable)
- **Hit Dice fields**: `hitDiceQty` (Float, nullable, can be fractional e.g., 0.5 for 1/2 HD), `hitDiceType` (Int, nullable, references `@RpgDice` enum), `bonusHP` (Int, nullable), `averageHP` (Int, nullable)
- **`initiative`**: Initiative modifier (Int, nullable)
- **`baseAttack`**: Base attack bonus (Int, nullable)
- **`grapple`**: Grapple modifier (Int, nullable)
- **`attack`**: Attack description (Text, nullable)
- **`fullAttack`**: Full attack description (Text, nullable)
- **`space`**: Space occupied in feet (Float, nullable, can be fractional e.g., 2.5 for 2-1/2 ft.)
- **`reach`**: Reach distance in feet (Int, nullable)
- **`optionalReach`**: Optional reach for specific attacks in feet (Int, nullable, e.g., 5 for bite attacks)
- **`optionalReachDescription`**: Description of optional reach (String, nullable, e.g., "with bite", "with tentacle")
- **Save fields**: `fortSave`, `refSave`, `willSave` (all Int, nullable)
- **Ability fields**: `strength`, `dexterity`, `constitution`, `intelligence`, `wisdom`, `charisma` (all Int, nullable)
  - **Nonabilities**: A `null` value represents a nonability (complete absence of the ability score, not a value of 0). See [Nonabilities](#nonabilities) section for special rules.
- **Text fields**: `organization`, `treasure`, `alignment`, `advancement`, `challengeRating`, `levelAdjustment` (all String, nullable)

**Relationships**:
- **`baseMonster`**: Self-referential relationship to base monster (for variants)
- **`variants`**: Reverse relationship to variant monsters
- **`types`**: Many-to-many relationship with monster types via `MonsterTypeMap`
- **`subtypes`**: Many-to-many relationship with monster subtypes via `MonsterSubtypeMap`
- **`skills`**: Many-to-many relationship with skills via `MonsterSkillMap`
- **`feats`**: Many-to-many relationship with feats via `MonsterFeatMap`
- **`specialAbilities`**: Many-to-many relationship with special abilities via `MonsterSpecialAbilityMap`
- **`armorBreakdown`**: One-to-many relationship with AC breakdown components
- **`equipment`**: Many-to-many relationship with items via `MonsterEquipment`
- **`spells`**: One-to-many relationship with spells via `MonsterSpell`
- **`sourceBookInfo`**: Many-to-many relationship with source books via `MonsterSourceMap`
- **`extraHitDice`**: One-to-many relationship with extra hit dice via `MonsterExtraHitDie`

**Design Notes**:
- Most fields are nullable to support base monsters (which may have only descriptive text) and variant monsters (which have full statblocks)
- Base monsters typically have `baseMonsterId` as null and only populate descriptive fields
- Variant monsters have `baseMonsterId` pointing to the base monster and populate statblock fields
- Size modifier and Dexterity modifier for AC are derived from `sizeId` (via `SIZE_MAP`) and `dexterity` (via `GetAbilityModifier()`) respectively, and are not stored in `MonsterArmorBreakdown`

**Usage**: Core monster definitions that are referenced by the frontend for monster display and by custom monster creation features.

**Source File**: [`backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (Monster model)

## 🔧 **Supporting Models**

### **MonsterTypeMap Model**

Defines many-to-many relationships between monsters and creature types.

**Purpose**: Links monsters to their creature types (Aberration, Animal, Construct, Dragon, etc.).

**Key Fields**:
- **`monsterId`**: Reference to the monster
- **`typeId`**: Reference to the monster type (uses `@MonsterTypeId` enum from [`CommonData.ts`](../../static-data/src/CommonData.ts))

**Relationships**:
- **`monster`**: Links to the monster

**Constraints**:
- Composite primary key on `[monsterId, typeId]`
- Cascade delete when monster is deleted

**Usage**: Enables querying monsters by type and supports monsters with multiple types.

**Source File**: [`backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (MonsterTypeMap model)

### **MonsterSubtypeMap Model**

Defines many-to-many relationships between monsters and subtypes.

**Purpose**: Links monsters to their subtypes (Aquatic, Fire, Evil, Extraplanar, Baatezu, Tanar'ri, etc.). Subtypes are D&D 3.5 terminology for additional creature characteristics beyond their base type.

**Key Fields**:
- **`monsterId`**: Reference to the monster
- **`subtypeId`**: Reference to the subtype (uses `@MonsterSubtypeId` enum from [`CommonData.ts`](../../static-data/src/CommonData.ts))

**Relationships**:
- **`monster`**: Links to the monster

**Constraints**:
- Composite primary key on `[monsterId, subtypeId]`
- Cascade delete when monster is deleted

**Usage**: Enables querying monsters by subtype and supports monsters with multiple subtypes. Subtypes can be elemental (Air, Earth, Fire, Water, Cold), alignment-based (Chaotic, Evil, Good, Lawful), race-based (Angel, Archon, Baatezu, Eladrin, Guardinal, Tanar'ri), physical (Incorporeal, Swarm, Aquatic), or specialized (Augmented, Extraplanar, Native, Shapechanger, Goblinoid, Reptilian).

**Source File**: [`backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (MonsterSubtypeMap model)

### **MonsterSkillMap Model**

Defines many-to-many relationships between monsters and skills.

**Purpose**: Links monsters to their skills with ranks and notes.

**Key Fields**:
- **`monsterId`**: Reference to the monster
- **`skillId`**: Reference to the skill (links to `Skill` table)
- **`ranks`**: Skill ranks (Int, nullable)
- **`notes`**: Additional notes about the skill (Text, nullable, e.g., "*" for racial bonuses)

**Relationships**:
- **`monster`**: Links to the monster
- **`skill`**: Links to the skill

**Constraints**:
- Composite primary key on `[monsterId, skillId]`
- Cascade delete when monster is deleted

**Usage**: Stores monster skill information for display and calculation.

**Source File**: [`backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (MonsterSkillMap model)

### **MonsterFeatMap Model**

Defines many-to-many relationships between monsters and feats.

**Purpose**: Links monsters to their feats.

**Key Fields**:
- **`monsterId`**: Reference to the monster
- **`featId`**: Reference to the feat (links to `Feat` table)

**Relationships**:
- **`monster`**: Links to the monster
- **`feat`**: Links to the feat

**Constraints**:
- Composite primary key on `[monsterId, featId]`
- Cascade delete when monster is deleted

**Usage**: Stores monster feat information for display.

**Source File**: [`backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (MonsterFeatMap model)

### **MonsterSpecialAbility Model**

Defines reusable special abilities (attacks and qualities).

**Purpose**: Stores special abilities that can be shared across multiple monsters to avoid duplication.

**Key Fields**:
- **`id`**: Unique identifier for the ability
- **`name`**: Ability name
- **`description`**: Full ability description (Text, can contain markdown and be quite large). Validation allows unbounded text; do not use the 2000-character `commonValidations.description()` helper — several Monster Manual abilities exceed that cap and would fail the monster list parse.
- **`abilityType`**: Type of ability (uses `@MonsterSpecialAbilityTypeId` enum: SpecialAttack=1, SpecialQuality=2)

**Relationships**:
- **`monsters`**: Many-to-many relationship with monsters via `MonsterSpecialAbilityMap`

**Constraints**:
- No unique constraint (deduplication handled in import script)
- Description uses Text to support markdown and large descriptions

**Usage**: Enables reuse of common special abilities across monsters (e.g., "Vermin Traits", "Poison").

**Source File**: [`backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (MonsterSpecialAbility model)

### **MonsterSpecialAbilityMap Model**

Defines many-to-many relationships between monsters and special abilities.

**Purpose**: Links monsters to their special abilities.

**Key Fields**:
- **`monsterId`**: Reference to the monster
- **`abilityId`**: Reference to the special ability

**Relationships**:
- **`monster`**: Links to the monster
- **`ability`**: Links to the special ability

**Constraints**:
- Composite primary key on `[monsterId, abilityId]`
- Cascade delete when monster is deleted

**Usage**: Associates monsters with their special attacks and qualities.

**Source File**: [`backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (MonsterSpecialAbilityMap model)

### **MonsterArmorBreakdown Model**

Defines AC breakdown components (only non-derivable components).

**Purpose**: Stores AC breakdown components that cannot be derived from other fields.

**Key Fields**:
- **`id`**: Unique identifier
- **`monsterId`**: Reference to the monster
- **`componentType`**: Type of component (uses `@MonsterArmorComponentTypeId` enum: NaturalArmor=1, Equipment=2, Other=3)
- **`value`**: Component value (Int, nullable)
- **`equipmentItemId`**: Reference to equipment item if component is equipment (Int, nullable, links to `Item`)
- **`description`**: Description for "Other" type components (Text, nullable)

**Relationships**:
- **`monster`**: Links to the monster
- **`equipmentItem`**: Links to equipment item if applicable

**Constraints**:
- Index on `monsterId` for efficient queries
- Cascade delete when monster is deleted

**Design Notes**:
- Size modifier is derived from `SIZE_MAP[sizeId].sizeModifier` and is not stored
- Dexterity modifier is derived from `GetAbilityModifier(dexterity)` and is not stored
- Only stores NaturalArmor, Equipment, and Other components

**Usage**: Enables AC calculation and breakdown display.

**Source File**: [`backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (MonsterArmorBreakdown model)

### **MonsterEquipment Model**

Defines many-to-many relationships between monsters and equipment.

**Purpose**: Links monsters to equipment items they use (armor, weapons, etc.).

**Key Fields**:
- **`monsterId`**: Reference to the monster
- **`itemId`**: Reference to the item (links to `Item` table)

**Relationships**:
- **`monster`**: Links to the monster
- **`item`**: Links to the item

**Constraints**:
- Composite primary key on `[monsterId, itemId]`
- Cascade delete when monster is deleted

**Design Notes**:
- AC bonuses, attack bonuses, and damage bonuses come from the `Item` table, not stored here
- This is a simple mapping table for equipment association

**Usage**: Tracks which equipment monsters use for display and calculation.

**Source File**: [`backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (MonsterEquipment model)

### **MonsterSpell Model**

Defines spell-like abilities and prepared spells for monsters.

**Purpose**: Stores structured spell information for monsters instead of raw text.

**Key Fields**:
- **`id`**: Unique identifier
- **`monsterId`**: Reference to the monster
- **`spellId`**: Reference to the spell (links to `Spell` table)
- **`spellType`**: Type of spell (uses `@MonsterSpellTypeId` enum: SpellLike=1, Prepared=2)
- **`quantity`**: Quantity for prepared spells (Int, nullable)
- **`usesPerDayId`**: Uses per day (uses `@MonsterSpellUsesPerDayId` enum: AtWill=1, 1PerDay=2, etc.)
- **`saveDC`**: Saving throw DC (Int, nullable)

**Relationships**:
- **`monster`**: Links to the monster
- **`spell`**: Links to the spell

**Constraints**:
- Index on `monsterId` for efficient queries
- Cascade delete when monster is deleted

**Usage**: Enables structured storage and querying of monster spells.

**Source File**: [`backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (MonsterSpell model)

### **MonsterSourceMap Model**

Defines source book attribution for monsters (follows existing pattern).

**Purpose**: Links monsters to their source books with page references.

**Key Fields**:
- **`monsterId`**: Reference to the monster
- **`sourceBookId`**: Reference to the source book (links to `SourceBook` table)
- **`pageNumber`**: Page number in source book (Int, nullable)

**Relationships**:
- **`monster`**: Links to the monster
- **`sourceBook`**: Links to the source book

**Constraints**:
- Composite primary key on `[monsterId, sourceBookId]`
- Cascade delete when monster is deleted

**Usage**: Provides source attribution for monsters following the standard `*SourceMap` pattern used throughout the schema.

**Source File**: [`backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (MonsterSourceMap model)

### **MonsterExtraHitDie Model**

Defines additional hit dice sets for monsters with multiple hit dice types (e.g., class levels, templates).

**Purpose**: Stores extra hit dice for monsters that have multiple sets of hit dice, such as monsters with class levels or template modifications.

**Key Fields**:
- **`id`**: Unique identifier
- **`monsterId`**: Reference to the monster
- **`hitDiceQty`**: Quantity of hit dice (Float, can be fractional e.g., 0.5 for 1/2 HD, 0.33 for 1/3 HD)
- **`hitDiceType`**: Dice type (Int, references `@RpgDice` enum: D4=0, D6=1, D8=2, D10=3, D12=4, etc.)
- **`bonusHP`**: Bonus hit points (Int, nullable)

**Relationships**:
- **`monster`**: Links to the monster

**Constraints**:
- Index on `monsterId` for efficient queries
- Cascade delete when monster is deleted

**Design Notes**:
- Primary hit dice are stored in the `Monster` model (`hitDiceQty`, `hitDiceType`, `bonusHP`)
- Extra hit dice are stored in this table for monsters with multiple sets
- Common case: Most monsters have only primary hit dice (e.g., "4d8+4")
- Rare case: Some monsters have additional hit dice (e.g., "6d8+18 plus 11d10+33" for a Hound Archon with 11 Paladin levels)
- Fractional hit dice (e.g., "1/2 d8", "1/3 d6") are stored as fractional qty values (0.5, 0.33, etc.) to enable proper hit point rolling

**Usage**: Enables storage of complex hit dice combinations for advanced monsters and custom monsters with character class levels.

**Source File**: [`backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (MonsterExtraHitDie model)

### **MonsterAlternateSpeed Model**

Defines alternate movement speeds for monsters (fly, swim, climb, burrow).

**Purpose**: Stores alternate movement types and speeds for monsters that have movement modes other than land movement.

**Key Fields**:
- **`id`**: Unique identifier
- **`monsterId`**: Reference to the monster
- **`movementTypeId`**: Movement type (Int, references `@MovementTypeId` enum: Land=1, Fly=2, Swim=3, Climb=4, Burrow=5)
- **`speed`**: Speed in feet (Int)
- **`maneuverability`**: Maneuverability for fly speed (Int, nullable, references `@ManeuverabilityId` enum: Perfect=1, Good=2, Average=3, Poor=4, Clumsy=5)

**Relationships**:
- **`monster`**: Links to the monster

**Constraints**:
- Index on `monsterId` for efficient queries
- Cascade delete when monster is deleted

**Design Notes**:
- Base land speed is stored in `Monster.baseSpeed` (can be 0 for creatures with no land movement)
- Alternate speeds are stored in this table for fly, swim, climb, and burrow
- Maneuverability is only used for fly speeds and is nullable
- Common case: Most monsters have only baseSpeed (land speed)
- Alternate case: Some monsters have alternate speeds (e.g., "40 ft., fly 90 ft. (good)")
- Special case: Some monsters have no land speed (e.g., "Fly 60 ft. (perfect)" for Lantern Archon)

**Usage**: Enables flexible storage of all movement types and supports creatures with no land movement.

**Source File**: [`backend/prisma/schema.prisma`](../../../../apps/backend/prisma/schema.prisma) (MonsterAlternateSpeed model)

## 📋 **Nonabilities**

Some creatures lack certain ability scores entirely (not 0, but completely absent). In the schema, a `null` value for an ability score represents a nonability.

### Nonability Rules

**No Strength**:
- Creature can't exert force, usually because it has no physical body (e.g., spectre) or doesn't move (e.g., shrieker)
- Automatically fails Strength checks
- If the creature can attack, it applies its Dexterity modifier to base attack bonus instead of Strength modifier

**No Dexterity**:
- Creature can't move (e.g., shrieker)
- If it can perform actions (such as casting spells), it applies its Intelligence modifier to initiative checks instead of Dexterity modifier
- Automatically fails Reflex saves and Dexterity checks

**No Constitution**:
- Creature has no body (e.g., spectre) or no metabolism (e.g., golem)
- Immune to any effect that requires a Fortitude save (unless the effect works on objects or is harmless)
- Immune to ability damage, ability drain, and energy drain
- Automatically fails Constitution checks
- Cannot tire and can run indefinitely without tiring (unless the creature's description says it cannot run)

**No Intelligence**:
- Creature is mindless, an automaton operating on simple instincts or programmed instructions
- Immunity to all mind-affecting effects (charms, compulsions, phantasms, patterns, and morale effects)
- Automatically fails Intelligence checks
- Mindless creatures do not gain feats or skills (except bonus feats or racial skill bonuses)

**No Wisdom**:
- Object, not a creature
- Anything without a Wisdom score also has no Charisma score

**No Charisma**:
- Object, not a creature
- Anything without a Charisma score also has no Wisdom score

### Implementation Notes

- The modifier for a nonability is +0
- Application logic should validate that if Wisdom is `null`, Charisma must also be `null` (and vice versa)
- Application logic should handle special rules for creatures with nonabilities when calculating derived values (AC, saves, attack bonuses, etc.)

**Source**: D&D 3.5 Monster Manual Glossary, "Nonabilities" section

## 🔗 **Cross-System Relationships**

### **Item System Integration**

The monster system integrates with the item system for equipment:

**Equipment Association**: Monsters can be associated with equipment items via `MonsterEquipment`
**AC Breakdown**: Equipment items can contribute to AC breakdown via `MonsterArmorBreakdown.equipmentItemId`
**Equipment Bonuses**: AC, attack, and damage bonuses come from the `Item` table

**Integration Pattern**: The monster system references items for equipment, with bonuses stored in the item system.

**Related Documentation**: [Equipment System Database Schema](../equipment-system/database-schema.md)

### **Skill System Integration**

The monster system integrates with the skill system:

**Skill Association**: Monsters can be associated with skills via `MonsterSkillMap`
**Skill Ranks**: Monster skill ranks are stored in the mapping table
**Skill Notes**: Additional skill information (e.g., racial bonuses) is stored in notes

**Integration Pattern**: The monster system references skills from the skill system, storing monster-specific data in the mapping table.

**Related Documentation**: [Skill System Database Schema](../skill-system/database-schema.md)

### **Feat System Integration**

The monster system integrates with the feat system:

**Feat Association**: Monsters can be associated with feats via `MonsterFeatMap`

**Integration Pattern**: The monster system references feats from the feat system.

**Related Documentation**: [Feat System Database Schema](../feat-system/database-schema.md)

### **Spell System Integration**

The monster system integrates with the spell system:

**Spell Association**: Monsters can be associated with spells via `MonsterSpell`
**Spell Types**: Distinguishes between spell-like abilities and prepared spells
**Spell Usage**: Stores uses per day and save DCs for spells

**Integration Pattern**: The monster system references spells from the spell system, storing monster-specific spell data in `MonsterSpell`.

**Related Documentation**: [Spell System Database Schema](../spell-system/database-schema.md)

### **Source Book System Integration**

The monster system integrates with the source book system:

**Source Attribution**: Monsters are linked to source books via `MonsterSourceMap`
**Page References**: Page numbers are stored for source attribution

**Integration Pattern**: The monster system follows the standard `*SourceMap` pattern used throughout the schema for source attribution.

**Related Documentation**: [Reference Data Database Schema](../reference-data/database-schema.md)

## 📊 **Static Data Integration**

### **Size Enum Integration**

Monster size references the `SizeId` enum from [`CommonData.ts`](../../static-data/src/CommonData.ts):

**Size Field**: `Monster.sizeId` references `@SizeId` enum values
**Size Modifier**: Size modifier for AC is derived from `SIZE_MAP[sizeId].sizeModifier`
**Size Querying**: Monsters can be queried by size using the `sizeId` field

**Enum Values**: Fine=1, Diminutive=2, Tiny=3, Small=4, Medium=5, Large=6, Huge=7, Gargantuan=8, Colossal=9

### **Monster Type Enum Integration**

Monster types reference the `MonsterTypeId` enum from [`CommonData.ts`](../../static-data/src/CommonData.ts):

**Type Mapping**: `MonsterTypeMap.typeId` references `@MonsterTypeId` enum values
**Type Querying**: Monsters can be queried by type using the mapping table

**Enum Values**: Aberration=1, Animal=2, Construct=3, Dragon=4, Elemental=5, Fey=6, Giant=7, Humanoid=8, MagicalBeast=9, MonstrousHumanoid=10, Ooze=11, Outsider=12, Plant=13, Undead=14, Vermin=15

### **Monster Subtype Enum Integration**

Monster subtypes reference the `MonsterSubtypeId` enum from [`CommonData.ts`](../../static-data/src/CommonData.ts):

**Subtype Mapping**: `MonsterSubtypeMap.subtypeId` references `@MonsterSubtypeId` enum values
**Subtype Querying**: Monsters can be queried by subtype using the mapping table

**Enum Values**: Aquatic=1, Air=2, Earth=3, Fire=4, Water=5, Cold=6, Evil=7, Good=8, Lawful=9, Chaotic=10, Extraplanar=11, Angel=12, Archon=13, Incorporeal=14, Swarm=15, Shapechanger=16, Augmented=17, Baatezu=18, Eladrin=19, Goblinoid=20, Guardinal=21, Native=22, Reptilian=23, Tanar'ri=24

### **Special Ability Type Enum Integration**

Special ability types reference the `MonsterSpecialAbilityTypeId` enum from [`CommonData.ts`](../../static-data/src/CommonData.ts):

**Ability Type**: `MonsterSpecialAbility.abilityType` references `@MonsterSpecialAbilityTypeId` enum values

**Enum Values**: SpecialAttack=1, SpecialQuality=2

### **Armor Component Type Enum Integration**

Armor component types reference the `MonsterArmorComponentTypeId` enum from [`CommonData.ts`](../../static-data/src/CommonData.ts):

**Component Type**: `MonsterArmorBreakdown.componentType` references `@MonsterArmorComponentTypeId` enum values

**Enum Values**: NaturalArmor=1, Equipment=2, Other=3

### **Spell Type Enum Integration**

Spell types reference the `MonsterSpellTypeId` enum from [`CommonData.ts`](../../static-data/src/CommonData.ts):

**Spell Type**: `MonsterSpell.spellType` references `@MonsterSpellTypeId` enum values

**Enum Values**: SpellLike=1, Prepared=2

### **Spell Uses Per Day Enum Integration**

Spell uses per day reference the `MonsterSpellUsesPerDayId` enum from [`CommonData.ts`](../../static-data/src/CommonData.ts):

**Uses Per Day**: `MonsterSpell.usesPerDayId` references `@MonsterSpellUsesPerDayId` enum values

**Enum Values**: AtWill=1, 1PerDay=2, 2PerDay=3, 3PerDay=4, 4PerDay=5, 5PerDay=6, 6PerDay=7, 7PerDay=8

### **Movement Type Enum Integration**

Movement types reference the `MovementTypeId` enum from [`CommonData.ts`](../../static-data/src/CommonData.ts):

**Movement Type**: `MonsterAlternateSpeed.movementTypeId` references `@MovementTypeId` enum values

**Enum Values**: Land=1, Fly=2, Swim=3, Climb=4, Burrow=5

### **Maneuverability Enum Integration**

Maneuverability types reference the `ManeuverabilityId` enum from [`CommonData.ts`](../../static-data/src/CommonData.ts):

**Maneuverability**: `MonsterAlternateSpeed.maneuverability` references `@ManeuverabilityId` enum values

**Enum Values**: Perfect=1, Good=2, Average=3, Poor=4, Clumsy=5

**Usage**: Maneuverability is only used for fly speeds and indicates how well a creature can maneuver while flying (from Perfect to Clumsy).

## 📊 **Data Integrity Constraints**

### **Primary Key Constraints**

**Monster Model**: `id` field is the primary key with auto-increment
**MonsterTypeMap Model**: Composite primary key on `[monsterId, typeId]`
**MonsterSubtypeMap Model**: Composite primary key on `[monsterId, subtypeId]`
**MonsterSkillMap Model**: Composite primary key on `[monsterId, skillId]`
**MonsterFeatMap Model**: Composite primary key on `[monsterId, featId]`
**MonsterSpecialAbility Model**: `id` field is the primary key with auto-increment
**MonsterSpecialAbilityMap Model**: Composite primary key on `[monsterId, abilityId]`
**MonsterArmorBreakdown Model**: `id` field is the primary key with auto-increment
**MonsterEquipment Model**: Composite primary key on `[monsterId, itemId]`
**MonsterSpell Model**: `id` field is the primary key with auto-increment
**MonsterSourceMap Model**: Composite primary key on `[monsterId, sourceBookId]`
**MonsterExtraHitDie Model**: `id` field is the primary key with auto-increment

### **Foreign Key Constraints**

**Monster Relationships**: All foreign key relationships are properly defined with cascade options
**Self-Referential Relationship**: `Monster.baseMonsterId` references `Monster.id` for variant relationships
**Type Integration**: Monster type relationships maintain referential integrity
**Subtype Integration**: Monster subtype relationships maintain proper data consistency
**Skill Integration**: Monster skill relationships maintain proper data consistency
**Feat Integration**: Monster feat relationships maintain proper data consistency
**Special Ability Integration**: Special ability relationships maintain proper data consistency with deduplication handled in import script
**Equipment Integration**: Equipment relationships maintain proper data consistency
**Spell Integration**: Spell relationships maintain proper data consistency
**Source Attribution**: Source book relationships maintain proper attribution following standard pattern
**Extra Hit Dice Integration**: Extra hit dice relationships maintain proper data consistency

### **Validation Constraints**

**Numeric Ranges**: Enum ID values are constrained to valid ranges
**Type ID Validation**: Type IDs must reference valid types from static data
**Subtype ID Validation**: Subtype IDs must reference valid subtypes from static data
**Size ID Validation**: Size IDs must reference valid sizes from static data
**String Lengths**: Name and description fields have appropriate length constraints
**Nullable Fields**: Most fields are nullable to support base monsters and variants
**Unique Constraints**: Deduplication handled in import script (no database constraint due to Text field limitation)

## 🔧 **Performance Considerations**

### **Indexing Strategy**

**Primary Keys**: All primary keys are automatically indexed
**Foreign Keys**: All foreign key fields are indexed for efficient joins
**Lookup Fields**: Frequently queried fields like `name` and `baseMonsterId` are indexed
**Composite Indexes**: Composite indexes on mapping table primary keys
**Monster Queries**: Index on `MonsterArmorBreakdown.monsterId`, `MonsterSpell.monsterId`, and `MonsterExtraHitDie.monsterId` for efficient queries

### **Query Optimization**

**Variant Queries**: Self-referential relationship enables efficient variant queries
**Type Queries**: Mapping tables enable efficient type-based queries
**Subtype Queries**: Mapping tables enable efficient subtype-based queries
**Equipment Queries**: Mapping table enables efficient equipment-based queries
**Spell Queries**: Indexed `monsterId` field enables efficient spell queries

## 🎯 **Design Decisions**

### **Single Table Approach**

Base and variant monsters are stored in the same table with nullable fields and `baseMonsterId` relationship:

**Benefits**:
- Simplified schema with single monster table
- Easy querying of all monsters regardless of type
- Natural inheritance pattern through self-referential relationship

**Trade-offs**:
- Many nullable fields for base monsters
- Requires careful query design to distinguish base vs variant

### **Special Ability Deduplication**

Special abilities are automatically reused when name+description+type match:

**Benefits**:
- Reduces data duplication
- Ensures consistency across monsters
- Easier maintenance of common abilities

**Implementation**: Deduplication handled in import script by checking for existing abilities with matching name, description, and type before inserting. This allows Text fields for descriptions (supporting markdown) while still preventing duplicates.

### **AC Breakdown Design**

Only non-derivable components are stored in `MonsterArmorBreakdown`:

**Derived Components**:
- Size modifier: Derived from `SIZE_MAP[sizeId].sizeModifier`
- Dexterity modifier: Derived from `GetAbilityModifier(dexterity)`

**Stored Components**:
- Natural armor: Stored with value
- Equipment: Stored with reference to item
- Other: Stored with value and description

**Benefits**:
- Reduces data duplication
- Ensures consistency with size and ability calculations
- Easier maintenance

**Implementation**: Only stores NaturalArmor, Equipment, and Other components

### **Hit Dice Design**

Hit dice are stored as structured fields with support for multiple sets:

**Primary Hit Dice**:
- Stored in `Monster` model: `hitDiceQty` (Float), `hitDiceType`, `bonusHP`, `averageHP`
- Handles common case of single hit dice set (e.g., "4d8+4")
- Fractional dice (e.g., "1/2 d8", "1/3 d6") stored as fractional qty values (0.5, 0.33, etc.) to enable proper hit point rolling

**Extra Hit Dice**:
- Stored in `MonsterExtraHitDie` table for additional sets
- Handles rare cases of multiple hit dice sets (e.g., "6d8+18 plus 11d10+33")
- Supports monsters with class levels, templates, or multiclassing

**Benefits**:
- Simple common case: Most monsters only use primary fields
- Flexible rare case: Extra table handles complex combinations
- Structured data: Enables calculation and querying
- Average HP: Stored for quick reference and validation

**Trade-offs**:
- Requires join for monsters with extra hit dice
- Float precision for fractional values (e.g., 1/3 = 0.333...)

**Implementation**: Primary fields in `Monster` model with Float qty for fractional support, extra sets in `MonsterExtraHitDie` table

### **Equipment Handling**

Simple mapping table (`MonsterEquipment`) with bonuses from `Item` table:

**Benefits**:
- Single source of truth for item bonuses
- Reuses existing item system
- Simpler schema

**Trade-offs**:
- Requires item lookup for bonuses
- Magic/custom items may need special handling

### **Spell Storage**

Structured `MonsterSpell` table instead of raw text:

**Benefits**:
- Enables querying and filtering by spell
- Supports structured data (uses per day, save DCs)
- Easier to display and calculate

**Implementation**: Separate table with enum-based uses per day and spell type

### **Variant Detection**

Handles both table-based variants and inline statblocks:

**Table Format**: Variants in table columns (e.g., Monstrous Spider)
**Inline Format**: Variants as separate sections (e.g., Angel)

**Implementation**: Import script handles both formats during parsing

## 🔄 **Extension Points**

### **Future Enhancements**

**Custom Monsters**: Schema supports custom monster creation using base monsters as templates
**Monster Templates**: Base monsters can serve as templates for custom monsters
**Monster Variants**: Easy addition of new variants to existing base monsters
**Additional Subtypes**: New subtypes can be added to `MonsterSubtypeId` enum
**Additional Types**: New types can be added to `MonsterTypeId` enum

### **Integration Opportunities**

**Encounter Builder**: Monster data can be used for encounter building
**Monster Search**: Rich querying capabilities for monster search
**Monster Comparison**: Structured data enables monster comparison features
**Monster Customization**: Base/variant pattern supports monster customization

## 📝 **Related Documentation**

- [Database Schema Patterns](../application-overview/database-schema.md) - Common database patterns used across the schema
- [Static Data Documentation](../application-overview/static-data.md) - Static data enums and maps
- [Equipment System Database Schema](../equipment-system/database-schema.md) - Equipment system integration
- [Skill System Database Schema](../skill-system/database-schema.md) - Skill system integration
- [Feat System Database Schema](../feat-system/database-schema.md) - Feat system integration
- [Spell System Database Schema](../spell-system/database-schema.md) - Spell system integration
- [Reference Data Database Schema](../reference-data/database-schema.md) - Source book system integration

