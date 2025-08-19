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
    CreateCharacterAttributeRequest,
    UpdateCharacterAttributeRequest,
    CharacterAttributeResponse,
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

    // Character attribute methods
    createCharacterAttribute: (data: CreateCharacterAttributeRequest) => Promise<CreateResponse>;
    updateCharacterAttribute: (id: number, data: UpdateCharacterAttributeRequest) => Promise<UpdateResponse>;
    deleteCharacterAttribute: (id: number) => Promise<UpdateResponse>;
    getCharacterAttributes: (characterId: number) => Promise<CharacterAttributeResponse[]>;
} 
