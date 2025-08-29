# Character Management Frontend Components

*Complete documentation for the character management frontend components, including React components, user interfaces, and interaction patterns.*

## 📋 **Overview**

The character management frontend components provide the user interface for character creation, editing, advancement, and management. The components follow React patterns with TypeScript for type safety and integrate with the backend API for data operations.

**Source Files**:
- **Components**: `frontend/src/features/character/` (CharacterList.tsx, CharacterEdit.tsx, CharacterDetail.tsx)
- **Configuration**: `frontend/src/features/character/CharacterConfig.ts`
- **API Client**: `frontend/src/features/character/CharacterApi.ts`
- **Tabs**: `frontend/src/features/character/tabs/` (various tab components)

## 🏗️ **Component Architecture**

The character management frontend follows the shared **Frontend Component Patterns** documented in [Frontend Components Overview](../application-overview/frontend-components.md).

### **Component Structure**

**Main Components**: Primary character management interfaces
**Tab Components**: Specialized interfaces for different character aspects
**Configuration**: Component configuration and constants
**API Integration**: Backend API communication and data management

### **Component Patterns**

**Type Safety**: Comprehensive TypeScript type definitions
**State Management**: React state and context for data management
**Form Handling**: Form validation and submission patterns
**Error Handling**: User-friendly error handling and feedback

## 🔧 **Core Components**

### **CharacterList**

Displays a list of user characters with search, filtering, and management capabilities.

**Purpose**: Provides the main interface for viewing and managing character collections.

**Key Features**:
- **Character Grid**: Displays characters in a responsive grid layout using [GenericList component](../application-overview/generic-list.md)
- **Search and Filter**: Search by name, filter by race, class, or level through GenericList filter system
- **Character Actions**: Create, edit, delete, and view character actions integrated with GenericList
- **Pagination**: Handles large character collections efficiently managed by GenericList
- **Column Configuration**: Custom column definitions defined in [CharacterColumns.ts](../../../apps/frontend/src/features/character/CharacterColumns.ts)

**Source File**: [CharacterList.tsx](../../../apps/frontend/src/features/character/CharacterList.tsx) - Uses GenericList for character list management

The CharacterList component follows the standard GenericList implementation pattern with character-specific configuration and navigation integration. See [CharacterList.tsx](../../../apps/frontend/src/features/character/CharacterList.tsx) for the complete implementation.

### **CharacterEdit**

Provides a comprehensive character editing interface with tabbed sections.

**Purpose**: Enables character creation and editing with organized, user-friendly interfaces.

**Key Features**:
- **Tabbed Interface**: Organized sections for different character aspects
- **Form Validation**: Real-time validation with clear error messages
- **Auto-save**: Automatic saving of character changes
- **Preview Mode**: Live preview of character changes

**Source File**: `frontend/src/features/character/CharacterEdit.tsx`

```typescript
interface CharacterEditProps {
    characterId?: number; // undefined for new character
    onSave: (character: Character) => void;
    onCancel: () => void;
}

export const CharacterEdit: React.FC<CharacterEditProps> = ({
    characterId,
    onSave,
    onCancel,
}) => {
    const [character, setCharacter] = useState<Character | null>(null);
    const [activeTab, setActiveTab] = useState('basic');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Component implementation
    return (
        <div className="character-edit">
            {/* Tab navigation */}
            <CharacterEditTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />
            
            {/* Tab content */}
            <div className="tab-content">
                {activeTab === 'basic' && (
                    <BasicInfoTab
                        character={character}
                        onChange={setCharacter}
                    />
                )}
                {activeTab === 'ability-scores' && (
                    <AbilityScoresTab
                        character={character}
                        onChange={setCharacter}
                    />
                )}
                {activeTab === 'advancement' && (
                    <AdvancementTab
                        character={character}
                        onChange={setCharacter}
                    />
                )}
                {activeTab === 'spells' && (
                    <SpellsTab
                        character={character}
                        onChange={setCharacter}
                    />
                )}
                {activeTab === 'equipment' && (
                    <EquipmentTab
                        character={character}
                        onChange={setCharacter}
                    />
                )}
            </div>
            
            {/* Action buttons */}
            <CharacterEditActions
                onSave={handleSave}
                onCancel={onCancel}
                saving={saving}
            />
        </div>
    );
};
```

### **CharacterDetail**

Displays comprehensive character information in a read-only format.

**Purpose**: Provides detailed character viewing with all related information.

