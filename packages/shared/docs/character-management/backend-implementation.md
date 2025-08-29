# Character Management Backend Implementation

*Complete documentation for the character management backend implementation, including services, controllers, API routes, and business logic.*

## 📋 **Overview**

The character management backend implementation provides the server-side functionality for character creation, advancement, ability score management, spell preparation, and equipment management. The implementation follows the established backend patterns with comprehensive validation, error handling, and database integration.

**Source Files**:
- **Services**: `backend/src/features/character/characterService.ts`
- **Controllers**: `backend/src/features/character/characterController.ts`
- **Routes**: `backend/src/features/character/characterRoutes.ts`
- **Types**: `backend/src/features/character/types.ts`

## 🏗️ **Backend Architecture**

The character management backend follows the shared **Backend Implementation Patterns** documented in [Backend Implementation Overview](../application-overview/backend-implementation.md).

### **Service Layer**

**CharacterService**: Core business logic for character operations
**Database Integration**: Prisma client integration for data persistence
**Validation**: Zod schema validation for all operations
**Error Handling**: Comprehensive error handling and logging

### **Controller Layer**

**CharacterController**: HTTP request handling and response formatting
**Authentication**: JWT token validation and user authorization
**Request Processing**: Request validation and data transformation
**Response Formatting**: Consistent API response formatting

### **Route Layer**

**CharacterRoutes**: RESTful API endpoint definitions
**Middleware**: Authentication and validation middleware
**Error Handling**: Route-level error handling and logging

## 🔧 **Service Layer Implementation**

### **CharacterService**

The core service for character management operations, providing business logic for all character-related functionality.

**Purpose**: Handles all character business logic including CRUD operations, advancement management, ability scores, and spell preparation.

**Key Operations**:
- **Character CRUD**: Create, read, update, delete character operations
- **Advancement Management**: Character level progression and advancement tracking
- **Ability Score Management**: Character ability score operations
- **Spell Preparation**: Character spell preparation and metamagic integration
- **Equipment Management**: Character equipment and item management

**Source File**: `backend/src/features/character/characterService.ts`

```typescript
export class CharacterService {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    // Character CRUD operations
    async createCharacter(data: CreateCharacterRequest, userId: number): Promise<Character> {
        // Implementation for character creation
    }

    async getCharacterById(id: number, userId: number): Promise<Character | null> {
        // Implementation for character retrieval
    }

    async updateCharacter(id: number, data: UpdateCharacterRequest, userId: number): Promise<Character> {
        // Implementation for character updates
    }

    async deleteCharacter(id: number, userId: number): Promise<void> {
        // Implementation for character deletion
    }

    // Advancement operations
    async createAdvancement(data: CreateAdvancementRequest): Promise<CharacterAdvancement> {
        // Implementation for advancement creation
    }

    async updateAdvancement(id: number, data: UpdateAdvancementRequest): Promise<CharacterAdvancement> {
        // Implementation for advancement updates
    }

    // Ability score operations
    async updateAbilityScore(characterId: number, abilityId: number, value: number): Promise<UserCharacterAbilityScore> {
        // Implementation for ability score updates
    }

    // Spell preparation operations
    async createSpellPreparation(data: CreateSpellPreparationRequest): Promise<CharacterSpellPreparation> {
        // Implementation for spell preparation creation
    }

    async updateSpellPreparation(id: number, data: UpdateSpellPreparationRequest): Promise<CharacterSpellPreparation> {
        // Implementation for spell preparation updates
    }
}
```

### **Character CRUD Operations**

Comprehensive character creation, reading, updating, and deletion operations with proper validation and error handling.

**Create Character**:
```typescript
async createCharacter(data: CreateCharacterRequest, userId: number): Promise<Character> {
    // Validate input data
    const validatedData = CreateCharacterRequest.parse(data);
    
    // Check user ownership and permissions
    await this.validateUserPermissions(userId);
    
    // Create character with default values
    const character = await this.prisma.userCharacter.create({
        data: {
            ...validatedData,
            userId,
            xp: 0, // Default starting XP
        },
    });
    
    // Initialize default ability scores
    await this.initializeAbilityScores(character.id);
    
    return character;
}
```

