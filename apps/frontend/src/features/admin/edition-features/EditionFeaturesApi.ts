import { FeatureQueryHooks } from '@/components/feature-system/FeatureQueryHooks';
import { FeatureWithRelations } from '@shared/schema';

/**
 * API service for edition-specific features
 */
export class EditionFeaturesApi {
    /**
     * Get feature features for a specific edition
     */
    static async getEditionFeatures(editionId: number): Promise<FeatureWithRelations[]> {
        return await FeatureQueryHooks.getFeaturesByEditionId(editionId);
    }
}
