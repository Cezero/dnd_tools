import {
    TrickIdParamRequest,
    CreateTrickRequest,
    UpdateTrickRequest,
    GetAllTricksResponse,
    GetTrickResponse,
    CreateResponse,
    UpdateResponse,
} from '@shared/schema';

export interface TrickService {
    getAllTricks(editionId?: number): Promise<GetAllTricksResponse>;
    getTrickById(query: TrickIdParamRequest): Promise<GetTrickResponse | null>;
    createTrick(data: CreateTrickRequest): Promise<CreateResponse>;
    updateTrick(data: UpdateTrickRequest, query: TrickIdParamRequest): Promise<UpdateResponse>;
    deleteTrick(query: TrickIdParamRequest): Promise<UpdateResponse>;
}