**Get Character**:
```typescript
async getCharacterById(id: number, userId: number): Promise<Character | null> {
    // Validate character ownership
    const character = await this.prisma.userCharacter.findFirst({
        where: {
            id,
            userId,
        },
        include: {
            race: true,
            abilityScores: true,
            advancements: {
                include: {
                    skills: true,
                    feats: true,
                    spellsKnown: true,
                    featureChoices: true,
                },
            },
            preparedSpells: {
                include: {
                    metamagics: true,
                },
            },
        },
    });
    
    return character;
}
```

**Update Character**:
```typescript
async updateCharacter(id: number, data: UpdateCharacterRequest, userId: number): Promise<Character> {
    // Validate character ownership
    await this.validateCharacterOwnership(id, userId);
    
    // Validate input data
    const validatedData = UpdateCharacterRequest.parse(data);
    
    // Update character
    const character = await this.prisma.userCharacter.update({
        where: { id },
        data: validatedData,
    });
    
    return character;
}
```

**Delete Character**:
```typescript
async deleteCharacter(id: number, userId: number): Promise<void> {
    // Validate character ownership
    await this.validateCharacterOwnership(id, userId);
    
    // Delete character and all related data
    await this.prisma.userCharacter.delete({
        where: { id },
    });
}
```

### **Advancement Management**

Character advancement operations for level progression, skill improvements, feat selection, and spell learning.

**Create Advancement**:
```typescript
async createAdvancement(data: CreateAdvancementRequest): Promise<CharacterAdvancement> {
    // Validate input data
    const validatedData = CreateAdvancementRequest.parse(data);
    
    // Validate character ownership
    await this.validateCharacterOwnership(validatedData.characterId, userId);
    
    // Check advancement prerequisites
    await this.validateAdvancementPrerequisites(validatedData);
    
    // Create advancement record
    const advancement = await this.prisma.characterAdvancement.create({
        data: validatedData,
        include: {
            skills: true,
            feats: true,
            spellsKnown: true,
            featureChoices: true,
        },
    });
    
    return advancement;
}
```

**Update Advancement**:
```typescript
async updateAdvancement(id: number, data: UpdateAdvancementRequest): Promise<CharacterAdvancement> {
    // Validate advancement ownership
    await this.validateAdvancementOwnership(id, userId);
    
    // Validate input data
    const validatedData = UpdateAdvancementRequest.parse(data);
    
    // Update advancement
    const advancement = await this.prisma.characterAdvancement.update({
        where: { id },
        data: validatedData,
        include: {
            skills: true,
            feats: true,
            spellsKnown: true,
            featureChoices: true,
        },
    });
    
    return advancement;
}
```

### **Ability Score Management**

Character ability score operations for updating and managing character attributes.

**Update Ability Score**:
```typescript
async updateAbilityScore(characterId: number, abilityId: number, value: number): Promise<UserCharacterAbilityScore> {
    // Validate character ownership
    await this.validateCharacterOwnership(characterId, userId);
    
    // Validate ability score value
    if (value < 1 || value > 50) {
        throw new Error('Ability score must be between 1 and 50');
    }
    
    // Update or create ability score
    const abilityScore = await this.prisma.userCharacterAbilityScore.upsert({
        where: {
            characterId_abilityId: {
                characterId,
                abilityId,
            },
        },
        update: { value },
        create: {
            characterId,
            abilityId,
            value,
        },
    });
    
    return abilityScore;
}
```

### **Spell Preparation Management**

Character spell preparation operations for managing prepared spells and metamagic integration.

**Create Spell Preparation**:
```typescript
async createSpellPreparation(data: CreateSpellPreparationRequest): Promise<CharacterSpellPreparation> {
    // Validate input data
    const validatedData = CreateSpellPreparationRequest.parse(data);
    
    // Validate character ownership
    await this.validateCharacterOwnership(validatedData.characterId, userId);
    
    // Create spell preparation
    const spellPreparation = await this.prisma.characterSpellPreparation.create({
        data: validatedData,
        include: {
            metamagics: true,
        },
    });
    
    return spellPreparation;
}
```

**Update Spell Preparation**:
```typescript
async updateSpellPreparation(id: number, data: UpdateSpellPreparationRequest): Promise<CharacterSpellPreparation> {
    // Validate spell preparation ownership
    await this.validateSpellPreparationOwnership(id, userId);
    
    // Validate input data
    const validatedData = UpdateSpellPreparationRequest.parse(data);
    
    // Update spell preparation
    const spellPreparation = await this.prisma.characterSpellPreparation.update({
        where: { id },
        data: validatedData,
        include: {
            metamagics: true,
        },
    });
    
    return spellPreparation;
}
```

