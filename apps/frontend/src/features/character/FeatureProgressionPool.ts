import type { FeatureProgressionSourceType, PooledFeatureProgression } from '@/features/character/types';
import type { FeatureProgression } from '@shared/schema';

/**
 * Manages a pool of FeatureProgressions from all sources
 */
export class FeatureProgressionPool {
    private progressions: PooledFeatureProgression[] = [];

    /**
     * Add FeatureProgressions from a source
     */
    addFromSource(
        sourceType: FeatureProgressionSourceType,
        sourceId: number,
        progressions: FeatureProgression[],
        choiceIndex?: number
    ): void {
        console.log(`Adding ${progressions.length} progressions from ${sourceType} ${sourceId}`);

        // Remove existing progressions from this source
        this.removeBySource(sourceType, sourceId);

        // Add new progressions with source tracking
        const pooledProgressions: PooledFeatureProgression[] = progressions.map(progression => ({
            ...progression,
            poolSourceType: sourceType,
            sourceId,
            choiceIndex
        }));

        this.progressions.push(...pooledProgressions);
        console.log(`Pool now contains ${this.progressions.length} progressions`);
    }

    /**
     * Remove all progressions from a specific source
     */
    removeBySource(sourceType: FeatureProgressionSourceType, sourceId: number): void {
        const beforeCount = this.progressions.length;
        this.progressions = this.progressions.filter(
            p => !(p.poolSourceType === sourceType && p.sourceId === sourceId)
        );
        const removedCount = beforeCount - this.progressions.length;
        console.log(`Removed ${removedCount} progressions from ${sourceType} ${sourceId}`);
    }

    /**
     * Remove all progressions from a source type (e.g., all race progressions)
     */
    removeBySourceType(sourceType: FeatureProgressionSourceType): void {
        const beforeCount = this.progressions.length;
        this.progressions = this.progressions.filter(p => p.poolSourceType !== sourceType);
        const removedCount = beforeCount - this.progressions.length;
        console.log(`Removed ${removedCount} progressions from all ${sourceType} sources`);
    }

    /**
     * Get all progressions in the pool
     */
    getAllProgressions(): FeatureProgression[] {
        return this.progressions.map(p => {
            const { poolSourceType, sourceId, choiceIndex, ...progression } = p;
            return progression;
        });
    }

    /**
     * Get progressions by source
     */
    getBySource(sourceType: FeatureProgressionSourceType, sourceId: number): FeatureProgression[] {
        return this.progressions
            .filter(p => p.poolSourceType === sourceType && p.sourceId === sourceId)
            .map(p => {
                const { poolSourceType, sourceId, choiceIndex, ...progression } = p;
                return progression;
            });
    }

    /**
     * Get progressions by source type
     */
    getBySourceType(sourceType: FeatureProgressionSourceType): FeatureProgression[] {
        return this.progressions
            .filter(p => p.poolSourceType === sourceType)
            .map(p => {
                const { poolSourceType, sourceId, choiceIndex, ...progression } = p;
                return progression;
            });
    }

    /**
     * Get pool statistics
     */
    getStats(): { total: number; bySource: Record<string, number> } {
        const bySource: Record<string, number> = {};
        this.progressions.forEach(p => {
            const key = `${p.poolSourceType}:${p.sourceId}`;
            bySource[key] = (bySource[key] || 0) + 1;
        });

        return {
            total: this.progressions.length,
            bySource
        };
    }

    /**
     * Clear all progressions
     */
    clear(): void {
        this.progressions = [];
        console.log('Cleared all progressions from pool');
    }
}
