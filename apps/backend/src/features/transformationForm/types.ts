import {
    TransformationFormIdParamRequest,
    FeatureIdForTransformationFormsParamRequest,
    CreateTransformationFormRequest,
    UpdateTransformationFormRequest,
    GetAllTransformationFormsResponse,
    GetTransformationFormResponse,
    GetTransformationFormsByFeatureResponse,
    CreateResponse,
    UpdateResponse,
} from '@shared/schema';

export interface TransformationFormService {
    getAllTransformationForms(): Promise<GetAllTransformationFormsResponse>;
    getTransformationFormById(query: TransformationFormIdParamRequest): Promise<GetTransformationFormResponse | null>;
    getTransformationFormsByFeature(query: FeatureIdForTransformationFormsParamRequest): Promise<GetTransformationFormsByFeatureResponse>;
    createTransformationForm(data: CreateTransformationFormRequest): Promise<CreateResponse>;
    updateTransformationForm(data: UpdateTransformationFormRequest, query: TransformationFormIdParamRequest): Promise<UpdateResponse>;
    deleteTransformationForm(query: TransformationFormIdParamRequest): Promise<UpdateResponse>;
}