## 🎮 **Controller Layer Implementation**

### **CharacterController**

The controller for handling HTTP requests and responses for character management operations.

**Purpose**: Processes HTTP requests, validates input data, calls service methods, and formats responses.

**Key Responsibilities**:
- **Request Validation**: Validates incoming request data using Zod schemas
- **Authentication**: Ensures user authentication and authorization
- **Service Integration**: Calls appropriate service methods for business logic
- **Response Formatting**: Formats responses according to API standards
- **Error Handling**: Handles and formats error responses

**Source File**: `backend/src/features/character/characterController.ts`

```typescript
export class CharacterController {
    private characterService: CharacterService;

    constructor(characterService: CharacterService) {
        this.characterService = characterService;
    }

    // Character CRUD endpoints
    async createCharacter(req: Request, res: Response): Promise<void> {
        // Implementation for character creation endpoint
    }

    async getCharacter(req: Request, res: Response): Promise<void> {
        // Implementation for character retrieval endpoint
    }

    async updateCharacter(req: Request, res: Response): Promise<void> {
        // Implementation for character update endpoint
    }

    async deleteCharacter(req: Request, res: Response): Promise<void> {
        // Implementation for character deletion endpoint
    }

    // Advancement endpoints
    async createAdvancement(req: Request, res: Response): Promise<void> {
        // Implementation for advancement creation endpoint
    }

    async updateAdvancement(req: Request, res: Response): Promise<void> {
        // Implementation for advancement update endpoint
    }

    // Ability score endpoints
    async updateAbilityScore(req: Request, res: Response): Promise<void> {
        // Implementation for ability score update endpoint
    }

    // Spell preparation endpoints
    async createSpellPreparation(req: Request, res: Response): Promise<void> {
        // Implementation for spell preparation creation endpoint
    }

    async updateSpellPreparation(req: Request, res: Response): Promise<void> {
        // Implementation for spell preparation update endpoint
    }
}
```

### **Character CRUD Endpoints**

HTTP endpoints for character creation, reading, updating, and deletion operations.

**Create Character Endpoint**:
```typescript
async createCharacter(req: Request, res: Response): Promise<void> {
    try {
        // Extract user from JWT token
        const userId = (req.user as JwtPayload).userId;
        
        // Validate request body
        const validatedData = CreateCharacterRequest.parse(req.body);
        
        // Create character
        const character = await this.characterService.createCharacter(validatedData, userId);
        
        // Return success response
        res.status(201).json({
            success: true,
            data: character,
        });
    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
            return;
        }
        
        // Handle other errors
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}
```

**Get Character Endpoint**:
```typescript
async getCharacter(req: Request, res: Response): Promise<void> {
    try {
        // Extract user from JWT token
        const userId = (req.user as JwtPayload).userId;
        
        // Validate path parameters
        const { id } = CharacterIdParamSchema.parse(req.params);
        
        // Get character
        const character = await this.characterService.getCharacterById(id, userId);
        
        if (!character) {
            res.status(404).json({
                success: false,
                error: 'Character not found',
            });
            return;
        }
        
        // Return success response
        res.status(200).json({
            success: true,
            data: character,
        });
    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
            return;
        }
        
        // Handle other errors
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}
```

**Update Character Endpoint**:
```typescript
async updateCharacter(req: Request, res: Response): Promise<void> {
    try {
        // Extract user from JWT token
        const userId = (req.user as JwtPayload).userId;
        
        // Validate path parameters and request body
        const { id } = CharacterIdParamSchema.parse(req.params);
        const validatedData = UpdateCharacterRequest.parse(req.body);
        
        // Update character
        const character = await this.characterService.updateCharacter(id, validatedData, userId);
        
        // Return success response
        res.status(200).json({
            success: true,
            data: character,
        });
    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
            return;
        }
        
        // Handle other errors
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}
```

**Delete Character Endpoint**:
```typescript
async deleteCharacter(req: Request, res: Response): Promise<void> {
    try {
        // Extract user from JWT token
        const userId = (req.user as JwtPayload).userId;
        
        // Validate path parameters
        const { id } = CharacterIdParamSchema.parse(req.params);
        
        // Delete character
        await this.characterService.deleteCharacter(id, userId);
        
        // Return success response
        res.status(204).send();
    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
            return;
        }
        
        // Handle other errors
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}
```

