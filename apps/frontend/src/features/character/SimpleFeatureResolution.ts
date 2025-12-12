import { FeatureProgressionPool } from '@/features/character';
import { FeatureProgressionSourceType } from '@/features/character/types';
import type { FeatureProgression } from '@shared/schema';

/**
 * Simplified feature resolution that works with a FeatureProgression pool
 */
export class SimpleFeatureResolution {
    private pool: FeatureProgressionPool;

    constructor() {
        this.pool = new FeatureProgressionPool();
    }

    /**
     * Add race progressions to the pool
     */
    addRace(raceId: number, progressions: FeatureProgression[]): void {
        this.pool.addFromSource(FeatureProgressionSourceType.Race, raceId, progressions);
    }

    /**
     * Add class progressions to the pool
     */
    addClass(classId: number, progressions: FeatureProgression[]): void {
        this.pool.addFromSource(FeatureProgressionSourceType.Class, classId, progressions);
    }

    /**
     * Add secondary class progressions to the pool
     */
    addSecondaryClass(classId: number, progressions: FeatureProgression[]): void {
        this.pool.addFromSource(FeatureProgressionSourceType.SecondaryClass, classId, progressions);
    }

    /**
     * Add feat progressions to the pool
     */
    addFeat(featId: number, progressions: FeatureProgression[]): void {
        this.pool.addFromSource(FeatureProgressionSourceType.Feat, featId, progressions);
    }

    /**
     * Add domain progressions to the pool
     */
    addDomain(domainId: number, progressions: FeatureProgression[], choiceIndex?: number): void {
        this.pool.addFromSource(FeatureProgressionSourceType.Domain, domainId, progressions, choiceIndex);
    }

    /**
     * Add spell progressions to the pool
     */
    addSpell(spellId: number, progressions: FeatureProgression[], choiceIndex?: number): void {
        this.pool.addFromSource(FeatureProgressionSourceType.Spell, spellId, progressions, choiceIndex);
    }

    /**
     * Add feature progressions to the pool
     */
    addFeature(featureId: number, progressions: FeatureProgression[], choiceIndex?: number): void {
        this.pool.addFromSource(FeatureProgressionSourceType.Feature, featureId, progressions, choiceIndex);
    }

    /**
     * Remove all progressions from a source
     */
    removeSource(sourceType: FeatureProgressionSourceType, sourceId: number): void {
        this.pool.removeBySource(sourceType, sourceId);
    }

    /**
     * Remove all progressions from a source type
     */
    removeSourceType(sourceType: FeatureProgressionSourceType): void {
        this.pool.removeBySourceType(sourceType);
    }

    /**
     * Get all progressions for resolution
     */
    getAllProgressions(): FeatureProgression[] {
        return this.pool.getAllProgressions();
    }

    /**
     * Get pool statistics
     */
    getStats() {
        return this.pool.getStats();
    }

    /**
     * Clear all progressions
     */
    clear(): void {
        this.pool.clear();
    }
}
