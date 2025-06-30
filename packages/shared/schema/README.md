# @shared/schema

Shared validation schemas for D&D Tools using Zod.

## Installation

This package is part of the monorepo and should be installed as a dependency in other packages:

```bash
pnpm add @shared/schema
```

## Usage

### Import specific schemas

```typescript
import { 
  RegisterUserSchema, 
  LoginUserSchema,
  CreateCharacterSchema,
  commonValidations 
} from '@shared/schema';
```

### Import from specific modules

```typescript
import { RegisterUserSchema } from '@shared/schema/auth';
import { CreateCharacterSchema } from '@shared/schema/character';
import { commonValidations } from '@shared/schema/common';
```

## Available Schemas

### Common Schemas (`@shared/schema/common`)
- `commonValidations` - Common validation patterns and utilities
- `schemaBuilders` - Helper functions for building schemas
- `commonSchemas` - Pre-built common schemas

### Auth Schemas (`@shared/schema/auth`)
- `RegisterUserSchema` - User registration validation
- `LoginUserSchema` - User login validation
- `AuthHeaderSchema` - JWT token validation

### Character Schemas (`@shared/schema/character`)
- `CharacterQuerySchema` - Character list query parameters
- `CharacterIdParamSchema` - Character ID parameter validation
- `CreateCharacterSchema` - Character creation validation
- `UpdateCharacterSchema` - Character update validation

### Class Schemas (`@shared/schema/class`)
- `ClassQuerySchema` - Class list query parameters
- `ClassIdParamSchema` - Class ID parameter validation
- `CreateClassSchema` - Class creation validation
- `UpdateClassSchema` - Class update validation

### Feat Schemas (`@shared/schema/feat`)
- `FeatQuerySchema` - Feat list query parameters
- `FeatIdParamSchema` - Feat ID parameter validation
- `CreateFeatSchema` - Feat creation validation
- `UpdateFeatSchema` - Feat update validation
- `FeatBenefitSchema` - Feat benefit validation
- `FeatPrerequisiteSchema` - Feat prerequisite validation

### Race Schemas (`@shared/schema/race`)
- `RaceQuerySchema` - Race list query parameters
- `RaceIdParamSchema` - Race ID parameter validation
- `CreateRaceSchema` - Race creation validation
- `UpdateRaceSchema` - Race update validation
- `CreateRaceTraitSchema` - Race trait creation validation
- `UpdateRaceTraitSchema` - Race trait update validation

### Reference Tables Schemas (`@shared/schema/referencetables`)
- `ReferenceTableQuerySchema` - Reference table list query parameters
- `CreateReferenceTableSchema` - Reference table creation validation
- `UpdateReferenceTableSchema` - Reference table update validation
- `TableHeaderSchema` - Table header validation
- `TableCellSchema` - Table cell validation

### Skill Schemas (`@shared/schema/skill`)
- `SkillQuerySchema` - Skill list query parameters
- `SkillIdParamSchema` - Skill ID parameter validation
- `CreateSkillSchema` - Skill creation validation
- `UpdateSkillSchema` - Skill update validation

### Spell Schemas (`@shared/schema/spell`)
- `SpellQuerySchema` - Spell list query parameters
- `SpellIdParamSchema` - Spell ID parameter validation
- `UpdateSpellSchema` - Spell update validation

### User Profile Schemas (`@shared/schema/userProfile`)
- `UpdateUserProfileSchema` - User profile update validation

## Development

### Building

```bash
pnpm build
```

### Development mode

```bash
pnpm dev
```

## TypeScript Support

All schemas include TypeScript type inference. You can extract types from schemas:

```typescript
import { CreateCharacterSchema } from '@shared/schema';
import type { CreateCharacterRequest } from '@shared/schema';

// Both approaches work:
type CharacterData = z.infer<typeof CreateCharacterSchema>;
type CharacterData2 = CreateCharacterRequest;
``` 