### **Advancement Endpoints**

HTTP endpoints for character advancement operations.

**Create Advancement Endpoint**:
```typescript
async createAdvancement(req: Request, res: Response): Promise<void> {
    try {
        // Extract user from JWT token
        const userId = (req.user as JwtPayload).userId;
        
        // Validate request body
        const validatedData = CreateAdvancementRequest.parse(req.body);
        
        // Create advancement
        const advancement = await this.characterService.createAdvancement(validatedData, userId);
        
        // Return success response
        res.status(201).json({
            success: true,
            data: advancement,
        });
    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
            return;
        }
        
        // Handle other errors
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}
```

**Update Advancement Endpoint**:
```typescript
async updateAdvancement(req: Request, res: Response): Promise<void> {
    try {
        // Extract user from JWT token
        const userId = (req.user as JwtPayload).userId;
        
        // Validate path parameters and request body
        const { id } = AdvancementIdParamSchema.parse(req.params);
        const validatedData = UpdateAdvancementRequest.parse(req.body);
        
        // Update advancement
        const advancement = await this.characterService.updateAdvancement(id, validatedData, userId);
        
        // Return success response
        res.status(200).json({
            success: true,
            data: advancement,
        });
    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
            return;
        }
        
        // Handle other errors
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}
```

### **Ability Score Endpoints**

HTTP endpoints for character ability score operations.

**Update Ability Score Endpoint**:
```typescript
async updateAbilityScore(req: Request, res: Response): Promise<void> {
    try {
        // Extract user from JWT token
        const userId = (req.user as JwtPayload).userId;
        
        // Validate path parameters and request body
        const { characterId, abilityId } = AbilityScoreParamSchema.parse(req.params);
        const { value } = UpdateAbilityScoreRequest.parse(req.body);
        
        // Update ability score
        const abilityScore = await this.characterService.updateAbilityScore(characterId, abilityId, value, userId);
        
        // Return success response
        res.status(200).json({
            success: true,
            data: abilityScore,
        });
    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
            return;
        }
        
        // Handle other errors
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}
```

### **Spell Preparation Endpoints**

HTTP endpoints for character spell preparation operations.

**Create Spell Preparation Endpoint**:
```typescript
async createSpellPreparation(req: Request, res: Response): Promise<void> {
    try {
        // Extract user from JWT token
        const userId = (req.user as JwtPayload).userId;
        
        // Validate request body
        const validatedData = CreateSpellPreparationRequest.parse(req.body);
        
        // Create spell preparation
        const spellPreparation = await this.characterService.createSpellPreparation(validatedData, userId);
        
        // Return success response
        res.status(201).json({
            success: true,
            data: spellPreparation,
        });
    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
            return;
        }
        
        // Handle other errors
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}
```

**Update Spell Preparation Endpoint**:
```typescript
async updateSpellPreparation(req: Request, res: Response): Promise<void> {
    try {
        // Extract user from JWT token
        const userId = (req.user as JwtPayload).userId;
        
        // Validate path parameters and request body
        const { id } = SpellPreparationIdParamSchema.parse(req.params);
        const validatedData = UpdateSpellPreparationRequest.parse(req.body);
        
        // Update spell preparation
        const spellPreparation = await this.characterService.updateSpellPreparation(id, validatedData, userId);
        
        // Return success response
        res.status(200).json({
            success: true,
            data: spellPreparation,
        });
    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
            return;
        }
        
        // Handle other errors
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}
```

## 🔗 **Route Layer Implementation**

### **CharacterRoutes**

RESTful API route definitions for character management operations.

**Purpose**: Defines HTTP endpoints, middleware, and request handling for character management.

**Key Features**:
- **RESTful Design**: Standard REST API patterns
- **Authentication**: JWT token validation middleware
- **Validation**: Request validation middleware
- **Error Handling**: Comprehensive error handling

**Source File**: `backend/src/features/character/characterRoutes.ts`

