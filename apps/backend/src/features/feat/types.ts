import {
    Feat,
    GetAllFeatsResponse,
    FeatIdParamRequest,
    UpdateFeatRequest,
    CreateFeatRequest,
    UpdateResponse,
    CreateResponse,
    FeatQueryRequest,
    FeatQueryResponse,
    GetFeatListResponse,
} from '@shared/schema';

export interface FeatService {
    getAllFeats: () => Promise<GetAllFeatsResponse>;
    getFeatById: (id: FeatIdParamRequest) => Promise<Feat | null>;
    featQuery: (query: FeatQueryRequest) => Promise<FeatQueryResponse>;
    getFeatList: (query: FeatQueryRequest) => Promise<GetFeatListResponse>;
    createFeat: (data: CreateFeatRequest) => Promise<CreateResponse>;
    updateFeat: (id: FeatIdParamRequest, data: UpdateFeatRequest) => Promise<UpdateResponse>;
    deleteFeat: (id: FeatIdParamRequest) => Promise<UpdateResponse>;
}
