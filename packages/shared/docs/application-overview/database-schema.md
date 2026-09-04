# Database Schema Patterns

*Common database design patterns, conventions, and strategies used across all systems in the D&D Tools application.*

## 📋 **Overview**

The database schema patterns document outlines the common design principles, conventions, and strategies used across all database schemas in the D&D Tools application. These patterns ensure consistency, maintainability, and performance across all systems while providing a solid foundation for data integrity and system scalability.

**Source File**: `prisma/schema.prisma`

## 🏗️ **Core Design Principles**

### **Layered Architecture**

The database schema follows a layered architecture approach:

**Data Layer**: Raw data storage with minimal business logic
**Validation Layer**: Zod schemas for type safety and validation
**Static Data Layer**: Enums and reference data for performance
**Business Logic Layer**: Application services for complex operations

**Benefits**:
- **Separation of Concerns**: Clear boundaries between data, validation, and business logic
- **Performance Optimization**: Static data reduces database queries
- **Type Safety**: Zod validation ensures data integrity
- **Maintainability**: Changes in one layer don't affect others

### **Enum-Based Design**

The schema uses enums extensively to avoid schema explosion:

**Enum Strategy**:
- **Database Enums**: Simple enums stored as integers in database
- **Static Data Enums**: Complex enums with additional metadata in static data
- **Validation Enums**: Zod schemas for runtime validation
- **Type Safety**: TypeScript types generated from enums

**Benefits**:
- **Performance**: Avoids complex joins and reduces query complexity
- **Flexibility**: Easy to add new enum values without schema changes
- **Type Safety**: Full TypeScript integration with runtime validation
- **Maintainability**: Centralized enum management

### **Reference Data Strategy**

The schema separates reference data from operational data:

**Reference Data**: Static, rarely-changing data (enums, lookup tables)
**Operational Data**: Dynamic, frequently-changing data (user data, game state)
**Static Data**: Frontend-cached reference data for performance
**Database Data**: Full data with relationships and constraints

**Benefits**:
- **Performance**: Fast lookups without database queries
- **Caching**: Effective client-side caching of reference data
- **Scalability**: Reduces database load for common operations
- **Consistency**: Single source of truth for reference data

## 📊 **Common Schema Patterns**

### **Identity and Audit Fields**

All primary entities include standard identity and audit fields:

**Identity Fields**:
- **`id`**: Auto-incrementing primary key (Int)
- **`name`**: Human-readable identifier (String)
- **`description`**: Optional detailed description (String, nullable)

**Audit Fields**:
- **`isVisible`**: Public visibility flag (Boolean, default true)
- **`editionId`**: Edition reference for multi-edition support (Int, nullable)
- **`createdAt`**: Creation timestamp (DateTime, auto-generated)
- **`updatedAt`**: Last update timestamp (DateTime, auto-updated)

**Usage Pattern**:
```prisma
model Example {
  id          Int      @id @default(autoincrement())
  name        String
  description String?  @db.Text
  isVisible   Boolean  @default(true)
  editionId   Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### **Source Attribution Pattern**

All content entities include source attribution for proper content tracking:

**Source Map Pattern**:
- **Primary Entity**: Main content entity (Class, Race, Feature, etc.)
- **Source Map Entity**: Junction table for source attribution
- **Source Book Reference**: Links to source book and page information

**Structure**:
```prisma
model PrimaryEntity {
  id     Int @id @default(autoincrement())
  name   String
  // ... other fields
  
  sources SourceMapEntity[]
}

model SourceMapEntity {
  primaryEntityId Int
  sourceBookId    Int
  pageNumber      Int?
  
  primaryEntity PrimaryEntity @relation(fields: [primaryEntityId], references: [id])
  sourceBook    SourceBook?   @relation(fields: [sourceBookId], references: [id])
  
  @@id([primaryEntityId, sourceBookId])
}
```

**Benefits**:
- **Content Attribution**: Proper credit for all content
- **Source Tracking**: Easy lookup of content origins
- **Multi-Source Support**: Content can appear in multiple sources
- **Page References**: Quick access to source material

### **Feature Integration Pattern**

The feature system provides a unified approach to modeling game mechanics:

**Feature Progression Pattern**:
- **Feature**: Generic feature definition (metadata only)
- **FeatureProgression**: Specific feature instance for a source
- **Feature Components**: Modifiers, choices, and special effects

**Structure**:
```prisma
model Feature {
  id          Int @id @default(autoincrement())
  name        String
  description String? @db.Text
  // ... metadata fields
}

