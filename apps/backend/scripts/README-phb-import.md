# PHB Domain and Deity Import Script

This script imports domain and deity data from the D&D 3.5e Player's Handbook CSV files into the database.

## Overview

The script processes two CSV files:
- `phb_domains.csv` - Contains domain information with spell lists
- `phb_deities.csv` - Contains deity information with typical worshipers

## Features

- **Idempotent**: Can be run multiple times safely without duplicating data
- **Error Handling**: Continues processing even if individual entries fail
- **Comprehensive Logging**: Detailed logs of all operations, warnings, and errors
- **Data Validation**: Validates all foreign key relationships before insertion
- **Source Attribution**: Properly links all data to the 3.5e Player's Handbook with page numbers

## Configuration

The script uses the following constants from `@shared/static-data`:
- **Source Book ID**: 45 (3.5e Player's Handbook) - validated against `SOURCE_BOOK_MAP`
- **Edition ID**: `EDITION_IDS.DND_3_5E` (5) - 3.5e
- **Pantheon ID**: `Pantheon.Greyhawk` (1) - Greyhawk
- **Alignment Mapping**: Uses `ALIGNMENT_LIST` to find alignments by name
- **Class Validation**: Uses `CLASS_MAP` to find classes by name and edition

## Data Mapping

### Domains
- Creates new domains with proper edition and source attribution
- Links domain spells (DS1-DS9) to existing spells in the database
- Skips existing domains (like Air domain)

### Deities
- Creates new deities with alignment, pantheon, and source attribution
- Links deities to their domains via the DeityDomain table
- Maps typical worshipers to classes and races:
  - Handles common variations (e.g., "half-elf" vs "half elf")
  - Creates DeityClassMap and DeityRaceMap entries
  - Logs warnings for unmatched worshipers but continues processing

### Alignment Mapping
Uses `ALIGNMENT_LIST` from `@shared/static-data` to find alignments by name:
- "lawful good" → finds alignment with name "Lawful Good" → ID 0
- "neutral good" → finds alignment with name "Neutral Good" → ID 1
- "chaotic good" → finds alignment with name "Chaotic Good" → ID 2
- "lawful neutral" → finds alignment with name "Lawful Neutral" → ID 3
- "neutral" → finds alignment with name "True Neutral" → ID 4
- "chaotic neutral" → finds alignment with name "Chaotic Neutral" → ID 5
- "lawful evil" → finds alignment with name "Lawful Evil" → ID 6
- "neutral evil" → finds alignment with name "Neutral Evil" → ID 7
- "chaotic evil" → finds alignment with name "Chaotic Evil" → ID 8

## Usage

### Prerequisites
1. Ensure the database is set up and accessible
2. Ensure the CSV files are in the same directory as the script
3. Ensure the 3.5e Player's Handbook source book (ID 45) exists in the database

### Running the Script

```bash
# From the backend directory
pnpm run import-phb

# Or directly with tsx
tsx scripts/import-phb-data.ts
```

### Expected Output

The script will:
1. Parse the CSV files
2. Import domains first (with spell linking)
3. Import deities second (with class/race mapping)
4. Provide a comprehensive summary of the import process

### Sample Output

```
[2024-01-15T10:30:00.000Z] Starting PHB domain and deity import...
[2024-01-15T10:30:00.100Z] Using source book ID: 45 (3.5e PHB)
[2024-01-15T10:30:00.101Z] Using edition ID: 5 (3.5e)
[2024-01-15T10:30:00.102Z] Using pantheon ID: 1 (Greyhawk)
[2024-01-15T10:30:00.200Z] Verified source book: Player's Handbook
[2024-01-15T10:30:00.300Z] Starting domain import...
[2024-01-15T10:30:00.400Z] Parsed 22 domain rows from CSV
[2024-01-15T10:30:01.000Z] Skipping existing domain: Air
[2024-01-15T10:30:01.100Z] Created domain: Animal (ID: 123)
[2024-01-15T10:30:01.200Z]   Added domain spell: Calm Animals (Level 1)
...
[2024-01-15T10:30:05.000Z] Domain import complete: 21 imported, 1 skipped, 0 errors
[2024-01-15T10:30:05.100Z] Starting deity import...
[2024-01-15T10:30:05.200Z] Parsed 20 deity rows from CSV
[2024-01-15T10:30:05.300Z] Found 7 races and 11 classes for 3.5e
[2024-01-15T10:30:06.000Z] Skipping existing deity: Obad-Hai
[2024-01-15T10:30:06.100Z] Created deity: Heironeous (ID: 456)
[2024-01-15T10:30:06.200Z]   Linked domain: Good
[2024-01-15T10:30:06.300Z]   Linked class: paladin
...
[2024-01-15T10:30:10.000Z] Deity import complete: 19 imported, 1 skipped, 0 errors
[2024-01-15T10:30:10.100Z] PHB import completed successfully!

=== IMPORT SUMMARY ===
Total logs: 150
Total warnings: 5
Total errors: 0
```

## Error Handling

The script handles various error conditions gracefully:

- **Malformed CSV data**: Logs warnings and skips problematic rows
- **Missing spells**: Logs warnings for domain spells not found in database
- **Missing domains**: Logs warnings for deity domains not found in database
- **Unmatched worshipers**: Logs warnings for worshipers that can't be resolved to classes or races
- **Database errors**: Logs errors and continues processing other entries

## Re-running the Script

The script is designed to be idempotent:
- Existing domains and deities are skipped without error
- New data is added without affecting existing entries
- The script can be run multiple times safely

## Troubleshooting

### Common Issues

1. **"Source book with ID 45 not found"**
   - Ensure the 3.5e Player's Handbook exists in the SourceBook table
   - Check that it has `hasDomains: true` and `hasDeities: true`

2. **"Could not find spell: [spell name]"**
   - The spell may not exist in the database for 3.5e
   - Check the spell name for typos or variations
   - The script will continue processing other spells

3. **"Could not resolve worshiper: [name]"**
   - The worshiper name may not match any existing class or race
   - Check for typos or unusual naming conventions
   - The script will continue processing other worshipers

### Database Verification

After running the script, you can verify the import:

```sql
-- Check imported domains
SELECT d.name, d.editionId, dsm.pageNumber 
FROM Domain d 
JOIN DomainSourceMap dsm ON d.id = dsm.domainId 
WHERE dsm.sourceBookId = 45;

-- Check imported deities
SELECT de.name, de.title, de.alignmentId, dsm.pageNumber 
FROM Deity de 
JOIN DeitySourceMap dsm ON de.id = dsm.deityId 
WHERE dsm.sourceBookId = 45;

-- Check deity-domain relationships
SELECT de.name as deity, d.name as domain 
FROM Deity de 
JOIN DeityDomain dd ON de.id = dd.deityId 
JOIN Domain d ON dd.domainId = d.id 
WHERE de.editionId = 5;
```

## File Structure

```
scripts/
├── import-phb-data.ts          # Main import script
├── phb_domains.csv            # Domain data (pipe-delimited)
├── phb_deities.csv            # Deity data (pipe-delimited)
└── README-phb-import.md       # This documentation
```

## Dependencies

- `@shared/prisma-client` - Database client
- `@shared/static-data` - Static data constants (`EDITION_IDS`, `Pantheon`, `SOURCE_BOOK_MAP`, `CLASS_MAP`, `ALIGNMENT_LIST`)
- `fs` - File system operations
- `path` - Path utilities
