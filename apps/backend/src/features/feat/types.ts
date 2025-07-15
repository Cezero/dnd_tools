import {
    GetFeatResponse,
    GetAllFeatsResponse,
    FeatIdParamRequest,
    UpdateFeatRequest,
    CreateFeatRequest,
    UpdateResponse,
    CreateResponse,
    FeatQueryRequest,
    FeatQueryResponse,
} from '@shared/schema';

export interface FeatService {
    getAllFeats: () => Promise<GetAllFeatsResponse>;
    getFeatById: (id: FeatIdParamRequest) => Promise<GetFeatResponse | null>;
    featQuery: (query: FeatQueryRequest) => Promise<FeatQueryResponse>;
    createFeat: (data: CreateFeatRequest) => Promise<CreateResponse>;
    updateFeat: (id: FeatIdParamRequest, data: UpdateFeatRequest) => Promise<UpdateResponse>;
    deleteFeat: (id: FeatIdParamRequest) => Promise<UpdateResponse>;
}
