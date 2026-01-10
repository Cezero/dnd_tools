import { useQueryClient } from '@tanstack/react-query';

import type {
    ClassCacheEntry,
    RaceCacheEntry,
    SpellCacheEntry,
    SkillCacheEntry,
    FeatCacheEntry,
    DeityCacheEntry,
    DomainCacheEntry
} from '@shared/schema';
import type { FilterableComponent } from '@shared/static-data';
import { EditionId } from '@shared/static-data';
import { isVariantId } from '@shared/utils';

import { CacheQueryHooks } from '../query/CacheQueryHooks';
import { FeatureQueryHooks } from '../query/FeatureQueryHooks';

// Type assertion utility
type CacheEntryAsCoreComponent<T> = T & FilterableComponent;

// Generic edition filter function
const getByEdition = <T extends FilterableComponent>(
    items: T[],
    editionId: number
): T[] => {
    if (editionId === EditionId.DND_3x) {
        return items.filter(item =>
            (item.editionId === EditionId.DND_3E ||
                item.editionId === EditionId.DND_3_5E) && item.isVisible
        );
    }
    return items.filter(item => item.editionId === editionId);
};



// Custom hooks that provide the cache utility functions
export const useCacheFunctions = () => {
    const queryClient = useQueryClient();

    const getClassNameById = async (id: number): Promise<ClassCacheEntry | undefined> => {
        try {
            const classesData = await queryClient.fetchQuery({
                queryKey: ['classes-cache'],
                queryFn: () => CacheQueryHooks.getClassesCacheQueryFn(),
                staleTime: Infinity,
                gcTime: Infinity,
            });
            return classesData.results.find(item => item.id === id);
        } catch {
            return undefined;
        }
    };

    const getRaceNameById = async (id: number): Promise<RaceCacheEntry | undefined> => {
        try {
            const racesData = await queryClient.fetchQuery({
                queryKey: ['races-cache'],
                queryFn: () => CacheQueryHooks.getRacesCacheQueryFn(),
                staleTime: Infinity,
                gcTime: Infinity,
            });
            return racesData.results.find(item => item.id === id);
        } catch {
            return undefined;
        }
    };

    const getSpellNameById = async (id: number): Promise<SpellCacheEntry | undefined> => {
        try {
            const spellsData = await queryClient.fetchQuery({
                queryKey: ['spells-cache'],
                queryFn: () => CacheQueryHooks.getSpellsCacheQueryFn(),
                staleTime: Infinity,
                gcTime: Infinity,
            });
            return spellsData.results.find(item => item.id === id);
        } catch {
            return undefined;
        }
    };

    const getSkillNameById = async (id: number): Promise<SkillCacheEntry | undefined> => {
        try {
            const skillsData = await queryClient.fetchQuery({
                queryKey: ['skills-cache'],
                queryFn: () => CacheQueryHooks.getSkillsCacheQueryFn(),
                staleTime: Infinity,
                gcTime: Infinity,
            });
            return skillsData.results.find(item => item.id === id);
        } catch {
            return undefined;
        }
    };

    const getFeatNameById = async (id: number): Promise<FeatCacheEntry | undefined> => {
        try {
            const featsData = await queryClient.fetchQuery({
                queryKey: ['feats-cache', { queryType: 'all' }],
                queryFn: () => CacheQueryHooks.getFeatsCacheQueryFn({ queryType: 'all' }),
                staleTime: Infinity,
                gcTime: Infinity,
            });
            return featsData.results.find(item => item.id === id);
        } catch {
            return undefined;
        }
    };

    const getProficiencyFeatNameById = async (id: number): Promise<FeatCacheEntry | undefined> => {
        try {
            // Fetch all feats cache (proficiency feats are now identified via FeatureProgressions)
            const allFeatsData = await queryClient.fetchQuery({
                queryKey: ['feats-cache', { queryType: 'all' }],
                queryFn: () => CacheQueryHooks.getFeatsCacheQueryFn({ queryType: 'all' }),
                staleTime: Infinity,
                gcTime: Infinity,
            });
            return allFeatsData.results.find(item => item.id === id);
        } catch {
            return undefined;
        }
    };

    const getDeityNameById = async (id: number): Promise<DeityCacheEntry | undefined> => {
        try {
            const deitiesData = await queryClient.fetchQuery({
                queryKey: ['deities-cache'],
                queryFn: () => CacheQueryHooks.getDeitiesCacheQueryFn(),
                staleTime: Infinity,
                gcTime: Infinity,
            });
            return deitiesData.results.find(item => item.id === id);
        } catch {
            return undefined;
        }
    };

    const getDomainNameById = async (id: number): Promise<DomainCacheEntry | undefined> => {
        try {
            const domainsData = await queryClient.fetchQuery({
                queryKey: ['domains-cache'],
                queryFn: () => CacheQueryHooks.getDomainsCacheQueryFn(),
                staleTime: Infinity,
                gcTime: Infinity,
            });
            return domainsData.results.find(item => item.id === id);
        } catch {
            return undefined;
        }
    };

    const getClassSelectFull = async (): Promise<CacheEntryAsCoreComponent<ClassCacheEntry>[]> => {
        try {
            const classesData = await queryClient.fetchQuery({
                queryKey: ['classes-cache'],
                queryFn: () => CacheQueryHooks.getClassesCacheQueryFn(),
                staleTime: Infinity,
                gcTime: Infinity,
            });
            return (classesData.results || []) as CacheEntryAsCoreComponent<ClassCacheEntry>[];
        } catch {
            return [];
        }
    };

    const getClassSelectByEdition = async (
        editionId: number,
        includePrestige?: boolean,
        includeVariant?: boolean
    ): Promise<CacheEntryAsCoreComponent<ClassCacheEntry>[]> => {
        try {
            const classesData = await queryClient.fetchQuery({
                queryKey: ['classes-cache'],
                queryFn: () => CacheQueryHooks.getClassesCacheQueryFn(),
                staleTime: Infinity,
                gcTime: Infinity,
            });
            const allClasses = (classesData.results || []) as CacheEntryAsCoreComponent<ClassCacheEntry>[];
            const editionFilteredClasses = getByEdition(allClasses, editionId);

            // If no filters specified, return all classes for this edition
            if (includePrestige === undefined && includeVariant === undefined) {
                return editionFilteredClasses;
            }

            return editionFilteredClasses.filter(classEntry => {
                const isPrestige = classEntry.isPrestige;
                const isVariant = isVariantId(classEntry.id);

                // Base classes (not prestige, not variant) are always included
                if (!isPrestige && !isVariant) return true;

                // Prestige classes: include only if includePrestige is true or undefined
                if (isPrestige) {
                    return includePrestige !== false;
                }

                // Variant classes: include only if includeVariant is true or undefined  
                if (isVariant) {
                    return includeVariant !== false;
                }

                return false;
            });
        } catch {
            return [];
        }
    };

    const getBaseClassSelectByEdition = async (editionId: number): Promise<CacheEntryAsCoreComponent<ClassCacheEntry>[]> => {
        return getClassSelectByEdition(editionId, false, false);
    };

    const getSpellcasterClassSelectByEdition = async (editionId: number): Promise<CacheEntryAsCoreComponent<ClassCacheEntry>[]> => {
        const allClasses = await getClassSelectByEdition(editionId);
        return allClasses.filter(classEntry => classEntry.canCastSpells);
    };

    const getRaceSelectFull = async (): Promise<CacheEntryAsCoreComponent<RaceCacheEntry>[]> => {
        try {
            const racesData = await queryClient.fetchQuery({
                queryKey: ['races-cache'],
                queryFn: () => CacheQueryHooks.getRacesCacheQueryFn(),
                staleTime: Infinity,
                gcTime: Infinity,
            });
            return (racesData.results || []) as CacheEntryAsCoreComponent<RaceCacheEntry>[];
        } catch {
            return [];
        }
    };

    const getRaceSelectByEdition = async (editionId: number): Promise<CacheEntryAsCoreComponent<RaceCacheEntry>[]> => {
        const allRaces = await getRaceSelectFull();
        return getByEdition(allRaces, editionId);
    };

    const getFeatSelectFull = async (): Promise<CacheEntryAsCoreComponent<FeatCacheEntry>[]> => {
        try {
            const featsData = await queryClient.fetchQuery({
                queryKey: ['feats-cache', { queryType: 'all' }],
                queryFn: () => CacheQueryHooks.getFeatsCacheQueryFn({ queryType: 'all' }),
                staleTime: Infinity,
                gcTime: Infinity,
            });
            return (featsData.results || []) as CacheEntryAsCoreComponent<FeatCacheEntry>[];
        } catch {
            return [];
        }
    };

    const getFeatSelectByEdition = async (editionId: number): Promise<CacheEntryAsCoreComponent<FeatCacheEntry>[]> => {
        const allFeats = await getFeatSelectFull();
        return getByEdition(allFeats, editionId);
    };

    const getProficiencyFeatSelectFull = async (): Promise<CacheEntryAsCoreComponent<FeatCacheEntry>[]> => {
        try {
            // Fetch all feats cache (proficiency feats are now identified via FeatureProgressions)
            const allFeatsData = await queryClient.fetchQuery({
                queryKey: ['feats-cache', { queryType: 'all' }],
                queryFn: () => CacheQueryHooks.getFeatsCacheQueryFn({ queryType: 'all' }),
                staleTime: Infinity,
                gcTime: Infinity,
            });
            return (allFeatsData.results || []) as CacheEntryAsCoreComponent<FeatCacheEntry>[];
        } catch {
            return [];
        }
    };

    const getProficiencyFeatSelectByEdition = async (editionId: number): Promise<CacheEntryAsCoreComponent<FeatCacheEntry>[]> => {
        const allProficiencyFeats = await getProficiencyFeatSelectFull();
        return getByEdition(allProficiencyFeats, editionId);
    };

    const getDeitySelectFull = async (): Promise<CacheEntryAsCoreComponent<DeityCacheEntry>[]> => {
        try {
            const deitiesData = await queryClient.fetchQuery({
                queryKey: ['deities-cache'],
                queryFn: () => CacheQueryHooks.getDeitiesCacheQueryFn(),
                staleTime: Infinity,
                gcTime: Infinity,
            });
            return (deitiesData.results || []) as CacheEntryAsCoreComponent<DeityCacheEntry>[];
        } catch {
            return [];
        }
    };

    const getDeitySelectByEdition = async (editionId: number): Promise<CacheEntryAsCoreComponent<DeityCacheEntry>[]> => {
        const allDeities = await getDeitySelectFull();
        return getByEdition(allDeities, editionId);
    };

    const getDomainSelectFull = async (): Promise<CacheEntryAsCoreComponent<DomainCacheEntry>[]> => {
        try {
            const domainsData = await queryClient.fetchQuery({
                queryKey: ['domains-cache'],
                queryFn: () => CacheQueryHooks.getDomainsCacheQueryFn(),
                staleTime: Infinity,
                gcTime: Infinity,
            });
            return (domainsData.results || []) as CacheEntryAsCoreComponent<DomainCacheEntry>[];
        } catch {
            return [];
        }
    };

    const getDomainSelectByEdition = async (editionId: number): Promise<CacheEntryAsCoreComponent<DomainCacheEntry>[]> => {
        const allDomains = await getDomainSelectFull();
        return getByEdition(allDomains, editionId);
    };

    const getFeatureNameById = async (id: number): Promise<{ name?: string } | undefined> => {
        try {
            const feature = await FeatureQueryHooks.getFeatureById(id);
            return { name: feature?.name };
        } catch {
            return undefined;
        }
    };

    return {
        getClassNameById,
        getRaceNameById,
        getSpellNameById,
        getSkillNameById,
        getFeatNameById,
        getFeatSelectFull,
        getFeatSelectByEdition,
        getProficiencyFeatSelectFull,
        getProficiencyFeatSelectByEdition,
        getProficiencyFeatNameById,
        getDeityNameById,
        getDeitySelectFull,
        getDeitySelectByEdition,
        getDomainNameById,
        getClassSelectFull,
        getClassSelectByEdition,
        getBaseClassSelectByEdition,
        getSpellcasterClassSelectByEdition,
        getRaceSelectFull,
        getRaceSelectByEdition,
        getDomainSelectFull,
        getDomainSelectByEdition,
        getFeatureNameById,
    };
};

