import { useCallback, useRef, useState } from 'react';

import { SimpleFeatureResolution } from '@/features/character';
import { FeatureProgressionSourceType } from '@/features/character/types';
import type { SkillBonus, PendingChoice } from '@/features/character/types';
import { useCacheFunctions } from '@/services/cache';
import type { FeatureEntity, FeatureProgression, FeatInQueryResponse } from '@shared/schema';
import { EntityAppliesToType } from '@shared/static-data';

import { ResolvedFeatureService } from './ResolvedFeatureService';

/**
 * React hook for managing FeatureProgression pool and triggering resolution
 */
export function useFeatureProgressionPool(allFeats?: FeatInQueryResponse[], characterLevel?: number, classLevels?: Map<number, number>) {
    const [isResolving, setIsResolving] = useState(false);
    const [resolutionError, setResolutionError] = useState<string | null>(null);
    const [resolvedData, setResolvedData] = useState<{
        progressions: FeatureProgression[];
        classSkills: Array<{ skillId: number; skillSubId: number | null }>;
        skillBonuses: SkillBonus[];
        pendingChoices: PendingChoice[];
        grantedFeats: FeatureEntity[];
        availableFeats: number;
        availableFighterBonusFeats: number;
    }>({
        progressions: [],
        classSkills: [],
        skillBonuses: [],
        pendingChoices: [],
        grantedFeats: [],
        availableFeats: 0,
        availableFighterBonusFeats: 0
    });

    const resolutionRef = useRef(new SimpleFeatureResolution());
    const { getClassNameById, getDomainSelectByEdition } = useCacheFunctions();

    /**
     * Trigger feature resolution on the current pool
     */
    const triggerResolution = useCallback(async (existingChoices?: Array<{ progressionId: number; featureEntityId: number }>) => {
        console.log('Triggering feature resolution...');
        setIsResolving(true);
        setResolutionError(null);

        try {
            const allProgressions = resolutionRef.current.getAllProgressions();
            const stats = resolutionRef.current.getStats();

            console.log('Pool stats:', stats);
            console.log('All progressions:', allProgressions);

            // Extract resolved data from progressions using static methods
            const classSkills = ResolvedFeatureService.getClassSkills(allProgressions);
            const skillBonuses = ResolvedFeatureService.getSkillBonuses(allProgressions);
            const grantedFeats = ResolvedFeatureService.getGrantedFeats(allProgressions);

            // Extract pending choices using the cache service
            const cacheService = {
                getClassNameById,
                getDomainSelectByEdition
            };
            const pendingChoices = await ResolvedFeatureService.getPendingChoices(allProgressions, cacheService, undefined, existingChoices, allFeats);

            // Calculate available feats from resolved progressions
            // Default to level 1 if characterLevel is not provided
            const level = characterLevel ?? 1;
            const availableFeats = ResolvedFeatureService.getAvailableFeats(allProgressions, level, classLevels);
            const availableFighterBonusFeats = ResolvedFeatureService.getAvailableFighterBonusFeats(allProgressions);

            console.log('Extracted resolved data:', {
                classSkillsCount: classSkills.length,
                classSkills: classSkills,
                skillBonusesCount: skillBonuses.length,
                skillBonuses: skillBonuses,
                pendingChoicesCount: pendingChoices.length,
                grantedFeatsCount: grantedFeats.length,
                grantedFeats: grantedFeats,
                availableFeats: availableFeats,
                availableFighterBonusFeats: availableFighterBonusFeats
            });

            setResolvedData(prev => ({
                ...prev,
                progressions: allProgressions,
                classSkills,
                skillBonuses,
                pendingChoices,
                grantedFeats,
                availableFeats,
                availableFighterBonusFeats
            }));

            console.log('Feature resolution completed');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Feature resolution failed:', error);
            setResolutionError(errorMessage);
        } finally {
            setIsResolving(false);
        }
    }, [getClassNameById, getDomainSelectByEdition]);

    // Store triggerResolution in a ref to avoid circular dependencies
    const triggerResolutionRef = useRef(triggerResolution);
    triggerResolutionRef.current = triggerResolution;

    /**
     * Add race progressions and trigger resolution
     */
    const addRace = useCallback(async (raceId: number, progressions: FeatureProgression[]) => {
        console.log(`Adding race ${raceId} with ${progressions.length} progressions`);
        resolutionRef.current.addRace(raceId, progressions);
        await triggerResolutionRef.current();
    }, []);

    /**
     * Add class progressions and trigger resolution
     */
    const addClass = useCallback(async (classId: number, progressions: FeatureProgression[]) => {
        console.log(`Adding class ${classId} with ${progressions.length} progressions`);
        resolutionRef.current.addClass(classId, progressions);
        await triggerResolutionRef.current();
    }, []);

    /**
     * Add secondary class progressions and trigger resolution
     */
    const addSecondaryClass = useCallback(async (classId: number, progressions: FeatureProgression[]) => {
        console.log(`Adding secondary class ${classId} with ${progressions.length} progressions`);
        resolutionRef.current.addSecondaryClass(classId, progressions);
        await triggerResolutionRef.current();
    }, []);

    /**
     * Add feat progressions and trigger resolution
     */
    const addFeat = useCallback(async (featId: number, progressions: FeatureProgression[]) => {
        console.log(`Adding feat ${featId} with ${progressions.length} progressions`);
        resolutionRef.current.addFeat(featId, progressions);
        await triggerResolutionRef.current();
    }, []);

    /**
     * Add domain progressions and trigger resolution
     */
    const addDomain = useCallback(async (domainId: number, progressions: FeatureProgression[], choiceIndex?: number) => {
        console.log(`Adding domain ${domainId} with ${progressions.length} progressions`);
        resolutionRef.current.addDomain(domainId, progressions, choiceIndex);
        await triggerResolutionRef.current();
    }, []);

    /**
     * Add spell progressions and trigger resolution
     */
    const addSpell = useCallback(async (spellId: number, progressions: FeatureProgression[], choiceIndex?: number) => {
        console.log(`Adding spell ${spellId} with ${progressions.length} progressions`);
        resolutionRef.current.addSpell(spellId, progressions, choiceIndex);
        await triggerResolutionRef.current();
    }, []);

    /**
     * Add feature progressions and trigger resolution
     */
    const addFeature = useCallback(async (featureId: number, progressions: FeatureProgression[], choiceIndex?: number) => {
        console.log(`Adding feature ${featureId} with ${progressions.length} progressions`);
        resolutionRef.current.addFeature(featureId, progressions, choiceIndex);
        await triggerResolutionRef.current();
    }, []);

    /**
     * Remove all progressions from a source
     */
    const removeSource = useCallback(async (sourceType: FeatureProgressionSourceType, sourceId: number) => {
        console.log(`Removing ${sourceType} ${sourceId}`);
        resolutionRef.current.removeSource(sourceType, sourceId);
        await triggerResolutionRef.current();
    }, []);

    /**
     * Remove all progressions from a source type
     */
    const removeSourceType = useCallback(async (sourceType: FeatureProgressionSourceType) => {
        console.log(`Removing all ${sourceType} progressions`);
        resolutionRef.current.removeSourceType(sourceType);
        await triggerResolutionRef.current();
    }, []);

    /**
     * Handle domain choice selection and add domain features
     */
    const handleDomainChoice = useCallback(async (domainId: number, domainFeatures: FeatureProgression[]) => {
        console.log(`Handling domain choice ${domainId} with ${domainFeatures.length} features`);
        // Add domain features to the pool
        await addDomain(domainId, domainFeatures);
    }, [addDomain]);

    /**
     * Handle choice selection (generic method for all choice types)
     */
    const handleChoiceSelection = useCallback(async (choiceType: number, selectedId: number, features: FeatureProgression[]) => {
        console.log(`Handling choice type ${choiceType} choice ${selectedId} with ${features.length} features`);

        switch (choiceType) {
            case EntityAppliesToType.Domain:
                await handleDomainChoice(selectedId, features);
                break;
            case EntityAppliesToType.Feat:
                await addFeat(selectedId, features);
                break;
            case EntityAppliesToType.Spell:
                await addSpell(selectedId, features);
                break;
            case EntityAppliesToType.Feature:
                await addFeature(selectedId, features);
                break;
            default:
                console.warn(`Unknown choice type: ${choiceType}`);
        }
    }, [handleDomainChoice, addFeat, addSpell, addFeature]);

    /**
     * Clear all progressions
     */
    const clear = useCallback(() => {
        console.log('Clearing all progressions');
        resolutionRef.current.clear();
        setResolutionError(null);
        setResolvedData({
            progressions: [],
            classSkills: [],
            skillBonuses: [],
            pendingChoices: [],
            grantedFeats: [],
            availableFeats: 0,
            availableFighterBonusFeats: 0
        });
    }, []);

    return {
        isResolving,
        resolutionError,
        resolvedData,
        addRace,
        addClass,
        addSecondaryClass,
        addFeat,
        addDomain,
        addSpell,
        addFeature,
        removeSource,
        removeSourceType,
        triggerResolution,
        handleChoiceSelection,
        clear
    };
}