**Key Features**:
- **Comprehensive Display**: Shows all character information and relationships
- **Print-Friendly**: Optimized layout for printing character sheets
- **Export Options**: Export character data in various formats
- **Share Functionality**: Share character information with other users

**Source File**: `frontend/src/features/character/CharacterDetail.tsx`

```typescript
interface CharacterDetailProps {
    characterId: number;
    onEdit: () => void;
    onBack: () => void;
}

export const CharacterDetail: React.FC<CharacterDetailProps> = ({
    characterId,
    onEdit,
    onBack,
}) => {
    const [character, setCharacter] = useState<CharacterWithDetails | null>(null);
    const [loading, setLoading] = useState(true);

    // Component implementation
    return (
        <div className="character-detail">
            {/* Character header */}
            <CharacterHeader
                character={character}
                onEdit={onEdit}
                onBack={onBack}
            />
            
            {/* Character sections */}
            <div className="character-sections">
                <BasicInfoSection character={character} />
                <AbilityScoresSection character={character} />
                <AdvancementSection character={character} />
                <SpellsSection character={character} />
                <EquipmentSection character={character} />
            </div>
            
            {/* Action buttons */}
            <CharacterDetailActions
                character={character}
                onEdit={onEdit}
                onPrint={handlePrint}
                onExport={handleExport}
            />
        </div>
    );
};
```

## 📊 **Tab Components**

### **BasicInfoTab**

Handles basic character information editing including name, race, alignment, and physical characteristics.

**Purpose**: Manages core character identity and basic attributes.

**Key Features**:
- **Character Identity**: Name, race, alignment selection
- **Physical Characteristics**: Age, height, weight, appearance
- **Validation**: Real-time validation of character information
- **Auto-completion**: Smart suggestions for character names and descriptions

**Source File**: `frontend/src/features/character/tabs/BasicInfoTab.tsx`

```typescript
interface BasicInfoTabProps {
    character: Character | null;
    onChange: (character: Character) => void;
}

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
    character,
    onChange,
}) => {
    const [races, setRaces] = useState<Race[]>([]);
    const [alignments, setAlignments] = useState<Alignment[]>([]);

    return (
        <div className="basic-info-tab">
            <form onSubmit={handleSubmit}>
                {/* Character name */}
                <FormField
                    label="Character Name"
                    name="name"
                    value={character?.name || ''}
                    onChange={handleNameChange}
                    required
                    maxLength={100}
                />
                
                {/* Race selection */}
                <FormField
                    label="Race"
                    name="raceId"
                    type="select"
                    value={character?.raceId || ''}
                    onChange={handleRaceChange}
                    options={races.map(race => ({
                        value: race.id,
                        label: race.name,
                    }))}
                    required
                />
                
                {/* Alignment selection */}
                <FormField
                    label="Alignment"
                    name="alignmentId"
                    type="select"
                    value={character?.alignmentId || ''}
                    onChange={handleAlignmentChange}
                    options={alignments.map(alignment => ({
                        value: alignment.id,
                        label: alignment.name,
                    }))}
                    required
                />
                
                {/* Physical characteristics */}
                <PhysicalCharacteristicsForm
                    character={character}
                    onChange={handlePhysicalChange}
                />
            </form>
        </div>
    );
};
```

### **AbilityScoresTab**

Manages character ability scores with point-buy, rolling, or manual entry systems.

**Purpose**: Handles character ability score assignment and calculation.

**Key Features**:
- **Multiple Systems**: Point-buy, rolling, and manual entry options
- **Score Calculation**: Automatic modifier calculation and display
- **Validation**: Ensures ability scores meet system requirements
- **Visual Feedback**: Clear display of scores and modifiers

**Source File**: `frontend/src/features/character/tabs/AbilityScoresTab.tsx`

