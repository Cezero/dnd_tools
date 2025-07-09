import {
    ClassQueryRequest,
    ClassQueryResponse,
    GetAllClassesResponse,
    ClassResponse,
    CreateClassRequest,
    UpdateClassRequest,
    ClassIdParamRequest,
    ClassFeatureQueryRequest,
    ClassFeatureQueryResponse,
    GetAllClassFeaturesResponse,
    GetClassFeatureResponse,
    CreateClassFeatureRequest,
    UpdateClassFeatureRequest,
    ClassFeatureSlugParamRequest
} from '@shared/schema';

// Service interface
export interface ClassService {
    getClasses: (query: ClassQueryRequest) => Promise<ClassQueryResponse>;
    getAllClasses: () => Promise<GetAllClassesResponse>;
    getClassById: (query: ClassIdParamRequest) => Promise<ClassResponse | null>;
    createClass: (data: CreateClassRequest) => Promise<{ id: number; message: string }>;
    updateClass: (query: ClassIdParamRequest, data: UpdateClassRequest) => Promise<{ message: string }>;
    deleteClass: (query: ClassIdParamRequest) => Promise<{ message: string }>;
    getClassFeatures: (query: ClassFeatureQueryRequest) => Promise<ClassFeatureQueryResponse>;
    getAllClassFeatures: () => Promise<GetAllClassFeaturesResponse>;
    getClassFeatureBySlug: (query: ClassFeatureSlugParamRequest) => Promise<GetClassFeatureResponse | null>;
    createClassFeature: (data: CreateClassFeatureRequest) => Promise<{ id: string; message: string }>;
    updateClassFeature: (query: ClassFeatureSlugParamRequest, data: UpdateClassFeatureRequest) => Promise<{ message: string }>;
    deleteClassFeature: (query: ClassFeatureSlugParamRequest) => Promise<{ message: string }>;
}

// Class Feature Service interface
export interface ClassFeatureService {
    getClassFeatures: (query: ClassFeatureQueryRequest) => Promise<ClassFeatureQueryResponse>;
    getAllClassFeatures: () => Promise<GetAllClassFeaturesResponse>;
    getClassFeatureBySlug: (query: ClassFeatureSlugParamRequest) => Promise<GetClassFeatureResponse | null>;
    createClassFeature: (data: CreateClassFeatureRequest) => Promise<{ id: number; message: string }>;
    updateClassFeature: (query: ClassFeatureSlugParamRequest, data: UpdateClassFeatureRequest) => Promise<{ message: string }>;
    deleteClassFeature: (query: ClassFeatureSlugParamRequest) => Promise<{ message: string }>;
} 