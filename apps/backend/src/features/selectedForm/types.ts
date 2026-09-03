import {
    CharacterSelectedFormIdParamRequest,
    CreateCharacterSelectedFormRequest,
    UpdateCharacterSelectedFormRequest,
    GetAllCharacterSelectedFormsResponse,
    GetEligibleFormsResponse,
    GetResolvedSelectedFormsResponse,
    CreateResponse,
    UpdateResponse,
} from '@shared/schema';

export interface SelectedFormService {
    getSelectedForms(characterId: number): Promise<GetAllCharacterSelectedFormsResponse>;
    createSelectedForm(data: CreateCharacterSelectedFormRequest): Promise<CreateResponse>;
    updateSelectedForm(data: UpdateCharacterSelectedFormRequest, query: CharacterSelectedFormIdParamRequest): Promise<UpdateResponse>;
    deleteSelectedForm(query: CharacterSelectedFormIdParamRequest): Promise<UpdateResponse>;
    getEligibleForms(characterId: number, featureId: number): Promise<GetEligibleFormsResponse>;
    getResolvedSelectedForms(characterId: number): Promise<GetResolvedSelectedFormsResponse>;
}