```typescript
export class CharacterRoutes {
    private router: Router;
    private characterController: CharacterController;
    private authMiddleware: AuthMiddleware;

    constructor(characterController: CharacterController, authMiddleware: AuthMiddleware) {
        this.router = Router();
        this.characterController = characterController;
        this.authMiddleware = authMiddleware;
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // Character CRUD routes
        this.router.post('/characters', 
            this.authMiddleware.authenticate,
            this.characterController.createCharacter.bind(this.characterController)
        );
        
        this.router.get('/characters/:id',
            this.authMiddleware.authenticate,
            this.characterController.getCharacter.bind(this.characterController)
        );
        
        this.router.put('/characters/:id',
            this.authMiddleware.authenticate,
            this.characterController.updateCharacter.bind(this.characterController)
        );
        
        this.router.delete('/characters/:id',
            this.authMiddleware.authenticate,
            this.characterController.deleteCharacter.bind(this.characterController)
        );

        // Advancement routes
        this.router.post('/advancements',
            this.authMiddleware.authenticate,
            this.characterController.createAdvancement.bind(this.characterController)
        );
        
        this.router.put('/advancements/:id',
            this.authMiddleware.authenticate,
            this.characterController.updateAdvancement.bind(this.characterController)
        );

        // Ability score routes
        this.router.put('/characters/:characterId/ability-scores/:abilityId',
            this.authMiddleware.authenticate,
            this.characterController.updateAbilityScore.bind(this.characterController)
        );

        // Spell preparation routes
        this.router.post('/spell-preparations',
            this.authMiddleware.authenticate,
            this.characterController.createSpellPreparation.bind(this.characterController)
        );
        
        this.router.put('/spell-preparations/:id',
            this.authMiddleware.authenticate,
            this.characterController.updateSpellPreparation.bind(this.characterController)
        );
    }

    public getRouter(): Router {
        return this.router;
    }
}
```

### **Route Definitions**

Comprehensive route definitions for all character management operations.

**Character CRUD Routes**:
```typescript
// Create character
POST /api/characters
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
    "name": "Character Name",
    "raceId": 1,
    "alignmentId": 1,
    "age": 25,
    "height": 72,
    "weight": 180,
    "eyes": "Blue",
    "hair": "Brown",
    "gender": "Male",
    "notes": "Character background notes"
}

// Get character
GET /api/characters/:id
Authorization: Bearer <jwt_token>

// Update character
PUT /api/characters/:id
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
    "name": "Updated Character Name",
    "age": 26
}

// Delete character
DELETE /api/characters/:id
Authorization: Bearer <jwt_token>
```

**Advancement Routes**:
```typescript
// Create advancement
POST /api/advancements
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
    "characterId": 1,
    "level": 2,
    "version": 1,
    "classId": 1,
    "secondaryClassId": null,
    "hitPoints": 8,
    "abilityId": 1,
    "notes": "Level 2 advancement notes"
}

// Update advancement
PUT /api/advancements/:id
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
    "hitPoints": 10,
    "notes": "Updated advancement notes"
}
```

**Ability Score Routes**:
```typescript
// Update ability score
PUT /api/characters/:characterId/ability-scores/:abilityId
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
    "value": 16
}
```

**Spell Preparation Routes**:
```typescript
// Create spell preparation
POST /api/spell-preparations
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
    "characterId": 1,
    "prepKey": "daily_spells",
    "spellId": 1,
    "level": 1,
    "notes": "Prepared spell notes"
}

// Update spell preparation
PUT /api/spell-preparations/:id
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
    "level": 2,
    "notes": "Updated spell preparation notes"
}
```

## 🔒 **Security and Authorization**

### **Authentication**

All character management endpoints require valid JWT authentication.

**Authentication Flow**:
1. **Token Validation**: JWT token is validated on each request
2. **User Extraction**: User ID is extracted from the token
3. **Authorization**: User is authorized to access the requested resource
4. **Ownership Validation**: Character ownership is validated for all operations

**Implementation**:
```typescript
// Authentication middleware
const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        res.status(401).json({
            success: false,
            error: 'Authentication required',
        });
        return;
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid token',
        });
    }
};
```

### **Authorization**

Character operations are restricted to the character owner.

**Ownership Validation**:
```typescript
// Validate character ownership
async validateCharacterOwnership(characterId: number, userId: number): Promise<void> {
    const character = await this.prisma.userCharacter.findFirst({
        where: {
            id: characterId,
            userId,
        },
    });
    
    if (!character) {
        throw new Error('Character not found or access denied');
    }
}
```