model FeatureProgression {
  id         Int @id @default(autoincrement())
  featureId  Int
  sourceType Int // enum: Race, Class, Template
  level      Int
  sourceId   Int // references source entity
  
  feature    Feature @relation(fields: [featureId], references: [id])
  modifiers  FeatureModifier[]
  choices    FeatureChoice[]
  effects    FeatureSpecialEffect[]
}
```

**Benefits**:
- **Unified Modeling**: Single system for all game mechanics
- **Reusability**: Features can be used by multiple sources
- **Flexibility**: Complex features through component composition
- **Consistency**: Standardized approach across all systems

### **Enum Reference Pattern**

Database fields reference enums for type safety and validation:

**Enum Reference Structure**:
- **Database Field**: Integer field storing enum value
- **Static Data**: Enum definition with metadata
- **Validation**: Zod schema for runtime validation
- **Type Safety**: TypeScript types for compile-time safety

**Example**:
```prisma
model Race {
  id     Int @id @default(autoincrement())
  name   String
  sizeId Int @default(5) // references SizeId enum
  // ... other fields
}
```

**Static Data**:
```typescript
export const SizeId = {
  Fine: 1,
  Diminutive: 2,
  // ... other values
} as const;
```

**Validation**:
```typescript
export const BaseRaceSchema = z.object({
  sizeId: z.number().int().positive('Size ID must be a positive integer'),
  // ... other fields
});
```

## 🔗 **Relationship Patterns**

### **One-to-Many Relationships**

Standard pattern for hierarchical relationships:

**Pattern**:
- **Parent Entity**: Contains the primary data
- **Child Entity**: References parent with foreign key
- **Cascade Behavior**: Appropriate cascade settings for data integrity

**Example**:
```prisma
model Class {
  id     Int @id @default(autoincrement())
  name   String
  // ... other fields
  
  features FeatureProgression[]
}

model FeatureProgression {
  id      Int @id @default(autoincrement())
  classId Int
  // ... other fields
  
  class Class @relation(fields: [classId], references: [id])
}
```

### **Many-to-Many Relationships**

Junction table pattern for complex relationships:

**Pattern**:
- **Primary Entities**: The entities being related
- **Junction Table**: Contains foreign keys to both entities
- **Additional Data**: Optional fields for relationship metadata

**Example**:
```prisma
model Class {
  id     Int @id @default(autoincrement())
  name   String
  // ... other fields
  
  spellLists SpellLevelMap[]
}

model Spell {
  id     Int @id @default(autoincrement())
  name   String
  // ... other fields
  
  classSpells SpellLevelMap[]
}

