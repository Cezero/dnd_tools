import {
    GetAllFeaturesResponse,
    CreateFeatureRequest,
    UpdateFeatureRequest,
    FeatureIdParamRequest,
    FeatureSlugParamRequest,
    GetFeatureResponse,
    CreateResponse,
    UpdateResponse,
    GetFeatureProgressionsResponse,
    CreateFeatureProgressionRequest,
    UpdateFeatureProgressionRequest,
    GetFeatureModifiersResponse,
    CreateFeatureModifierRequest,
    UpdateFeatureModifierRequest,
    GetFeatureChoicesResponse,
    CreateFeatureChoiceRequest,
    UpdateFeatureChoiceRequest,
    GetFeatureSpecialEffectsResponse,
    CreateFeatureSpecialEffectRequest,
    UpdateFeatureSpecialEffectRequest,
} from '@shared/schema';

// Service interface
export interface FeatureSystemService {
    // Core Feature CRUD operations
    getAllFeatures: () => Promise<GetAllFeaturesResponse>;
    getFeatureById: (query: FeatureIdParamRequest) => Promise<GetFeatureResponse | null>;
    getFeatureBySlug: (query: FeatureSlugParamRequest) => Promise<GetFeatureResponse | null>;
    createFeature: (data: CreateFeatureRequest) => Promise<CreateResponse>;
    updateFeature: (query: FeatureSlugParamRequest, data: UpdateFeatureRequest) => Promise<UpdateResponse>;
    deleteFeature: (query: FeatureSlugParamRequest) => Promise<UpdateResponse>;

    // Feature Progression management (the actual linkage)
    getFeatureProgressions: (sourceType: number, sourceId: number) => Promise<GetFeatureProgressionsResponse>;
    createFeatureProgression: (data: CreateFeatureProgressionRequest) => Promise<CreateResponse>;
    updateFeatureProgression: (id: number, data: UpdateFeatureProgressionRequest) => Promise<UpdateResponse>;
    deleteFeatureProgression: (id: number) => Promise<UpdateResponse>;

    // Feature Modifiers and effects
    getFeatureModifiers: (progressionId: number) => Promise<GetFeatureModifiersResponse>;
    createFeatureModifier: (data: CreateFeatureModifierRequest) => Promise<CreateResponse>;
    updateFeatureModifier: (id: number, data: UpdateFeatureModifierRequest) => Promise<UpdateResponse>;
    deleteFeatureModifier: (id: number) => Promise<UpdateResponse>;

    // Feature Choices
    getFeatureChoices: (progressionId: number) => Promise<GetFeatureChoicesResponse>;
    createFeatureChoice: (data: CreateFeatureChoiceRequest) => Promise<CreateResponse>;
    updateFeatureChoice: (id: number, data: UpdateFeatureChoiceRequest) => Promise<UpdateResponse>;
    deleteFeatureChoice: (id: number) => Promise<UpdateResponse>;

    // Special Effects
    getFeatureSpecialEffects: (progressionId: number) => Promise<GetFeatureSpecialEffectsResponse>;
    createFeatureSpecialEffect: (data: CreateFeatureSpecialEffectRequest) => Promise<CreateResponse>;
    updateFeatureSpecialEffect: (id: number, data: UpdateFeatureSpecialEffectRequest) => Promise<UpdateResponse>;
    deleteFeatureSpecialEffect: (id: number) => Promise<UpdateResponse>;
} 
