# Data Migration and Seeding Scripts

This directory contains scripts for migrating data from the old MySQL schema and seeding new data into the Prisma database.

## Scripts Overview

1. **Data Migration Script** (`migrate-data.js`) - Migrates data from the old MySQL schema to the new Prisma schema
2. **Weapon Seeding Script** (`seed-weapons.ts`) - Seeds weapon data from JSON files into the database
3. **Damage Type Conversion Script** (`convert-damage-types.ts`) - Converts descriptive damage types to numeric format

---

# Data Migration Script

This script migrates data from the old MySQL schema (`cyberdnd_schema.sql`) to the new Prisma schema format.

## Prerequisites

1. **Old Database**: Ensure you have access to the old database with the schema defined in `cyberdnd_schema.sql`
2. **New Database**: The new Prisma database should be set up and migrations should be applied
3. **Environment Variables**: Configure the following environment variables:

```env
# Old database connection
DB_HOST=localhost
DB_USER=your_username
DB_PASS=your_password
DB_NAME=cyberdnd_old
DB_PORT=3306

# New database connection (via DATABASE_URL)
DATABASE_URL="mysql://username:password@localhost:3306/cyberdnd_new"
```

## Usage

### Option 1: Using npm script
```bash
cd backend
npm run migrate-data
```

### Option 2: Direct execution
```bash
cd backend
node scripts/migrate-data.js
```

## What the script does

The migration script transforms data from the old schema to the new schema by:

1. **Table Name Changes**: Converts from snake_case to PascalCase
   - `classes` → `Class`
   - `spells` → `Spell`
   - `races` → `Race`
   - etc.

2. **Column Name Changes**: Converts from snake_case to camelCase
   - `class_id` → `classId`
   - `spell_name` → `spellName`
   - `is_prestige` → `isPrestige`
   - etc.

3. **Data Type Transformations**:
   - Converts `tinyint(1)` boolean fields to proper boolean values
   - Handles date/time conversions
   - Maps decimal fields appropriately

4. **Relationship Updates**: Updates foreign key references to match the new schema

## Migration Order

The script migrates data in the following order to respect foreign key constraints:

1. SourceBooks (independent)
2. Classes (independent)
3. ClassFeatures (depends on Classes)
4. ClassSpellLevels (depends on Classes)
5. ClassLevelAttributes (depends on Classes)
6. Skills (independent)
7. ClassSkillMap (depends on Classes and Skills)
8. ClassSourceMap (depends on Classes and SourceBooks)
9. Spells (independent)
10. SpellLevelMap (depends on Spells and Classes)
11. SpellDescriptorMap (depends on Spells)
12. SpellSchoolMap (depends on Spells)
13. SpellSourceMap (depends on Spells and SourceBooks)
14. SpellSubschoolMap (depends on Spells)
15. Feats (independent)
16. FeatBenefitMap (depends on Feats)
17. FeatPrerequisiteMap (depends on Feats)
18. Races (independent)
19. RaceTraits (independent)
20. RaceTraitMap (depends on Races and RaceTraits)
21. RaceAbilityAdjustments (depends on Races)
22. RaceLanguageMap (depends on Races)
23. RaceSourceMap (depends on Races and SourceBooks)
24. Armor (independent)
25. Weapons (independent)
26. ReferenceTables (independent)
27. ReferenceTableColumns (depends on ReferenceTables)
28. ReferenceTableRows (depends on ReferenceTables)
29. ReferenceTableCells (depends on ReferenceTableRows and ReferenceTableColumns)
30. Users (independent)
31. UserCharacters (depends on Users and Races)
32. UserCharacterAttributes (depends on UserCharacters)

## Error Handling

The script uses `upsert` operations, which means:
- If a record exists, it will be updated
- If a record doesn't exist, it will be created
- This allows the script to be run multiple times safely

## Troubleshooting

### Common Issues

1. **Connection Errors**: Ensure your database connection details are correct
2. **Permission Errors**: Make sure your database user has read access to the old database and write access to the new database
3. **Foreign Key Violations**: The script is designed to handle dependencies correctly, but if you encounter issues, check the migration order

### Logs

The script provides detailed logging of:
- Connection status
- Number of records migrated for each table
- Any errors that occur during migration

### Backup

Always backup your data before running migrations:
```bash
# Backup old database
mysqldump -u username -p cyberdnd_old > backup_old.sql

# Backup new database
mysqldump -u username -p cyberdnd_new > backup_new.sql
```

## Schema Mapping

### Key Changes

| Old Schema | New Schema | Notes |
|------------|------------|-------|
| `classes` | `Class` | Table name change |
| `class_id` | `classId` | Column name change |
| `is_prestige` | `isPrestige` | Boolean field |
| `display` | `isVisible` | Boolean field |
| `can_cast` | `canCastSpells` | Boolean field |
| `hit_die` | `hitDie` | Integer field |
| `skill_points` | `skillPoints` | Integer field |
| `cast_ability` | `castingAbilityId` | Integer field |

### Boolean Field Mappings

The script automatically converts the following fields from `tinyint(1)` to boolean:
- `is_prestige` → `isPrestige`
- `display` → `isVisible`
- `can_cast` → `canCastSpells`
- `affected_by_armor` → `affectedByArmor`
- `trained_only` → `trainedOnly`
- `repeatable` → `repeatable`
- `fighter_bonus` → `fighterBonus`
- `is_automatic` → `isAutomatic`
- `is_admin` → `isAdmin`

---

# Weapon Seeding Script

