import type { QueryClient } from '@tanstack/react-query';

import { FeatureQueryHooks } from '../query/FeatureQueryHooks';

/**
 * Feature cache functions
 * Note: Features use FeatureQueryHooks (async API calls), not cache
 */

/**
 * Create feature cache hook functions
 */
export const createFeatureCacheHooks = (_queryClient: QueryClient) => {
    /**
     * Get feature name by ID (async)
     * Uses FeatureQueryHooks to fetch feature data from API
     */
    const getFeatureNameById = async (id: number): Promise<{ name?: string } | undefined> => {
        try {
            const feature = await FeatureQueryHooks.getFeatureById(id);
            return { name: feature?.name };
        } catch {
            return undefined;
        }
    };

    return {
        getFeatureNameById,
    };
};
