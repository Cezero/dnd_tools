import {
    GetAllFeaturesResponse,
    CreateFeatureRequest,
    UpdateFeatureRequest,
    FeatureIdParamRequest,
    GetFeatureResponse,
    CreateResponse,
    UpdateResponse,
    CreateFeatureProgressionRequest,
} from '@shared/schema';

// Service interface
export interface FeatureSystemService {
    // Core Feature CRUD operations
    getAllFeatures: (sourceType?: number) => Promise<GetAllFeaturesResponse>;
    getFeatureById: (query: FeatureIdParamRequest) => Promise<GetFeatureResponse | null>;
    createFeature: (data: CreateFeatureRequest) => Promise<CreateResponse>;
    updateFeature: (query: FeatureIdParamRequest, data: UpdateFeatureRequest) => Promise<UpdateResponse>;
    deleteFeature: (query: FeatureIdParamRequest) => Promise<UpdateResponse>;
    updateFeatureById: (query: FeatureIdParamRequest, data: UpdateFeatureRequest) => Promise<UpdateResponse>;
    deleteFeatureById: (query: FeatureIdParamRequest) => Promise<UpdateResponse>;

    // Bulk Feature Progression management (for class/race creation)
    createFeatureProgressionWithRelations: (data: CreateFeatureProgressionRequest) => Promise<CreateResponse>;
} 