model SpellLevelMap {
  classId   Int
  spellId   Int
  spellLevel Int
  
  class  Class  @relation(fields: [classId], references: [id])
  spell  Spell  @relation(fields: [spellId], references: [id])
  
  @@id([classId, spellId])
}
```

### **Polymorphic Relationships**

Feature system pattern for flexible relationships:

**Pattern**:
- **Source Type Field**: Enum indicating the source entity type
- **Source ID Field**: Foreign key to the source entity
- **Type-Safe Access**: Validation ensures correct source type

**Example**:
```prisma
model FeatureProgression {
  id         Int @id @default(autoincrement())
  featureId  Int
  sourceType Int // enum: Race=0, Class=1, Template=2
  sourceId   Int // references source entity based on sourceType
  level      Int
  
  feature Feature @relation(fields: [featureId], references: [id])
}
```

## 📈 **Performance Patterns**

### **Indexing Strategy**

Strategic indexing for optimal query performance:

**Primary Indexes**:
- **Primary Keys**: Automatic indexing on primary key fields
- **Foreign Keys**: Automatic indexing on foreign key fields
- **Unique Constraints**: Automatic indexing on unique fields

**Secondary Indexes**:
- **Frequently Queried Fields**: Index on fields used in WHERE clauses
- **Sort Fields**: Index on fields used in ORDER BY clauses
- **Join Fields**: Index on fields used in JOIN operations

**Composite Indexes**:
- **Multi-Field Queries**: Index on combinations of fields
- **Covering Indexes**: Include additional fields for query optimization
- **Partial Indexes**: Index on subset of data (e.g., visible records only)

### **Query Optimization**

Database query optimization strategies:

**Selective Loading**:
- **Field Selection**: Load only necessary fields
- **Relationship Loading**: Load relationships only when needed
- **Pagination**: Use pagination for large result sets
- **Filtering**: Apply filters early in query chain

**Caching Strategy**:
- **Static Data Caching**: Cache reference data in frontend
- **Query Result Caching**: Cache frequently accessed query results
- **Database Query Caching**: Leverage database query cache
- **Application Cache**: Use application-level caching

### **Data Access Patterns**

Optimized data access patterns:

**Lookup Optimization**:
- **Direct Access**: Use primary keys for O(1) lookups
- **Indexed Access**: Use indexed fields for fast lookups
- **Batch Operations**: Use batch operations for multiple records
- **Connection Pooling**: Use connection pooling for efficiency

**Transaction Management**:
- **Atomic Operations**: Use transactions for data consistency
- **Isolation Levels**: Choose appropriate isolation levels
- **Deadlock Prevention**: Design queries to prevent deadlocks
- **Rollback Strategy**: Plan for transaction rollbacks

## 🔧 **Schema Evolution**

### **Migration Strategy**

Safe schema evolution practices:

**Backward Compatibility**:
- **Additive Changes**: Add new fields as nullable
- **Default Values**: Provide sensible defaults for new fields
- **Optional Fields**: Make new fields optional initially
- **Version Management**: Track schema versions

**Migration Process**:
- **Development**: Test migrations in development environment
- **Staging**: Validate migrations in staging environment
- **Production**: Apply migrations during maintenance windows
- **Rollback**: Have rollback strategies ready

### **Data Migration**

Safe data migration practices:

**Data Validation**:
- **Pre-Migration Validation**: Validate data before migration
- **Post-Migration Validation**: Validate data after migration
- **Data Integrity Checks**: Ensure referential integrity
- **Performance Monitoring**: Monitor performance during migration

**Migration Tools**:
- **Prisma Migrate**: On cyberdev01, [`prisma-migrate-dev.sh`](../../../../deploy/docker/scripts/prisma-migrate-dev.sh) diffs mysqldev and writes SQL (no shadow replay). Promote with [`prisma-migrate-deploy.sh`](../../../../deploy/docker/scripts/prisma-migrate-deploy.sh). See [Prisma migrations](docker-deployment.md#prisma-migrations-current).
- **Agents**: Must not migrate or `db push`.
- **Custom Scripts**: Write custom migration scripts when needed
- **Data Transformation**: Transform data as part of migration
- **Backup Strategy**: Maintain backups before migration

## 🛡️ **Data Integrity**

### **Constraint Strategy**

Comprehensive constraint strategy:

**Primary Key Constraints**:
- **Auto-Incrementing IDs**: Use auto-incrementing primary keys
- **Composite Primary Keys**: Use composite keys for junction tables
- **Unique Constraints**: Ensure uniqueness where required
- **Natural Keys**: Use natural keys where appropriate

**Foreign Key Constraints**:
- **Referential Integrity**: Enforce referential integrity
- **Cascade Behavior**: Choose appropriate cascade settings
- **Nullable Foreign Keys**: Use nullable foreign keys for optional relationships
- **Self-Referencing**: Handle self-referencing relationships

**Check Constraints**:
- **Data Validation**: Validate data at database level
- **Business Rules**: Enforce business rules in constraints
- **Range Validation**: Validate numeric ranges
- **Format Validation**: Validate data formats

### **Validation Strategy**

Multi-layer validation approach:

**Database Validation**:
- **Type Constraints**: Enforce data types at database level
- **Check Constraints**: Validate business rules
- **Trigger Validation**: Use triggers for complex validation
- **Stored Procedure Validation**: Use stored procedures for validation

**Application Validation**:
- **Zod Schemas**: Runtime validation with Zod
- **TypeScript Types**: Compile-time type safety
- **Business Logic Validation**: Validate business rules in application
- **User Input Validation**: Validate user input

## 📋 **Best Practices**

### **Naming Conventions**

Consistent naming conventions:

**Table Names**:
- **Singular Nouns**: Use singular nouns for table names
- **PascalCase**: Use PascalCase for table names
- **Descriptive Names**: Use descriptive, clear names
- **Abbreviation Avoidance**: Avoid abbreviations when possible

**Field Names**:
- **camelCase**: Use camelCase for field names
- **Descriptive Names**: Use descriptive, clear names
- **Consistent Patterns**: Use consistent patterns across tables
- **Boolean Prefixes**: Use "is", "has", "can" prefixes for booleans

**Relationship Names**:
- **Descriptive Names**: Use descriptive relationship names
- **Consistent Patterns**: Use consistent patterns across relationships
- **Plural for Collections**: Use plural names for one-to-many relationships
- **Singular for Single**: Use singular names for one-to-one relationships

### **Documentation Standards**

Comprehensive documentation practices:

**Schema Documentation**:
- **Table Descriptions**: Document purpose of each table
- **Field Descriptions**: Document purpose of each field
- **Relationship Documentation**: Document relationships between tables
- **Constraint Documentation**: Document constraints and their purposes

**Code Documentation**:
- **Inline Comments**: Add comments for complex logic
- **Function Documentation**: Document function purposes and parameters
- **Example Usage**: Provide examples of common usage patterns
- **Change Documentation**: Document schema changes and reasons

## Summary

The database schema patterns ensure:

- **Consistency**: Standardized patterns across all systems
- **Performance**: Optimized for common access patterns
- **Maintainability**: Clear structure and documentation
- **Scalability**: Designed for growth and evolution
- **Data Integrity**: Comprehensive validation and constraints
- **Type Safety**: Full TypeScript integration with runtime validation

These patterns provide a solid foundation for all database schemas in the D&D Tools application while ensuring consistency, performance, and maintainability across all systems.
