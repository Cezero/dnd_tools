import {
    GetAllClassesResponse,
    GetAllClassesQuery,
    CreateClassRequest,
    UpdateClassRequest,
    ClassIdParamRequest,
    DnDClass,
    CreateResponse
} from '@shared/schema';

// Service interface
export interface ClassService {
    getAllClasses: (query?: GetAllClassesQuery) => Promise<GetAllClassesResponse>;
    getClassById: (query: ClassIdParamRequest) => Promise<DnDClass | null>;
    createClass: (data: CreateClassRequest) => Promise<CreateResponse>;
    updateClass: (query: ClassIdParamRequest, data: UpdateClassRequest) => Promise<{ message: string }>;
    deleteClass: (query: ClassIdParamRequest) => Promise<{ message: string }>;
}


