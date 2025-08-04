import {
    GetAllClassesResponse,
    CreateClassRequest,
    UpdateClassRequest,
    ClassIdParamRequest,
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
}


