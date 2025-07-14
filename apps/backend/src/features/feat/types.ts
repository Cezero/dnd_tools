import {
    GetFeatResponse,
    GetAllFeatsResponse,
    FeatIdParamRequest,
    UpdateFeatRequest,
    CreateFeatRequest,
    UpdateResponse,
    CreateResponse,
} from '@shared/schema';

export interface FeatService {
    getAllFeats: () => Promise<GetAllFeatsResponse>;
    getFeatById: (id: FeatIdParamRequest) => Promise<GetFeatResponse | null>;
    createFeat: (data: CreateFeatRequest) => Promise<CreateResponse>;
    updateFeat: (id: FeatIdParamRequest, data: UpdateFeatRequest) => Promise<UpdateResponse>;
    deleteFeat: (id: FeatIdParamRequest) => Promise<UpdateResponse>;
}
