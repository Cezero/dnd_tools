import type {
    GetAllCharactersResponse,
    CharacterResponse,
    CreateCharacterRequest,
    UpdateCharacterRequest,
    CharacterIdParamRequest,
    CreateResponse,
    UpdateResponse,
} from '@shared/schema';

// Service interface
export interface CharacterService {
    getAllCharacters: (userId: number) => Promise<GetAllCharactersResponse>;
    getCharacterById: (query: CharacterIdParamRequest) => Promise<CharacterResponse | null>;
    createCharacter: (data: CreateCharacterRequest) => Promise<CreateResponse>;
    updateCharacter: (query: CharacterIdParamRequest, data: UpdateCharacterRequest) => Promise<UpdateResponse>;
    deleteCharacter: (query: CharacterIdParamRequest) => Promise<UpdateResponse>;
} 
