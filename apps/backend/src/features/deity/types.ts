import {
    Deity,
    GetAllDeitiesResponse,
    CreateDeityRequest,
    UpdateDeityRequest,
    DeityIdParamRequest,
    CreateResponse,
    UpdateResponse,
} from '@shared/schema';

export interface DeityService {
    // CRUD operations
    getAllDeities(): Promise<GetAllDeitiesResponse>;
    getDeityById(query: DeityIdParamRequest): Promise<Deity | null>;
    createDeity(data: CreateDeityRequest): Promise<CreateResponse>;
    updateDeity(data: UpdateDeityRequest, query: DeityIdParamRequest): Promise<UpdateResponse>;
    deleteDeity(query: DeityIdParamRequest): Promise<UpdateResponse>;

    // Deity-specific operations
    validateDeitySelection(advancementId: number, deityId: number): Promise<ValidationResult>;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}
