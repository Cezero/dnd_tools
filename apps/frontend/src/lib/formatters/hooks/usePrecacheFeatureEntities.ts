import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';

import { FeatureWithRelations } from '@shared/schema';

import { extractEntityIdsForPrecaching } from '../utils/entity-extractor';
import {
    precacheClass,
    precacheDomain,
    precacheFeat,
    precacheFeature,
    precacheRace,
    precacheSkill,
    precacheSpell,
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
 * Stable key of referenced entity IDs so a new features array identity does not
 * restart precaching when the referenced IDs have not changed.
 */
function buildPrecacheKey(features: FeatureWithRelations[] | undefined | null): string {
    if (!features || features.length === 0) {
        return '';
    }
    const ids = extractEntityIdsForPrecaching(features);
    return [
        [...ids.featIds].sort().join(','),
        [...ids.featureIds].sort().join(','),
        [...ids.spellIds].sort().join(','),
        [...ids.domainIds].sort().join(','),
        [...ids.classIds].sort().join(','),
        [...ids.skillIds].sort().join(','),
        [...ids.raceIds].sort().join(','),
    ].join('|');
}

/**
 * React hook that precaches entity names referenced in features so formatters
 * can resolve them. Callers must not block the page on `isPrecaching` — names
 * already live in bulk caches, and a missing ID must not hostage the view.
 *
 * @param features - Features to extract entity IDs from
 * @param options - Optional configuration
 * @returns Precaching state
 */
export function usePrecacheFeatureEntities(
    features: FeatureWithRelations[] | undefined | null,
    options?: UsePrecacheFeatureEntitiesOptions
): UsePrecacheFeatureEntitiesResult {
    const queryClient = useQueryClient();
    const [isPrecaching, setIsPrecaching] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const enabled = options?.enabled !== false;
    const onCompleteRef = useRef(options?.onComplete);
    onCompleteRef.current = options?.onComplete;
    const featuresRef = useRef(features);
    featuresRef.current = features;

    const precacheKey = useMemo(() => buildPrecacheKey(features), [features]);

    useEffect(() => {
        if (!enabled || precacheKey === '') {
            setIsPrecaching(false);
            setIsComplete(true);
            return;
        }

        let cancelled = false;

        const precacheEntities = async () => {
            setIsPrecaching(true);
            setError(null);
            setIsComplete(false);

            try {
                const entityIds = extractEntityIdsForPrecaching(featuresRef.current ?? []);
                const precachePromises: Promise<void>[] = [];

                for (const featId of entityIds.featIds) {
                    precachePromises.push(precacheFeat(queryClient, featId));
                }
                for (const featureId of entityIds.featureIds) {
                    precachePromises.push(precacheFeature(queryClient, featureId));
                }
                for (const spellId of entityIds.spellIds) {
                    precachePromises.push(precacheSpell(queryClient, spellId));
                }
                for (const domainId of entityIds.domainIds) {
                    precachePromises.push(precacheDomain(queryClient, domainId));
                }
                for (const classId of entityIds.classIds) {
                    precachePromises.push(precacheClass(queryClient, classId));
                }
                for (const skillId of entityIds.skillIds) {
                    precachePromises.push(precacheSkill(queryClient, skillId));
                }
                for (const raceId of entityIds.raceIds) {
                    precachePromises.push(precacheRace(queryClient, raceId));
                }

                await Promise.all(precachePromises);

                if (cancelled) {
                    return;
                }

                setIsComplete(true);
                setIsPrecaching(false);
                onCompleteRef.current?.();
            } catch (err) {
                if (cancelled) {
                    return;
                }
                const nextError = err instanceof Error ? err : new Error('Unknown error during precaching');
                setError(nextError);
                setIsPrecaching(false);
                setIsComplete(true);
                console.error('Error precaching feature entities:', nextError);
            }
        };

        precacheEntities();

        return () => {
            cancelled = true;
        };
    }, [precacheKey, queryClient, enabled]);

    return {
        isPrecaching,
        isComplete,
        error,
    };
}
