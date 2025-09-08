import type {
    FeatureProgression
} from '@shared/schema';

import type {
    DisplayContext,
    DisplayResult,
    GroupedLevelItem
} from '../types';

/**
 * Phase 6: Display-Specific Final Grouping
 * Abstract base class for display-specific final grouping logic
 * This method must be overridden by display type specific strategies
 */
export abstract class DisplayResultPhase {
    /**
     * Apply display-specific final grouping logic
     * This method must be overridden by display type specific strategies
     */
    abstract createDisplayResult(
        withinProgressionGrouped: GroupedLevelItem[],
        context?: DisplayContext,
        progression?: FeatureProgression
    ): DisplayResult;
}
