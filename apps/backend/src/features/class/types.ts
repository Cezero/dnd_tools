import type { FeatureWithRelations } from '@shared/schema';
import {
    ClassCacheResponse,
    CreateClassRequest,
    CreateResponse,
    DnDClass,
    GetAllClassesQuery,
    GetAllClassesResponse,
    IdParamRequest,
    UpdateClassRequest,
} from '@shared/schema';

// Service interface
export interface ClassService {
    createClass: (data: CreateClassRequest) => Promise<CreateResponse>;
    deleteClass: (query: IdParamRequest) => Promise<{ message: string }>;
    getClassById: (query: IdParamRequest, characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>) => Promise<DnDClass | null>;
    getClassCache: () => Promise<ClassCacheResponse>;
    getClassFeatures: (query: IdParamRequest, characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>) => Promise<FeatureWithRelations[]>;
    getAllClasses: (query?: GetAllClassesQuery) => Promise<GetAllClassesResponse>;
    updateClass: (query: IdParamRequest, data: UpdateClassRequest) => Promise<{ message: string }>;
}


