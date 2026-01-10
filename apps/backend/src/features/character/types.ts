import type {
    GetAllCharactersResponse,
    Character,
    CreateCharacterRequest,
    CharacterIdParamRequest,
    CreateResponse,
    UpdateResponse,
    // New types for advancement and spell preparation
    CreateAdvancementRequest,
    UpdateAdvancementRequest,
    CharacterAdvancementWithDetailsResponse,
    CreateSpellPreparationRequest,
    UpdateSpellPreparationRequest,
    CharacterSpellPreparationWithMetamagicResponse,
    CreateCharacterAbilityScoreRequest,
    UpdateCharacterAbilityScoreRequest,
    CharacterAbilityScoreResponse,
    CharacterWithAllDetailsResponse,
    SaveCharacterRequest,
    // NEW: Character disallowed source types
    CreateCharacterDisallowedSourceRequest,
    CharacterDisallowedSource,
    // NEW: Character attack definition types
    CreateCharacterAttackDefinitionRequest,
    UpdateCharacterAttackDefinitionRequest,
    CharacterAttackDefinition,
    // NEW: Spell types
    Spell,
} from '@shared/schema';
import type { GestaltStats } from '@shared/utils';

// Service interface
export interface CharacterService {
    getAllCharacters: (userId: number) => Promise<GetAllCharactersResponse>;
    getAllCharactersAdmin: () => Promise<GetAllCharactersResponse>;
    getCharacterById: (query: CharacterIdParamRequest) => Promise<Character | null>;
    getCharacterWithAllDetails: (query: CharacterIdParamRequest) => Promise<CharacterWithAllDetailsResponse | null>;
    createCharacter: (data: CreateCharacterRequest) => Promise<CreateResponse>;
    saveCharacter: (characterId: number | null, data: SaveCharacterRequest) => Promise<CreateResponse | UpdateResponse>;
    deleteCharacter: (query: CharacterIdParamRequest) => Promise<UpdateResponse>;

    // Character advancement methods
    createAdvancement: (data: CreateAdvancementRequest) => Promise<CreateResponse>;
    updateAdvancement: (id: number, data: UpdateAdvancementRequest) => Promise<UpdateResponse>;
    deleteAdvancement: (id: number) => Promise<UpdateResponse>;
    getAdvancementById: (id: number) => Promise<CharacterAdvancementWithDetailsResponse | null>;
    getCharacterAdvancements: (characterId: number) => Promise<CharacterAdvancementWithDetailsResponse[]>;

    // Spell preparation methods
    createSpellPreparation: (data: CreateSpellPreparationRequest) => Promise<CreateResponse>;
    updateSpellPreparation: (characterId: number, prepKey: string, data: UpdateSpellPreparationRequest) => Promise<UpdateResponse>;
    deleteSpellPreparation: (characterId: number, prepKey: string) => Promise<UpdateResponse>;
    getCharacterSpellPreparations: (characterId: number) => Promise<CharacterSpellPreparationWithMetamagicResponse[]>;

    // Character ability score methods
    createCharacterAbilityScore: (data: CreateCharacterAbilityScoreRequest) => Promise<CreateResponse>;
    updateCharacterAbilityScore: (id: number, data: UpdateCharacterAbilityScoreRequest) => Promise<UpdateResponse>;
    deleteCharacterAbilityScore: (id: number) => Promise<UpdateResponse>;
    getCharacterAbilityScores: (characterId: number) => Promise<CharacterAbilityScoreResponse[]>;
    upsertCharacterAbilityScores: (data: { characterId: number; abilityScores: Array<{ abilityId: number; value: number }> }) => Promise<UpdateResponse>;

    // NEW: Character disallowed sources methods
    addDisallowedSource: (data: CreateCharacterDisallowedSourceRequest) => Promise<CharacterDisallowedSource>;
    removeDisallowedSource: (characterId: number, sourceBookId: number) => Promise<void>;
    getDisallowedSources: (characterId: number) => Promise<CharacterDisallowedSource[]>;

    // NEW: Character attack definition methods
    getCharacterAttackDefinitions: (characterId: number) => Promise<CharacterAttackDefinition[]>;
    createCharacterAttackDefinition: (characterId: number, data: CreateCharacterAttackDefinitionRequest) => Promise<CreateResponse>;
    updateCharacterAttackDefinition: (characterId: number, attackId: number, data: UpdateCharacterAttackDefinitionRequest) => Promise<UpdateResponse>;
    deleteCharacterAttackDefinition: (characterId: number, attackId: number) => Promise<UpdateResponse>;
    reorderCharacterAttackDefinitions: (characterId: number, attackDefinitionIds: number[]) => Promise<UpdateResponse>;

    // NEW: Gestalt character calculation methods
    calculateCharacterStats: (character: CharacterWithAllDetailsResponse) => Promise<{
        isGestalt: boolean;
        totalLevel: number;
        stats: GestaltStats | null;
        errors: string[];
    }>;
    calculateAdvancementStats: (character: CharacterWithAllDetailsResponse, advancementLevel: number) => Promise<{
        stats: GestaltStats | null;
        errors: string[];
    }>;

    // NEW: Spell selection methods
    getCharacterDomains: (characterId: number, classId: number) => Promise<number[]>;
    getAvailableSpellsForClass: (characterId: number, classId: number, resolvedProgressions?: import('@shared/schema').FeatureProgression[]) => Promise<{
        spells: Array<{ spell: Spell; classSpellLevel: number | null; isKnown: boolean; isFreeGrant?: boolean }>;
        domainSpells: Array<{ domainId: number; domainName: string; spell: Spell; spellLevel: number; classSpellLevel: number | null; isKnown: boolean }>;
        availableFreeSpells?: number;
    }>;
    addSpellKnown: (characterId: number, classId: number, spellId: number, advancementId: number, isFreeGrant?: boolean, resolvedProgressions?: import('@shared/schema').FeatureProgression[]) => Promise<import('@shared/schema').AddSpellKnownResponse>;
    removeSpellKnown: (characterId: number, spellId: number, advancementId: number) => Promise<import('@shared/schema').RemoveSpellKnownResponse>;
    getMaxCastableSpellLevel: (classId: number, characterLevel: number) => Promise<number>;
    validateSpellLevelForAdvancement: (classId: number, advancementLevel: number, spellLevel: number) => Promise<boolean>;
    countFreeGrantsForAdvancement: (advancementId: number) => Promise<number>;

} 
