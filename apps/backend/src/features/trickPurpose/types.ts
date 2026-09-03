import {
    TrickPurposeIdParamRequest,
    CreateTrickPurposeRequest,
    UpdateTrickPurposeRequest,
    GetAllTrickPurposesResponse,
    GetTrickPurposeResponse,
    CreateResponse,
    UpdateResponse,
    TrickPurposeCacheResponse,
} from '@shared/schema';

export interface TrickPurposeService {
    getAllTrickPurposes(editionId?: number): Promise<GetAllTrickPurposesResponse>;
    getTrickPurposeById(query: TrickPurposeIdParamRequest): Promise<GetTrickPurposeResponse | null>;
    createTrickPurpose(data: CreateTrickPurposeRequest): Promise<CreateResponse>;
    updateTrickPurpose(data: UpdateTrickPurposeRequest, query: TrickPurposeIdParamRequest): Promise<UpdateResponse>;
    deleteTrickPurpose(query: TrickPurposeIdParamRequest): Promise<UpdateResponse>;
    getTrickPurposeCache(): Promise<TrickPurposeCacheResponse>;
}
