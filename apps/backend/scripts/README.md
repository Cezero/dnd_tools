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