import { useQuery } from '@tanstack/react-query';

import { typedApi } from '@/services/Api';
import { createQueryHooks } from '@/services/query/QueryHooksFactory';
import {
    CharacterIdParamSchema,
    CharacterSelectedFormIdParamSchema,
    CreateCharacterSelectedFormSchema,
    CreateResponseSchema,
    EligibleFormsQuerySchema,
    GetAllCharacterSelectedFormsResponseSchema,
    GetEligibleFormsResponseSchema,
    UpdateCharacterSelectedFormSchema,
    UpdateResponseSchema,
} from '@shared/schema';

const getSelectedFormsConfig = createQueryHooks({
    path: '/characters/:id/selected-forms',
    method: 'GET',
    paramsSchema: CharacterIdParamSchema,
    responseSchema: GetAllCharacterSelectedFormsResponseSchema,
    queryKey: 'character-selected-forms',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['character-selected-forms', 'list', typedParams?.pathParams?.id];
    },
});

const createSelectedFormConfig = createQueryHooks({
    path: '/characters/:id/selected-forms',
    method: 'POST',
    requestSchema: CreateCharacterSelectedFormSchema,
    paramsSchema: CharacterIdParamSchema,
    responseSchema: CreateResponseSchema,
    queryKey: 'character-selected-forms',
});

const updateSelectedFormConfig = createQueryHooks({
    path: '/characters/selected-forms/:id',
    method: 'PUT',
    requestSchema: UpdateCharacterSelectedFormSchema,
    paramsSchema: CharacterSelectedFormIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'character-selected-forms',
});

const deleteSelectedFormConfig = createQueryHooks({
    path: '/characters/selected-forms/:id',
    method: 'DELETE',
    paramsSchema: CharacterSelectedFormIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'character-selected-forms',
});

const getEligibleFormsApi = typedApi({
    path: '/characters/:id/eligible-forms',
    method: 'GET',
    requestSchema: EligibleFormsQuerySchema,
    paramsSchema: CharacterIdParamSchema,
    responseSchema: GetEligibleFormsResponseSchema,
});

/**
 * Character selected-form (wild shape) query hooks.
 * Eligible-form lookup uses typedApi because it needs both path and query params.
 */
export const SelectedFormQueryHooks = {
    useGetSelectedForms: getSelectedFormsConfig.useQuery,
    useCreateSelectedForm: createSelectedFormConfig.useMutation,
    useUpdateSelectedForm: updateSelectedFormConfig.useMutation,
    useDeleteSelectedForm: deleteSelectedFormConfig.useMutation,

    /**
     * Eligible wild-shape forms for a character and transformation feature.
     */
    useGetEligibleForms: (characterId: number | null, featureId: number | null) => {
        return useQuery({
            queryKey: ['character-selected-forms', 'eligible', characterId, featureId],
            queryFn: () => getEligibleFormsApi({ featureId: featureId as number }, { id: characterId as number }),
            enabled: characterId !== null && characterId !== 0 && featureId !== null && featureId > 0,
        });
    },

    getSelectedForms: (characterId: number) => getSelectedFormsConfig.fetch({ pathParams: { id: characterId } }),
    getEligibleForms: (characterId: number, featureId: number) => getEligibleFormsApi({ featureId }, { id: characterId }),
    createSelectedForm: (characterId: number, data: unknown) => createSelectedFormConfig.mutate({
        requestData: data,
        pathParams: { id: characterId },
    }),
    updateSelectedForm: (id: number, data: unknown) => updateSelectedFormConfig.mutate({
        requestData: data,
        pathParams: { id },
    }),
    deleteSelectedForm: (id: number) => deleteSelectedFormConfig.mutate({
        pathParams: { id },
    }),
};
