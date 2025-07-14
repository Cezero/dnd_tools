import {    
    GetAllClassesResponse,
    CreateClassRequest,
    UpdateClassRequest,
    ClassIdParamRequest,
    GetAllClassFeaturesResponse,
    GetClassFeatureResponse,
    CreateClassFeatureRequest,
    UpdateClassFeatureRequest,
    ClassFeatureSlugParamRequest,
    GetClassResponse,
    CreateResponse
} from '@shared/schema';

// Service interface
export interface ClassService {
    getAllClasses: () => Promise<GetAllClassesResponse>;
    getClassById: (query: ClassIdParamRequest) => Promise<GetClassResponse | null>;
    createClass: (data: CreateClassRequest) => Promise<CreateResponse>;
    updateClass: (query: ClassIdParamRequest, data: UpdateClassRequest) => Promise<{ message: string }>;
    deleteClass: (query: ClassIdParamRequest) => Promise<{ message: string }>;
    getAllClassFeatures: () => Promise<GetAllClassFeaturesResponse>;
    getClassFeatureBySlug: (query: ClassFeatureSlugParamRequest) => Promise<GetClassFeatureResponse | null>;
    createClassFeature: (data: CreateClassFeatureRequest) => Promise<CreateResponse>;
    updateClassFeature: (query: ClassFeatureSlugParamRequest, data: UpdateClassFeatureRequest) => Promise<{ message: string }>;
    deleteClassFeature: (query: ClassFeatureSlugParamRequest) => Promise<{ message: string }>;
}

// Class Feature Service interface
export interface ClassFeatureService {
    getAllClassFeatures: () => Promise<GetAllClassFeaturesResponse>;
    getClassFeatureBySlug: (query: ClassFeatureSlugParamRequest) => Promise<GetClassFeatureResponse | null>;
    createClassFeature: (data: CreateClassFeatureRequest) => Promise<CreateResponse>;
    updateClassFeature: (query: ClassFeatureSlugParamRequest, data: UpdateClassFeatureRequest) => Promise<{ message: string }>;
    deleteClassFeature: (query: ClassFeatureSlugParamRequest) => Promise<{ message: string }>;
} 