This script seeds weapon data from the `weapons.json` file into the database using the Prisma client.

## Prerequisites

1. **Database**: The Prisma database should be set up and migrations should be applied
2. **Environment Variables**: Configure the `DATABASE_URL` environment variable
3. **Weapon Data**: Ensure `weapons.json` exists in the scripts directory

## Usage

### Option 1: Using npm script
```bash
cd backend
npm run seed-weapons
```

### Option 2: Direct execution
```bash
cd backend
npx tsx scripts/seed-weapons.ts
```

## What the script does

The weapon seeding script:

1. **Reads Weapon Data**: Loads weapon information from `weapons.json`
2. **Checks for Duplicates**: Skips weapons that already exist in the database (based on name and type)
3. **Creates Items**: Creates Item records with weapon type
4. **Creates Weapons**: Creates Weapon records linked to the Item records
5. **Transaction Safety**: Uses database transactions to ensure data consistency
6. **Error Handling**: Continues processing even if individual weapons fail

## Data Structure

The script expects `weapons.json` to contain an array of weapon objects with the following structure:

```json
{
  "item": {
    "name": "Weapon Name",
    "description": "Weapon description",
    "type": "WEAPON",
    "cost": 10.00,
    "weight": 5.00,
    "quantity": null
  },
  "weapon": {
    "category": 1,
    "type": 2,
    "attackBonus": null,
    "damageSmall": "1d4",
    "damageMedium": "1d6",
    "critical": "x2",
    "range": "10 ft.",
    "damageType": "Slashing",
    "reach": false,
    "double": false,
    "nonlethal": false
  }
}
```

**Note**: The `damageType` field in the JSON can contain descriptive strings (like "Slashing", "Piercing or slashing"), but the script will automatically convert them to the correct numeric format using the shared `DAMAGE_TYPES` constants for storage in the database.

## Weapon Categories

- `1` = Simple Weapons
- `2` = Martial Weapons  
- `3` = Exotic Weapons

## Weapon Types

- `1` = Unarmed Attacks
- `2` = Light Melee Weapons
- `3` = One-Handed Melee Weapons
- `4` = Two-Handed Melee Weapons
- `5` = Ranged Weapons

## Error Handling

The script provides detailed logging of:
- Number of weapons found in the JSON file
- Weapons that are skipped (already exist)
- Weapons that are successfully inserted
- Any errors that occur during processing

## Safety Features

- **Duplicate Prevention**: Checks for existing weapons before insertion
- **Transaction Safety**: Uses database transactions for data consistency
- **Error Recovery**: Continues processing even if individual weapons fail
- **Detailed Logging**: Provides clear feedback on what was processed

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure the Prisma client is properly generated (`npm run generate`)
2. **Database Connection**: Verify your `DATABASE_URL` is correct
3. **File Not Found**: Ensure `weapons.json` exists in the scripts directory
4. **Permission Errors**: Make sure your database user has write access

### Running Multiple Times

The script is designed to be run multiple times safely. It will:
- Skip weapons that already exist
- Only insert new weapons
- Provide a summary of what was inserted vs. skipped



# Damage Type Conversion Script

This script converts descriptive damage type strings to the correct numeric format used by the system.

## Prerequisites

1. **Database**: The Prisma database should be set up and weapons should be present
2. **Environment Variables**: Configure the `DATABASE_URL` environment variable

## Usage

### Option 1: Using npm script
```bash
cd backend
npm run convert-damage-types
```

### Option 2: Direct execution
```bash
cd backend
npx tsx scripts/convert-damage-types.ts
```

## What the script does

The damage type conversion script:

1. **Reads All Weapons**: Gets all weapons from the database
2. **Checks Current Format**: Identifies weapons with descriptive damage types
3. **Converts to Numeric**: Transforms descriptive strings to numeric format
4. **Updates Database**: Saves the converted values back to the database

## Damage Type Mapping

The script converts descriptive damage types to numeric format using the shared `DAMAGE_TYPES` constants:

| Descriptive Type | Numeric Format | Meaning |
|------------------|----------------|---------|
| `"Bludgeoning"` | `"1"` | Bludgeoning damage |
| `"Piercing"` | `"2"` | Piercing damage |
| `"Slashing"` | `"3"` | Slashing damage |
| `"Piercing or slashing"` | `"2|3"` | Can deal either piercing or slashing |
| `"Bludgeoning and piercing"` | `"1&2"` | Deals both bludgeoning and piercing |
| `"Slashing or piercing"` | `"3|2"` | Can deal either slashing or piercing |

## Numeric Format Rules

- **Single damage type**: Uses the damage type ID from `DAMAGE_TYPES` (e.g., `"1"`, `"2"`, `"3"`)
- **Multiple damage types (OR)**: Uses `|` separator (e.g., `"2|3"` for piercing or slashing)
- **Multiple damage types (AND)**: Uses `&` separator (e.g., `"1&2"` for bludgeoning and piercing)

## Error Handling

The script provides detailed logging of:
- Weapons that are converted with their old and new damage types
- Weapons that are skipped because they already have numeric format
- Any errors that occur during processing

## Safety Features

- **Non-destructive**: Only converts weapons that need conversion
- **Verification**: Checks current format before converting
- **Detailed Logging**: Shows exactly what changes are made
- **Error Recovery**: Continues processing even if individual weapons fail

## When to Use

Use this script when:
- Weapons have descriptive damage types instead of numeric format
- You need to standardize damage type storage
- After importing weapons with descriptive damage types
- To ensure consistency with the system's expected format 