```typescript
interface AbilityScoresTabProps {
    character: Character | null;
    onChange: (character: Character) => void;
}

export const AbilityScoresTab: React.FC<AbilityScoresTabProps> = ({
    character,
    onChange,
}) => {
    const [abilityScores, setAbilityScores] = useState<AbilityScore[]>([]);
    const [generationMethod, setGenerationMethod] = useState<'point-buy' | 'rolling' | 'manual'>('point-buy');

    return (
        <div className="ability-scores-tab">
            {/* Generation method selection */}
            <AbilityScoreGenerationMethod
                method={generationMethod}
                onMethodChange={setGenerationMethod}
            />
            
            {/* Ability score inputs */}
            <div className="ability-scores-grid">
                {Object.values(AbilityScoreType).map(abilityType => (
                    <AbilityScoreInput
                        key={abilityType}
                        abilityType={abilityType}
                        value={getAbilityScore(abilityType)}
                        onChange={handleAbilityScoreChange}
                        modifier={calculateModifier(getAbilityScore(abilityType))}
                        generationMethod={generationMethod}
                    />
                ))}
            </div>
            
            {/* Point-buy calculator */}
            {generationMethod === 'point-buy' && (
                <PointBuyCalculator
                    abilityScores={abilityScores}
                    onScoresChange={setAbilityScores}
                />
            )}
            
            {/* Dice roller */}
            {generationMethod === 'rolling' && (
                <DiceRoller
                    onRollsComplete={handleRollsComplete}
                />
            )}
        </div>
    );
};
```

### **AdvancementTab**

Manages character advancement including level progression, class selection, and feature choices.

**Purpose**: Handles character level progression and advancement decisions.

**Key Features**:
- **Level Progression**: Step-by-step level advancement process
- **Class Selection**: Primary and secondary class selection
- **Feature Choices**: Class feature and ability score improvement selection
- **Validation**: Ensures advancement follows proper rules

**Source File**: `frontend/src/features/character/tabs/AdvancementTab.tsx`

```typescript
interface AdvancementTabProps {
    character: Character | null;
    onChange: (character: Character) => void;
}

export const AdvancementTab: React.FC<AdvancementTabProps> = ({
    character,
    onChange,
}) => {
    const [advancements, setAdvancements] = useState<CharacterAdvancement[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [currentLevel, setCurrentLevel] = useState(1);

    return (
        <div className="advancement-tab">
            {/* Level progression */}
            <LevelProgression
                currentLevel={currentLevel}
                advancements={advancements}
                onLevelChange={setCurrentLevel}
            />
            
            {/* Class selection */}
            <ClassSelection
                classes={classes}
                selectedClass={getSelectedClass()}
                onClassChange={handleClassChange}
                allowMulticlassing={true}
            />
            
            {/* Feature choices */}
            <FeatureChoices
                character={character}
                level={currentLevel}
                selectedClass={getSelectedClass()}
                onChoicesChange={handleFeatureChoicesChange}
            />
            
            {/* Hit points */}
            <HitPointsInput
                value={getHitPoints()}
                onChange={handleHitPointsChange}
                classHitDie={getSelectedClass()?.hitDie}
            />
            
            {/* Advancement summary */}
            <AdvancementSummary
                advancement={getCurrentAdvancement()}
                onSave={handleAdvancementSave}
            />
        </div>
    );
};
```

### **SpellsTab**

Manages character spell preparation, known spells, and metamagic integration.

**Purpose**: Handles spellcasting character spell management and preparation.

**Key Features**:
- **Spell Preparation**: Daily spell preparation interface
- **Known Spells**: Character spell knowledge management
- **Metamagic Integration**: Metamagic feat application to spells
- **Spell Filtering**: Search and filter spells by school, level, or descriptor

**Source File**: `frontend/src/features/character/tabs/SpellsTab.tsx`

```typescript
interface SpellsTabProps {
    character: Character | null;
    onChange: (character: Character) => void;
}

export const SpellsTab: React.FC<SpellsTabProps> = ({
    character,
    onChange,
}) => {
    const [spells, setSpells] = useState<Spell[]>([]);
    const [preparedSpells, setPreparedSpells] = useState<CharacterSpellPreparation[]>([]);
    const [metamagics, setMetamagics] = useState<Metamagic[]>([]);

    return (
        <div className="spells-tab">
            {/* Spell preparation */}
            <SpellPreparation
                character={character}
                spells={spells}
                preparedSpells={preparedSpells}
                onPreparationChange={setPreparedSpells}
            />
            
            {/* Known spells */}
            <KnownSpells
                character={character}
                spells={spells}
                onSpellsChange={handleKnownSpellsChange}
            />
            
            {/* Metamagic application */}
            <MetamagicApplication
                preparedSpells={preparedSpells}
                metamagics={metamagics}
                onMetamagicChange={handleMetamagicChange}
            />
            
            {/* Spell slots */}
            <SpellSlots
                character={character}
                preparedSpells={preparedSpells}
            />
        </div>
    );
};
```

### **EquipmentTab**

