import {
    ClassQueryRequest,
    ClassQueryResponse,
    GetAllClassesResponse,
    ClassResponse,
    CreateClassRequest,
    UpdateClassRequest,
    ClassIdParamRequest
} from '@shared/schema';

// Service interface
export interface ClassService {
    getClasses: (query: ClassQueryRequest) => Promise<ClassQueryResponse>;
    getAllClasses: () => Promise<GetAllClassesResponse>;
    getClassById: (query: ClassIdParamRequest) => Promise<ClassResponse | null>;
    createClass: (data: CreateClassRequest) => Promise<{ id: number; message: string }>;
    updateClass: (query: ClassIdParamRequest, data: UpdateClassRequest) => Promise<{ message: string }>;
    deleteClass: (query: ClassIdParamRequest) => Promise<{ message: string }>;
} 