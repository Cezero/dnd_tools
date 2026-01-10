import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { FeatureProgression } from '@shared/schema';

import { extractEntityIdsForPrecaching } from '../utils/entity-extractor';
import {
    precacheFeat,
    precacheFeature,
    precacheSpell,
    precacheDomain,
    precacheClass,
    precacheSkill,
    precacheRace,
} from '../utils/precache-helpers';

interface UsePrecacheFeatureEntitiesOptions {
    enabled?: boolean;
    onComplete?: () => void;
}

interface UsePrecacheFeatureEntitiesResult {
    isPrecaching: boolean;
    isComplete: boolean;
    error: Error | null;
}

/**
 * React hook that precaches all entity names (feats, features, spells, domains, classes, skills, races)
 * referenced in feature progressions. This ensures names are available in cache when formatters need them.
 *
 * @param progressions - Feature progressions to extract entity IDs from
 * @param options - Optional configuration
 * @returns Object with precaching state
 *
 * @example
 * ```tsx
 * const { isPrecaching, isComplete } = usePrecacheFeatureEntities(cls.features);
 * if (isPrecaching) return <div>Loading...</div>;
 * // Format progressions after precaching completes
 * ```
 */
export function usePrecacheFeatureEntities(
    progressions: FeatureProgression[] | undefined | null,
    options?: UsePrecacheFeatureEntitiesOptions
): UsePrecacheFeatureEntitiesResult {
    const queryClient = useQueryClient();
    const [isPrecaching, setIsPrecaching] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const enabled = options?.enabled !== false;

    useEffect(() => {
        if (!enabled || !progressions || progressions.length === 0) {
            setIsPrecaching(false);
            setIsComplete(true);
            return;
        }

        const precacheEntities = async () => {
            setIsPrecaching(true);
            setError(null);
            setIsComplete(false);

            try {
                // Extract all entity IDs that need precaching
                const entityIds = extractEntityIdsForPrecaching(progressions);

                // Create promises for all precaching operations
                const precachePromises: Promise<void>[] = [];

                // Precache feats
                for (const featId of entityIds.featIds) {
                    precachePromises.push(precacheFeat(queryClient, featId));
                }

                // Precache features
                for (const featureId of entityIds.featureIds) {
                    precachePromises.push(precacheFeature(queryClient, featureId));
                }

                // Precache spells
                for (const spellId of entityIds.spellIds) {
                    precachePromises.push(precacheSpell(queryClient, spellId));
                }

                // Precache domains
                for (const domainId of entityIds.domainIds) {
                    precachePromises.push(precacheDomain(queryClient, domainId));
                }

                // Precache classes
                for (const classId of entityIds.classIds) {
                    precachePromises.push(precacheClass(queryClient, classId));
                }

                // Precache skills
                for (const skillId of entityIds.skillIds) {
                    precachePromises.push(precacheSkill(queryClient, skillId));
                }

                // Precache races
                for (const raceId of entityIds.raceIds) {
                    precachePromises.push(precacheRace(queryClient, raceId));
                }

                // Wait for all precaching to complete
                await Promise.all(precachePromises);

                setIsComplete(true);
                setIsPrecaching(false);

                // Call onComplete callback if provided
                if (options?.onComplete) {
                    options.onComplete();
                }
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Unknown error during precaching');
                setError(error);
                setIsPrecaching(false);
                setIsComplete(true); // Mark as complete even on error to allow rendering
                console.error('Error precaching feature entities:', error);
            }
        };

        precacheEntities();
    }, [progressions, queryClient, enabled, options]);

    return {
        isPrecaching,
        isComplete,
        error,
    };
}
