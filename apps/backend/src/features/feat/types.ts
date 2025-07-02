import {
    FeatQueryRequest,
    FeatResponse,
    FeatIdParamRequest,
    UpdateFeatRequest,
    CreateFeatRequest,
    FeatQueryResponse
} from '@shared/schema';

export interface FeatService {
    getFeats: (query: FeatQueryRequest) => Promise<FeatQueryResponse>;
    getAllFeats: () => Promise<Array<FeatResponse>>;
    getFeatById: (id: FeatIdParamRequest) => Promise<FeatResponse | null>;
    createFeat: (data: CreateFeatRequest) => Promise<{ id: number; message: string }>;
    updateFeat: (id: FeatIdParamRequest, data: UpdateFeatRequest) => Promise<{ message: string }>;
    deleteFeat: (id: FeatIdParamRequest) => Promise<{ message: string }>;
} 