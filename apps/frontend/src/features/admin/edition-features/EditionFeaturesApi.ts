import { FeatureQueryHooks } from '@/services/query/FeatureQueryHooks';
import { FeatureProgression } from '@shared/schema';

/**
 * API service for edition-specific features
 */
export class EditionFeaturesApi {
    /**
     * Get feature progressions for a specific edition
     */
    static async getEditionFeatureProgressions(editionId: number): Promise<FeatureProgression[]> {
        return await FeatureQueryHooks.getFeatureProgressionsByEditionId(editionId);
    }
}
