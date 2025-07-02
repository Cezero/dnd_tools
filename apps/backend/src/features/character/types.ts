import type {
    CharacterQueryRequest,
    CharacterQueryResponse,
    GetAllCharactersResponse,
    CharacterResponse,
    CreateCharacterRequest,
    UpdateCharacterRequest,
    CharacterIdParamRequest,
} from '@shared/schema';

// Service interface
export interface CharacterService {
    getCharacters: (query: CharacterQueryRequest) => Promise<CharacterQueryResponse>;
    getAllCharacters: () => Promise<GetAllCharactersResponse>;
    getCharacterById: (query: CharacterIdParamRequest) => Promise<CharacterResponse | null>;
    createCharacter: (data: CreateCharacterRequest) => Promise<{ id: number; message: string }>;
    updateCharacter: (query: CharacterIdParamRequest, data: UpdateCharacterRequest) => Promise<{ message: string }>;
    deleteCharacter: (query: CharacterIdParamRequest) => Promise<{ message: string }>;
} 