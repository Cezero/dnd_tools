import {
    GetAllClassesResponse,
    GetAllClassesQuery,
    CreateClassRequest,
    UpdateClassRequest,
    ClassIdParamRequest,
    DnDClass,
    CreateResponse,
    ClassCacheResponse
} from '@shared/schema';

// Service interface
export interface ClassService {
    getAllClasses: (query?: GetAllClassesQuery) => Promise<GetAllClassesResponse>;
    getClassById: (query: ClassIdParamRequest, characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>) => Promise<DnDClass | null>;
    createClass: (data: CreateClassRequest) => Promise<CreateResponse>;
    updateClass: (query: ClassIdParamRequest, data: UpdateClassRequest) => Promise<{ message: string }>;
    deleteClass: (query: ClassIdParamRequest) => Promise<{ message: string }>;
    getClassCache: () => Promise<ClassCacheResponse>;
}