## 📊 **Error Handling**

### **Error Types**

The character management backend handles various types of errors.

**Validation Errors**: Zod schema validation failures
**Authentication Errors**: Invalid or missing JWT tokens
**Authorization Errors**: Insufficient permissions or ownership
**Database Errors**: Database operation failures
**Business Logic Errors**: Invalid character operations

**Error Handling Implementation**:
```typescript
// Centralized error handling
const handleError = (error: unknown, res: Response): void => {
    if (error instanceof z.ZodError) {
        res.status(400).json({
            success: false,
            error: 'Validation error',
            details: error.errors,
        });
        return;
    }
    
    if (error instanceof PrismaClientKnownRequestError) {
        res.status(400).json({
            success: false,
            error: 'Database error',
            details: error.message,
        });
        return;
    }
    
    res.status(500).json({
        success: false,
        error: 'Internal server error',
    });
};
```

### **Error Response Format**

Consistent error response format across all endpoints.

**Error Response Structure**:
```typescript
interface ErrorResponse {
    success: false;
    error: string;
    details?: unknown;
}
```

**Example Error Responses**:
```json
// Validation error
{
    "success": false,
    "error": "Validation error",
    "details": [
        {
            "path": ["name"],
            "message": "Character name is required"
        }
    ]
}

// Authentication error
{
    "success": false,
    "error": "Authentication required"
}

// Authorization error
{
    "success": false,
    "error": "Character not found or access denied"
}
```

## 🔗 **Cross-System Integration**

### **Database Integration**

The character management backend integrates with the database through Prisma.

**Integration Points**:
- **Character Models**: UserCharacter, UserCharacterAbilityScore, CharacterAdvancement
- **Related Models**: Race, Class, Spell, Feat, Item
- **Transaction Support**: Complex operations use database transactions
- **Query Optimization**: Efficient queries with proper includes and relations

**Database Operations**:
```typescript
// Complex character query with all related data
const character = await this.prisma.userCharacter.findFirst({
    where: { id: characterId, userId },
    include: {
        race: true,
        alignment: true,
        abilityScores: true,
        advancements: {
            include: {
                class: true,
                secondaryClass: true,
                skills: true,
                feats: true,
                spellsKnown: true,
                featureChoices: true,
            },
        },
        preparedSpells: {
            include: {
                spell: true,
                metamagics: true,
            },
        },
        items: {
            include: {
                item: true,
                properties: true,
            },
        },
    },
});
```

### **Validation Integration**

The character management backend integrates with Zod validation schemas.

**Integration Points**:
- **Request Validation**: All incoming requests are validated
- **Response Validation**: All outgoing responses are validated
- **Type Safety**: Full TypeScript type safety throughout
- **Error Messages**: Clear, user-friendly error messages

**Validation Integration**:
```typescript
// Request validation
const validatedData = CreateCharacterRequest.parse(req.body);

// Response validation
const response = CharacterWithAllDetailsSchema.parse(character);
```

## 📚 **Related Documentation**

### **System Documentation**
- **[Database Schema](database-schema.md)** — Prisma models and relationships
- **[Validation Schemas](validation-schemas.md)** — Zod validation schemas
- **[Static Data](static-data.md)** — Static data structures and constants
- **[Frontend Components](frontend-components.md)** — Frontend React components

### **Application Overview**
- **[Backend Implementation Overview](../application-overview/backend-implementation.md)** — Shared backend patterns
- **[Error Handling Patterns](../application-overview/backend-implementation.md#error-handling)** — Shared error handling patterns
- **[Authentication Patterns](../application-overview/backend-implementation.md#authentication)** — Shared authentication patterns

### **Cross-System Integration**
- **[Race System Backend](../race-system/backend-implementation.md)** — Race system backend integration
- **[Class System Backend](../class-system/backend-implementation.md)** — Class system backend integration
- **[Feat System Backend](../feat-system/backend-implementation.md)** — Feat system backend integration
- **[Spell System Backend](../spell-system/backend-implementation.md)** — Spell system backend integration

## Summary

The character management backend implementation provides comprehensive server-side functionality for character creation, advancement, ability score management, spell preparation, and equipment management. The implementation follows established backend patterns with robust validation, error handling, and security measures.

The system integrates seamlessly with the database, validation schemas, and other systems, ensuring reliable and secure character management throughout the application.
