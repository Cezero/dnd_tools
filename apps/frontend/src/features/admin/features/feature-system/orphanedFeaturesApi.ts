import { createQueryHooks } from '@/services/query/QueryHooksFactory';
import {
    DeleteOrphanedFeaturesRequestSchema,
    DeleteOrphanedFeaturesResponseSchema,
    GetOrphanedFeaturesResponseSchema,
} from '@shared/schema';

const getOrphanedFeaturesConfig = createQueryHooks({
    path: '/features/orphaned',
    method: 'GET',
    responseSchema: GetOrphanedFeaturesResponseSchema,
    queryKey: 'orphaned-features',
});

const deleteOrphanedFeaturesConfig = createQueryHooks({
    path: '/features/orphaned',
    method: 'DELETE',
    requestSchema: DeleteOrphanedFeaturesRequestSchema,
    responseSchema: DeleteOrphanedFeaturesResponseSchema,
    queryKey: 'orphaned-features',
});

export const OrphanedFeaturesApi = {
    getOrphanedFeatures: () => getOrphanedFeaturesConfig.fetch(),
    deleteOrphanedFeatures: (featureIds: number[]) =>
        deleteOrphanedFeaturesConfig.mutate({ requestData: { featureIds } }),
};

