import {
    CompanionIdParamRequest,
    CreateCompanionRequest,
    UpdateCompanionRequest,
    GetAllCompanionsResponse,
    GetCompanionResponse,
    CreateResponse,
    UpdateResponse,
    CreateCharacterCompanionRequest,
    UpdateCharacterCompanionRequest,
    GetAllCharacterCompanionsResponse,
} from '@shared/schema';

export interface CompanionService {
    getAllCompanions(): Promise<GetAllCompanionsResponse>;
    getCompanionById(query: CompanionIdParamRequest): Promise<GetCompanionResponse | null>;
    createCompanion(data: CreateCompanionRequest): Promise<CreateResponse>;
    updateCompanion(data: UpdateCompanionRequest, query: CompanionIdParamRequest): Promise<UpdateResponse>;
    deleteCompanion(query: CompanionIdParamRequest): Promise<UpdateResponse>;
    getCharacterCompanions(characterId: number): Promise<GetAllCharacterCompanionsResponse>;
    createCharacterCompanion(data: CreateCharacterCompanionRequest): Promise<CreateResponse>;
    updateCharacterCompanion(data: UpdateCharacterCompanionRequest, query: { id: number }): Promise<UpdateResponse>;
    deleteCharacterCompanion(query: { id: number }): Promise<UpdateResponse>;
}