Manages character equipment, inventory, and item properties.

**Purpose**: Handles character equipment and inventory management.

**Key Features**:
- **Equipment Management**: Character equipment and inventory
- **Item Properties**: Application of item properties and enhancements
- **Weight Management**: Carrying capacity and weight tracking
- **Equipment Sets**: Quick equipment set switching

**Source File**: `frontend/src/features/character/tabs/EquipmentTab.tsx`

```typescript
interface EquipmentTabProps {
    character: Character | null;
    onChange: (character: Character) => void;
}

export const EquipmentTab: React.FC<EquipmentTabProps> = ({
    character,
    onChange,
}) => {
    const [items, setItems] = useState<Item[]>([]);
    const [characterItems, setCharacterItems] = useState<CharacterItem[]>([]);
    const [equipmentSlots, setEquipmentSlots] = useState<EquipmentSlot[]>([]);

    return (
        <div className="equipment-tab">
            {/* Equipment slots */}
            <EquipmentSlots
                slots={equipmentSlots}
                characterItems={characterItems}
                onSlotChange={handleSlotChange}
            />
            
            {/* Inventory */}
            <Inventory
                characterItems={characterItems}
                onItemChange={handleItemChange}
                onItemAdd={handleItemAdd}
                onItemRemove={handleItemRemove}
            />
            
            {/* Item properties */}
            <ItemProperties
                characterItems={characterItems}
                onPropertyChange={handlePropertyChange}
            />
            
            {/* Weight and capacity */}
            <WeightManagement
                character={character}
                characterItems={characterItems}
            />
        </div>
    );
};
```

## 🔧 **Configuration and Utilities**

### **CharacterConfig**

Provides configuration constants and utilities for character management components.

**Purpose**: Centralizes character management configuration and provides utility functions.

**Key Features**:
- **Component Configuration**: Default values and settings
- **Validation Rules**: Character validation constants
- **UI Constants**: Interface layout and styling constants
- **Utility Functions**: Common character management utilities

**Source File**: `frontend/src/features/character/CharacterConfig.ts`

```typescript
export const CharacterConfig = {
    // Component settings
    TABS: {
        BASIC: 'basic',
        ABILITY_SCORES: 'ability-scores',
        ADVANCEMENT: 'advancement',
        SPELLS: 'spells',
        EQUIPMENT: 'equipment',
    },
    
    // Validation constants
    VALIDATION: {
        MIN_NAME_LENGTH: 1,
        MAX_NAME_LENGTH: 100,
        MIN_ABILITY_SCORE: 1,
        MAX_ABILITY_SCORE: 50,
        MIN_AGE: 0,
        MAX_AGE: 1000,
    },
    
    // UI constants
    UI: {
        GRID_COLUMNS: 3,
        ITEMS_PER_PAGE: 12,
        AUTO_SAVE_DELAY: 2000,
    },
    
    // Utility functions
    UTILS: {
        calculateAbilityModifier: (score: number): number => Math.floor((score - 10) / 2),
        validateCharacterName: (name: string): boolean => {
            return name.length >= CharacterConfig.VALIDATION.MIN_NAME_LENGTH &&
                   name.length <= CharacterConfig.VALIDATION.MAX_NAME_LENGTH;
        },
        formatCharacterLevel: (level: number): string => `Level ${level}`,
    },
} as const;
```

### **CharacterApi**

Provides API client functionality for character management operations.

**Purpose**: Handles all backend API communication for character operations.

**Key Features**:
- **CRUD Operations**: Create, read, update, delete character operations
- **Error Handling**: Comprehensive error handling and retry logic
- **Request/Response Validation**: Zod schema validation for API data
- **Caching**: Intelligent caching for frequently accessed data

**Source File**: `frontend/src/features/character/CharacterApi.ts`

