# Reference Data System

*Database schema and system for managing reference tables, source books, and static game data.*

## Core Reference Models

### **SourceBook Model**
**Database Table**: `SourceBook`

Defines source books and publications that contain game content, including books, magazines, and other reference materials.

**Database Fields**:
- `id`: Primary key (auto-increment)
- `name`: Source book name (String)
- `abbreviation`: Short abbreviation (String)
- `releaseDate`: Publication date (DateTime, nullable)
- `editionId`: Reference to D&D edition (Int, nullable)
- `description`: Book description (String, nullable, Text)
- `isVisible`: Display flag (Boolean, default: true)

**Database Relationships**:
- `classes`: One-to-many with `ClassSourceMap`
- `races`: One-to-many with `RaceSourceMap`
- `spells`: One-to-many with `SpellSourceMap`

## Reference Table Models

### **ReferenceTable Model**
**Database Table**: `ReferenceTable`

Defines reference tables that contain structured data for game rules, such as random encounter tables, treasure tables, and other lookup data.

**Database Fields**:
- `slug`: Primary key (String)
- `name`: Table name (String)
- `description`: Table description (String, nullable, Text)

**Database Relationships**:
- `columns`: One-to-many with `ReferenceTableColumn`
- `rows`: One-to-many with `ReferenceTableRow`
- `cells`: One-to-many with `ReferenceTableCell`

### **ReferenceTableColumn Model**
**Database Table**: `ReferenceTableColumn`

Defines the columns in reference tables, including headers and formatting information.

**Database Fields**:
- `tableSlug`: Reference to table (String)
- `index`: Column index (Int)
- `header`: Column header text (String)
- `span`: Column span for merged cells (Int, nullable)
- `alignment`: Text alignment (TextAlignment enum, nullable)

**Database Relationships**:
- `cells`: One-to-many with `ReferenceTableCell`
- `table`: Many-to-one with `ReferenceTable`

**Database Constraints**:
- Primary key: `[tableSlug, index]`

### **ReferenceTableRow Model**
**Database Table**: `ReferenceTableRow`

Defines the rows in reference tables.

**Database Fields**:
- `tableSlug`: Reference to table (String)
- `index`: Row index (Int)

**Database Relationships**:
- `cells`: One-to-many with `ReferenceTableCell`
- `table`: Many-to-one with `ReferenceTable`

**Database Constraints**:
- Primary key: `[tableSlug, index]`

### **ReferenceTableCell Model**
**Database Table**: `ReferenceTableCell`

Defines individual cells in reference tables, containing the actual data values.

**Database Fields**:
- `tableSlug`: Reference to table (String)
- `columnIndex`: Column index (Int)
- `rowIndex`: Row index (Int)
- `value`: Cell value (String, nullable, Text)
- `colSpan`: Column span for merged cells (Int, nullable)
- `rowSpan`: Row span for merged cells (Int, nullable)

**Database Relationships**:
- `column`: Many-to-one with `ReferenceTableColumn`
- `row`: Many-to-one with `ReferenceTableRow`
- `table`: Many-to-one with `ReferenceTable`

**Database Constraints**:
- Primary key: `[tableSlug, columnIndex, rowIndex]`

## Enums

### **TextAlignment Enum**
Defines text alignment options for table columns:

- **left**: Left-aligned text
- **center**: Center-aligned text
- **right**: Right-aligned text

## Key Relationships

### **Reference Data Flow**
```
SourceBook (Source Publications)
├── ClassSourceMap (Class References)
├── RaceSourceMap (Race References)
└── SpellSourceMap (Spell References)

ReferenceTable (Reference Tables)
├── ReferenceTableColumn (Table Columns)
├── ReferenceTableRow (Table Rows)
└── ReferenceTableCell (Table Data)
```

### **Source Attribution Flow**
```
Game Content → SourceBook
├── Class Definitions
├── Race Definitions
├── Spell Definitions
└── Page References
```

### **Table Structure Flow**
```
ReferenceTable → ReferenceTableColumn
├── Column Headers
├── Column Formatting
└── Cell Spanning

ReferenceTable → ReferenceTableRow
└── Row Data

ReferenceTableColumn + ReferenceTableRow → ReferenceTableCell
└── Cell Values
```

## Database Constraints

### **Unique Constraints**
- `ReferenceTableColumn`: `[tableSlug, index]` - Ensures unique column indices per table
- `ReferenceTableRow`: `[tableSlug, index]` - Ensures unique row indices per table
- `ReferenceTableCell`: `[tableSlug, columnIndex, rowIndex]` - Ensures unique cell positions

