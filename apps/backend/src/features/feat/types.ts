import {
    GetAllFeatsResponse,
    GetAllFeatsWithFeatureInfoResponse,
    FeatIdParamRequest,
    UpdateFeatRequest,
    CreateFeatRequest,
    UpdateResponse,
    CreateResponse,
    FeatQueryRequest,
    FeatQueryResponse,
    GetFeatListResponse,
    FeatCacheResponse,
    GetFeatByIdResponse,
} from '@shared/schema';

export interface FeatService {
    getAllFeats: () => Promise<GetAllFeatsResponse>;
    getAllFeatsFull: () => Promise<FeatQueryResponse>;
    getAllFeatsWithFeatureInfo: () => Promise<GetAllFeatsWithFeatureInfoResponse>;
    getFeatById: (id: FeatIdParamRequest) => Promise<GetFeatByIdResponse | null>;
    featQuery: (query: FeatQueryRequest) => Promise<FeatQueryResponse>;
    getFeatList: (query: FeatQueryRequest) => Promise<GetFeatListResponse>;
    createFeat: (data: CreateFeatRequest) => Promise<CreateResponse>;
    updateFeat: (id: FeatIdParamRequest, data: UpdateFeatRequest) => Promise<UpdateResponse>;
    deleteFeat: (id: FeatIdParamRequest) => Promise<UpdateResponse>;
    getFeatCache: (query: FeatQueryRequest) => Promise<FeatCacheResponse>;
}