```typescript
export class CharacterApi {
    private baseUrl: string;
    private authToken: string;

    constructor(baseUrl: string, authToken: string) {
        this.baseUrl = baseUrl;
        this.authToken = authToken;
    }

    // Character CRUD operations
    async createCharacter(data: CreateCharacterRequest): Promise<Character> {
        const response = await this.post('/characters', data);
        return CharacterSchema.parse(response.data);
    }

    async getCharacter(id: number): Promise<CharacterWithDetails> {
        const response = await this.get(`/characters/${id}`);
        return CharacterWithAllDetailsSchema.parse(response.data);
    }

    async updateCharacter(id: number, data: UpdateCharacterRequest): Promise<Character> {
        const response = await this.put(`/characters/${id}`, data);
        return CharacterSchema.parse(response.data);
    }

    async deleteCharacter(id: number): Promise<void> {
        await this.delete(`/characters/${id}`);
    }

    // Advancement operations
    async createAdvancement(data: CreateAdvancementRequest): Promise<CharacterAdvancement> {
        const response = await this.post('/advancements', data);
        return CharacterAdvancementSchema.parse(response.data);
    }

    async updateAdvancement(id: number, data: UpdateAdvancementRequest): Promise<CharacterAdvancement> {
        const response = await this.put(`/advancements/${id}`, data);
        return CharacterAdvancementSchema.parse(response.data);
    }

    // Ability score operations
    async updateAbilityScore(characterId: number, abilityId: number, value: number): Promise<UserCharacterAbilityScore> {
        const response = await this.put(`/characters/${characterId}/ability-scores/${abilityId}`, { value });
        return CharacterAbilityScoreSchema.parse(response.data);
    }

    // Spell preparation operations
    async createSpellPreparation(data: CreateSpellPreparationRequest): Promise<CharacterSpellPreparation> {
        const response = await this.post('/spell-preparations', data);
        return CharacterSpellPreparationSchema.parse(response.data);
    }

    async updateSpellPreparation(id: number, data: UpdateSpellPreparationRequest): Promise<CharacterSpellPreparation> {
        const response = await this.put(`/spell-preparations/${id}`, data);
        return CharacterSpellPreparationSchema.parse(response.data);
    }

    // Private HTTP methods
    private async get(url: string): Promise<ApiResponse> {
        return this.request('GET', url);
    }

    private async post(url: string, data: unknown): Promise<ApiResponse> {
        return this.request('POST', url, data);
    }

    private async put(url: string, data: unknown): Promise<ApiResponse> {
        return this.request('PUT', url, data);
    }

    private async delete(url: string): Promise<ApiResponse> {
        return this.request('DELETE', url);
    }

    private async request(method: string, url: string, data?: unknown): Promise<ApiResponse> {
        const response = await fetch(`${this.baseUrl}${url}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.authToken}`,
            },
            body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
            throw new ApiError(response.status, response.statusText);
        }

        return response.json();
    }
}
```

## 🎯 **State Management**

### **Character State**

Manages character data state across components and provides state synchronization.

**Purpose**: Centralizes character state management and provides state update mechanisms.

**Key Features**:
- **Global State**: Character data accessible across components
- **State Synchronization**: Automatic state updates across components
- **Optimistic Updates**: Immediate UI updates with rollback on error
- **State Persistence**: Automatic state persistence and recovery

**Implementation**:
```typescript
// Character context
interface CharacterContextType {
    character: Character | null;
    setCharacter: (character: Character) => void;
    updateCharacter: (updates: Partial<Character>) => void;
    saveCharacter: () => Promise<void>;
    loading: boolean;
    error: string | null;
}

export const CharacterContext = createContext<CharacterContextType | null>(null);

// Character provider
export const CharacterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [character, setCharacter] = useState<Character | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateCharacter = useCallback((updates: Partial<Character>) => {
        setCharacter(prev => prev ? { ...prev, ...updates } : null);
    }, []);

    const saveCharacter = useCallback(async () => {
        if (!character) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const savedCharacter = await characterApi.updateCharacter(character.id, character);
            setCharacter(savedCharacter);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save character');
        } finally {
            setLoading(false);
        }
    }, [character]);

    return (
        <CharacterContext.Provider value={{
            character,
            setCharacter,
            updateCharacter,
            saveCharacter,
            loading,
            error,
        }}>
            {children}
        </CharacterContext.Provider>
    );
};
```

## 🔗 **Cross-System Integration**

### **Race System Integration**

The character management frontend integrates with the race system for character creation.

**Integration Points**:
- **Race Selection**: Race dropdown and information display
- **Race Bonuses**: Automatic ability score bonus application
- **Race Features**: Race-specific feature display and selection

**Implementation**:
```typescript
// Race integration in BasicInfoTab
const [races, setRaces] = useState<Race[]>([]);

useEffect(() => {
    const loadRaces = async () => {
        const raceData = await raceApi.getAllRaces();
        setRaces(raceData);
    };
    loadRaces();
}, []);

const handleRaceChange = (raceId: number) => {
    const selectedRace = races.find(race => race.id === raceId);
    if (selectedRace && character) {
        // Apply race bonuses to ability scores
        const updatedCharacter = applyRaceBonuses(character, selectedRace);
        onChange(updatedCharacter);
    }
};
```

