import type {
    GetAllCharactersResponse,
    CharacterResponse,
    CreateCharacterRequest,
    UpdateCharacterRequest,
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
} from '@shared/schema';

// Service interface
export interface CharacterService {
    getAllCharacters: (userId: number) => Promise<GetAllCharactersResponse>;
    getCharacterById: (query: CharacterIdParamRequest) => Promise<CharacterResponse | null>;
    getCharacterWithAllDetails: (query: CharacterIdParamRequest) => Promise<CharacterWithAllDetailsResponse | null>;
    createCharacter: (data: CreateCharacterRequest) => Promise<CreateResponse>;
    updateCharacter: (query: CharacterIdParamRequest, data: UpdateCharacterRequest) => Promise<UpdateResponse>;
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
} 