### **Foreign Key Relationships**
- `SourceBook.editionId` references edition information
- `ReferenceTableColumn.tableSlug` references `ReferenceTable.slug`
- `ReferenceTableRow.tableSlug` references `ReferenceTable.slug`
- `ReferenceTableCell.tableSlug` references `ReferenceTable.slug`
- `ReferenceTableCell.columnIndex` references `ReferenceTableColumn.index`
- `ReferenceTableCell.rowIndex` references `ReferenceTableRow.index`

## Data Validation Rules

### **SourceBook Creation**
- Source book must have valid `name` and `abbreviation`
- `editionId` must reference valid edition if provided
- `releaseDate` must be valid date if provided
- `isVisible` must be boolean

### **Reference Table Creation**
- Table must have valid `slug` and `name`
- Slug must be URL-friendly and unique
- Description can be null for simple tables

### **Table Structure**
- Columns must have unique indices within table
- Rows must have unique indices within table
- Cells must reference valid column and row indices
- Cell spans must be positive integers

## Common Reference Patterns

### **Source Book Creation**
```sql
INSERT INTO SourceBook (name, abbreviation, editionId, description) VALUES
('Player\'s Handbook', 'PHB', 1, 'Core rulebook for D&D 3.5');
```

### **Reference Table Creation**
```sql
INSERT INTO ReferenceTable (slug, name, description) VALUES
('random-encounters', 'Random Encounters', 'Random encounter tables by terrain type');

INSERT INTO ReferenceTableColumn (tableSlug, index, header, alignment) VALUES
('random-encounters', 0, 'Roll', 'right'),
('random-encounters', 1, 'Encounter', 'left');

INSERT INTO ReferenceTableRow (tableSlug, index) VALUES
('random-encounters', 0),
('random-encounters', 1),
('random-encounters', 2);

INSERT INTO ReferenceTableCell (tableSlug, columnIndex, rowIndex, value) VALUES
('random-encounters', 0, 0, '1-2'),
('random-encounters', 1, 0, 'Goblin raiding party'),
('random-encounters', 0, 1, '3-4'),
('random-encounters', 1, 1, 'Merchant caravan');
```

### **Source Attribution**
```sql
INSERT INTO ClassSourceMap (classId, sourceBookId, pageNumber) VALUES
(1, 1, 25); -- Fighter class, PHB, page 25

INSERT INTO SpellSourceMap (spellId, sourceBookId, pageNumber) VALUES
(1, 1, 232); -- Fireball spell, PHB, page 232
```

## Reference Data Mechanics

### **Source Attribution**
- All game content is attributed to source books
- Page numbers provide quick reference
- Edition information helps with compatibility
- Source books can be marked as visible/hidden

### **Reference Tables**
- Tables contain structured game data
- Tables can have complex layouts with merged cells
- Column alignment controls text formatting
- Tables are identified by unique slugs

### **Table Navigation**
- Tables are accessed by slug
- Rows and columns are indexed numerically
- Cells are positioned by row and column indices
- Merged cells use span properties

## Integration with Other Systems

### **Class System Integration**
- Classes are attributed to source books
- Class features reference source pages
- Class variants can have different sources
- Source information helps with rules lookup

### **Race System Integration**
- Races are attributed to source books
- Racial variants can have different sources
- Source information helps with rules lookup
- Race descriptions reference source material

### **Spell System Integration**
- Spells are attributed to source books
- Spell descriptions reference source pages
- Spell variants can have different sources
- Source information helps with rules lookup

### **Equipment System Integration**
- Equipment can be attributed to source books
- Equipment variants can have different sources
- Source information helps with rules lookup
- Equipment descriptions reference source material

## Reference Data Special Cases

### **Core Rulebooks**
- Core rulebooks are primary sources
- Core rulebooks are always visible
- Core rulebooks have edition associations
- Core rulebooks contain fundamental rules

### **Supplemental Books**
- Supplemental books add optional content
- Supplemental books can be edition-specific
- Supplemental books may have prerequisites
- Supplemental books expand available options

### **Magazine Articles**
- Magazine articles provide additional content
- Magazine articles have publication dates
- Magazine articles may be limited availability
- Magazine articles can provide unique content

### **Online Sources**
- Online sources provide digital content
- Online sources may have different formats
- Online sources can be updated frequently
- Online sources may require special handling

## Reference Table Examples

### **Random Encounter Tables**
- Terrain-based encounter tables
- Level-appropriate encounters
- Weather-based modifications
- Time-of-day variations

### **Treasure Tables**
- CR-appropriate treasure
- Treasure type variations
- Magic item distributions
- Currency and gem tables

### **NPC Tables**
- Random NPC generation
- Personality trait tables
- Background tables
- Profession tables

### **Weather Tables**
- Climate-based weather
- Seasonal variations
- Weather effects on travel
- Weather effects on encounters