### **Class System Integration**

The character management frontend integrates with the class system for character advancement.

**Integration Points**:
- **Class Selection**: Class dropdown and information display
- **Class Features**: Class feature selection and application
- **Multiclassing**: Multiclassing support and validation

**Implementation**:
```typescript
// Class integration in AdvancementTab
const [classes, setClasses] = useState<Class[]>([]);

useEffect(() => {
    const loadClasses = async () => {
        const classData = await classApi.getAllClasses();
        setClasses(classData);
    };
    loadClasses();
}, []);

const handleClassChange = (classId: number) => {
    const selectedClass = classes.find(cls => cls.id === classId);
    if (selectedClass) {
        // Update advancement with class selection
        const updatedAdvancement = { ...advancement, classId };
        setAdvancement(updatedAdvancement);
    }
};
```

### **Feat System Integration**

The character management frontend integrates with the feat system for character customization.

**Integration Points**:
- **Feat Selection**: Feat selection interface and validation
- **Feat Prerequisites**: Automatic prerequisite checking
- **Feat Benefits**: Feat benefit application and display

**Implementation**:
```typescript
// Feat integration in AdvancementTab
const [availableFeats, setAvailableFeats] = useState<Feat[]>([]);

useEffect(() => {
    const loadFeats = async () => {
        const featData = await featApi.getAvailableFeats(character, level);
        setAvailableFeats(featData);
    };
    loadFeats();
}, [character, level]);

const handleFeatSelection = (featId: number) => {
    const selectedFeat = availableFeats.find(feat => feat.id === featId);
    if (selectedFeat && validateFeatPrerequisites(character, selectedFeat)) {
        // Add feat to advancement
        const updatedAdvancement = {
            ...advancement,
            feats: [...advancement.feats, { featId }],
        };
        setAdvancement(updatedAdvancement);
    }
};
```

### **Spell System Integration**

The character management frontend integrates with the spell system for spellcasting characters.

**Integration Points**:
- **Spell Selection**: Spell selection interface and filtering
- **Spell Preparation**: Daily spell preparation management
- **Metamagic Integration**: Metamagic feat application to spells

**Implementation**:
```typescript
// Spell integration in SpellsTab
const [spells, setSpells] = useState<Spell[]>([]);

useEffect(() => {
    const loadSpells = async () => {
        const spellData = await spellApi.getSpellsForClass(character.classId);
        setSpells(spellData);
    };
    loadSpells();
}, [character.classId]);

const handleSpellPreparation = (spellId: number, level: number) => {
    const spell = spells.find(s => s.id === spellId);
    if (spell) {
        // Add spell to preparation
        const newPreparation = {
            characterId: character.id,
            prepKey: 'daily_spells',
            spellId,
            level,
        };
        setPreparedSpells(prev => [...prev, newPreparation]);
    }
};
```

## 📚 **Related Documentation**

### **System Documentation**
- **[Database Schema](database-schema.md)** — Prisma models and relationships
- **[Validation Schemas](validation-schemas.md)** — Zod validation schemas
- **[Static Data](static-data.md)** — Static data structures and constants
- **[Backend Implementation](backend-implementation.md)** — Backend services and API

### **Application Overview**
- **[Frontend Components Overview](../application-overview/frontend-components.md)** — Shared frontend patterns
- **[State Management Patterns](../application-overview/frontend-components.md#state-management)** — Shared state management patterns
- **[Form Handling Patterns](../application-overview/frontend-components.md#form-handling)** — Shared form handling patterns

### **Cross-System Integration**
- **[Race System Frontend](../race-system/frontend-components.md)** — Race system frontend integration
- **[Class System Frontend](../class-system/frontend-components.md)** — Class system frontend integration
- **[Feat System Frontend](../feat-system/frontend-components.md)** — Feat system frontend integration
- **[Spell System Frontend](../spell-system/frontend-components.md)** — Spell system frontend integration

## Summary

The character management frontend components provide comprehensive user interfaces for character creation, editing, advancement, and management. The components follow established React patterns with robust state management, form handling, and cross-system integration.

The implementation ensures type safety, user-friendly interfaces, and seamless integration with the backend API and other systems throughout the application.
