import { useQueryClient } from '@tanstack/react-query';

import { getQueryClient } from '@/lib/formatters/utils/queryClientAccessor';
import type {
    ClassCacheEntry,
    RaceCacheEntry,
    SpellCacheEntry,
    SkillCacheEntry,
    FeatCacheEntry,
    DeityCacheEntry,
    DomainCacheEntry,
    SpellCacheResponse,
    MonsterCacheResponse,
    FeatCacheResponse,
    SkillCacheResponse,
    ClassCacheResponse,
    RaceCacheResponse,
    DomainCacheResponse,
    DeityCacheResponse,
    ItemCacheResponse,
    SourceBookCacheResponse,
} from '@shared/schema';
import type { FilterableComponent } from '@shared/static-data';
import { EditionId } from '@shared/static-data';
import { isVariantId } from '@shared/utils';

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

    const getClassNameById = (id: number): ClassCacheEntry | undefined => {
        const cacheData = queryClient.getQueryData<ClassCacheResponse>(['classes-cache']);
        if (!cacheData?.results) return undefined;
        return cacheData.results.find(item => item.id === id);
    };

    const getRaceNameById = (id: number): RaceCacheEntry | undefined => {
        const cacheData = queryClient.getQueryData<RaceCacheResponse>(['races-cache']);
        if (!cacheData?.results) return undefined;
        return cacheData.results.find(item => item.id === id);
    };

    const getSpellNameById = (id: number): SpellCacheEntry | undefined => {
        const cacheData = queryClient.getQueryData<SpellCacheResponse>(['spells-cache']);
        if (!cacheData?.results) return undefined;
        return cacheData.results.find(item => item.id === id);
    };

    const getSkillNameById = (id: number): SkillCacheEntry | undefined => {
        const cacheData = queryClient.getQueryData<SkillCacheResponse>(['skills-cache']);
        if (!cacheData?.results) return undefined;
        return cacheData.results.find(item => item.id === id);
    };

    const getFeatNameById = (id: number): FeatCacheEntry | undefined => {
        const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
        if (!cacheData?.results) return undefined;
        return cacheData.results.find(item => item.id === id);
    };

    const getProficiencyFeatNameById = (id: number): FeatCacheEntry | undefined => {
        const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
        if (!cacheData?.results) return undefined;
        return cacheData.results.find(item => item.id === id);
    };

    const getDeityNameById = (id: number): DeityCacheEntry | undefined => {
        const cacheData = queryClient.getQueryData<DeityCacheResponse>(['deities-cache']);
        if (!cacheData?.results) return undefined;
        return cacheData.results.find(item => item.id === id);
    };

    const getDomainNameById = (id: number): DomainCacheEntry | undefined => {
        const cacheData = queryClient.getQueryData<DomainCacheResponse>(['domains-cache']);
        if (!cacheData?.results) return undefined;
        return cacheData.results.find(item => item.id === id);
    };

    const getClassSelectFull = (): CacheEntryAsCoreComponent<ClassCacheEntry>[] => {
        const cacheData = queryClient.getQueryData<ClassCacheResponse>(['classes-cache']);
        if (!cacheData?.results) return [];
        return cacheData.results as CacheEntryAsCoreComponent<ClassCacheEntry>[];
    };

    const getClassSelectByEdition = (
        editionId: number,
        includePrestige?: boolean,
        includeVariant?: boolean
    ): CacheEntryAsCoreComponent<ClassCacheEntry>[] => {
        const allClasses = getClassSelectFull();
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
    };

    const getBaseClassSelectByEdition = (editionId: number): CacheEntryAsCoreComponent<ClassCacheEntry>[] => {
        return getClassSelectByEdition(editionId, false, false);
    };

    const getSpellcasterClassSelectByEdition = (editionId: number): CacheEntryAsCoreComponent<ClassCacheEntry>[] => {
        const allClasses = getClassSelectByEdition(editionId);
        return allClasses.filter(classEntry => classEntry.canCastSpells);
    };

    const getRaceSelectFull = (): CacheEntryAsCoreComponent<RaceCacheEntry>[] => {
        const cacheData = queryClient.getQueryData<RaceCacheResponse>(['races-cache']);
        if (!cacheData?.results) return [];
        return cacheData.results as CacheEntryAsCoreComponent<RaceCacheEntry>[];
    };

    const getRaceSelectByEdition = (editionId: number): CacheEntryAsCoreComponent<RaceCacheEntry>[] => {
        const allRaces = getRaceSelectFull();
        return getByEdition(allRaces, editionId);
    };

    const getFeatSelectFull = (): CacheEntryAsCoreComponent<FeatCacheEntry>[] => {
        const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
        if (!cacheData?.results) return [];
        return cacheData.results as CacheEntryAsCoreComponent<FeatCacheEntry>[];
    };

    const getFeatSelectByEdition = (editionId: number): CacheEntryAsCoreComponent<FeatCacheEntry>[] => {
        const allFeats = getFeatSelectFull();
        return getByEdition(allFeats, editionId);
    };

    const getProficiencyFeatSelectFull = (): CacheEntryAsCoreComponent<FeatCacheEntry>[] => {
        const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
        if (!cacheData?.results) return [];
        return cacheData.results as CacheEntryAsCoreComponent<FeatCacheEntry>[];
    };

    const getProficiencyFeatSelectByEdition = (editionId: number): CacheEntryAsCoreComponent<FeatCacheEntry>[] => {
        const allProficiencyFeats = getProficiencyFeatSelectFull();
        return getByEdition(allProficiencyFeats, editionId);
    };

    const getDeitySelectFull = (): CacheEntryAsCoreComponent<DeityCacheEntry>[] => {
        const cacheData = queryClient.getQueryData<DeityCacheResponse>(['deities-cache']);
        if (!cacheData?.results) return [];
        return cacheData.results as CacheEntryAsCoreComponent<DeityCacheEntry>[];
    };

    const getDeitySelectByEdition = (editionId: number): CacheEntryAsCoreComponent<DeityCacheEntry>[] => {
        const allDeities = getDeitySelectFull();
        return getByEdition(allDeities, editionId);
    };

    const getDomainSelectFull = (): CacheEntryAsCoreComponent<DomainCacheEntry>[] => {
        const cacheData = queryClient.getQueryData<DomainCacheResponse>(['domains-cache']);
        if (!cacheData?.results) return [];
        return cacheData.results as CacheEntryAsCoreComponent<DomainCacheEntry>[];
    };

    const getDomainSelectByEdition = (editionId: number): CacheEntryAsCoreComponent<DomainCacheEntry>[] => {
        const allDomains = getDomainSelectFull();
        return getByEdition(allDomains, editionId);
    };

    const getSkillSelectFull = (): CacheEntryAsCoreComponent<SkillCacheEntry>[] => {
        const cacheData = queryClient.getQueryData<SkillCacheResponse>(['skills-cache']);
        if (!cacheData?.results) return [];
        return cacheData.results as CacheEntryAsCoreComponent<SkillCacheEntry>[];
    };

    const getSkillSelectByEdition = (editionId: number): CacheEntryAsCoreComponent<SkillCacheEntry>[] => {
        const allSkills = getSkillSelectFull();
        return getByEdition(allSkills, editionId);
    };

    const getFeatureNameById = async (id: number): Promise<{ name?: string } | undefined> => {
        try {
            const feature = await FeatureQueryHooks.getFeatureById(id);
            return { name: feature?.name };
        } catch {
            return undefined;
        }
    };

    // Generic helper function for name-to-ID lookups from cache
    const getIdByNameFromCache = <T extends { id: number; name: string }>(
        cacheKey: (string | number | object)[],
        name: string
    ): number | undefined => {
        const cacheData = queryClient.getQueryData<{ results: T[] }>(cacheKey);
        if (!cacheData?.results) return undefined;

        const lowerName = name.toLowerCase();
        const entity = cacheData.results.find(e => e.name.toLowerCase() === lowerName);
        return entity?.id;
    };

    // Synchronous lookup functions (from IdMapHelpers)
    const getSpellIdByName = (name: string): number | undefined => {
        return getIdByNameFromCache<{ id: number; name: string }>(['spells-cache'], name);
    };

    const getSpellNameFromCache = (id: number): string | undefined => {
        const cacheData = queryClient.getQueryData<SpellCacheResponse>(['spells-cache']);
        if (!cacheData?.results) return undefined;
        const spell = cacheData.results.find(s => s.id === id);
        return spell?.name;
    };

    const getSpellSummaryFromCache = (id: number): string | null | undefined => {
        const cacheData = queryClient.getQueryData<SpellCacheResponse>(['spells-cache']);
        if (!cacheData?.results) return undefined;
        const spell = cacheData.results.find(s => s.id === id);
        return spell?.summary;
    };

    const getMonsterIdByName = (name: string): number | undefined => {
        return getIdByNameFromCache<{ id: number; name: string }>(['monsters-cache'], name);
    };

    const getMonsterNameFromCache = (id: number): string | undefined => {
        const cacheData = queryClient.getQueryData<MonsterCacheResponse>(['monsters-cache']);
        if (!cacheData?.results) return undefined;
        const monster = cacheData.results.find(m => m.id === id);
        return monster?.name;
    };

    const getFeatIdByName = (name: string): number | undefined => {
        return getIdByNameFromCache<{ id: number; name: string }>(['feats-cache'], name);
    };

    const getFeatNameFromCache = (id: number): string | undefined => {
        const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
        if (!cacheData?.results) return undefined;
        const feat = cacheData.results.find(f => f.id === id);
        return feat?.name;
    };

    const getFeatByIdFromCache = (id: number): { id: number; name: string; useSubId: boolean } | undefined => {
        const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
        if (!cacheData?.results) return undefined;
        const feat = cacheData.results.find(f => f.id === id);
        if (!feat) return undefined;
        return {
            id: feat.id,
            name: feat.name,
            useSubId: feat.useSubId,
        };
    };

    const getSkillIdByName = (name: string): number | undefined => {
        return getIdByNameFromCache<{ id: number; name: string }>(['skills-cache'], name);
    };

    const getSkillNameFromCache = (id: number): string | undefined => {
        const cacheData = queryClient.getQueryData<SkillCacheResponse>(['skills-cache']);
        if (!cacheData?.results) return undefined;
        const skill = cacheData.results.find(s => s.id === id);
        return skill?.name;
    };

    const getClassIdByName = (name: string): number | undefined => {
        return getIdByNameFromCache<{ id: number; name: string }>(['classes-cache'], name);
    };

    const getClassNameFromCache = (id: number): string | undefined => {
        const cacheData = queryClient.getQueryData<ClassCacheResponse>(['classes-cache']);
        if (!cacheData?.results) return undefined;
        const classEntry = cacheData.results.find(c => c.id === id);
        return classEntry?.name;
    };

    const getRaceIdByName = (name: string): number | undefined => {
        return getIdByNameFromCache<{ id: number; name: string }>(['races-cache'], name);
    };

    const getRaceNameFromCache = (id: number): string | undefined => {
        const cacheData = queryClient.getQueryData<RaceCacheResponse>(['races-cache']);
        if (!cacheData?.results) return undefined;
        const race = cacheData.results.find(r => r.id === id);
        return race?.name;
    };

    const getRaceSizeIdFromCache = (id: number): number | undefined => {
        const cacheData = queryClient.getQueryData<RaceCacheResponse>(['races-cache']);
        if (!cacheData?.results) return undefined;
        const race = cacheData.results.find(r => r.id === id);
        return race?.sizeId;
    };

    const getDomainIdByName = (name: string): number | undefined => {
        return getIdByNameFromCache<{ id: number; name: string }>(['domains-cache'], name);
    };

    const getDomainNameFromCache = (id: number): string | undefined => {
        const cacheData = queryClient.getQueryData<DomainCacheResponse>(['domains-cache']);
        if (!cacheData?.results) return undefined;
        const domain = cacheData.results.find(d => d.id === id);
        return domain?.name;
    };

    const getDeityIdByName = (name: string): number | undefined => {
        return getIdByNameFromCache<{ id: number; name: string }>(['deities-cache'], name);
    };

    const getDeityNameFromCache = (id: number): string | undefined => {
        const cacheData = queryClient.getQueryData<DeityCacheResponse>(['deities-cache']);
        if (!cacheData?.results) return undefined;
        const deity = cacheData.results.find(d => d.id === id);
        return deity?.name;
    };

    const getItemIdByName = (name: string): number | undefined => {
        return getIdByNameFromCache<{ id: number; name: string }>(['items-cache'], name);
    };

    const getItemNameFromCache = (id: number): string | undefined => {
        const cacheData = queryClient.getQueryData<ItemCacheResponse>(['items-cache']);
        if (!cacheData?.results) return undefined;
        const item = cacheData.results.find(i => i.id === id);
        return item?.name;
    };

    const getSourceBookIdByName = (name: string): number | undefined => {
        return getIdByNameFromCache<{ id: number; name: string }>(['sourcebooks-cache'], name);
    };

    const getSourceBookNameFromCache = (id: number): string | undefined => {
        const cacheData = queryClient.getQueryData<SourceBookCacheResponse>(['sourcebooks-cache']);
        if (!cacheData?.results) return undefined;
        const sourceBook = cacheData.results.find(sb => sb.id === id);
        return sourceBook?.name;
    };

    const getSourceBookFromCache = (id: number): { id: number; name: string; abbreviation: string } | undefined => {
        const cacheData = queryClient.getQueryData<SourceBookCacheResponse>(['sourcebooks-cache']);
        if (!cacheData?.results) return undefined;
        const sourceBook = cacheData.results.find(sb => sb.id === id);
        if (!sourceBook) return undefined;
        return {
            id: sourceBook.id,
            name: sourceBook.name,
            abbreviation: sourceBook.abbreviation,
        };
    };

    return {
        // Async functions (existing)
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
        getSkillSelectFull,
        getSkillSelectByEdition,
        getFeatureNameById,
        // Synchronous lookup functions (from IdMapHelpers)
        getSpellIdByName,
        getSpellNameFromCache,
        getSpellSummaryFromCache,
        getMonsterIdByName,
        getMonsterNameFromCache,
        getFeatIdByName,
        getFeatNameFromCache,
        getFeatByIdFromCache,
        getSkillIdByName,
        getSkillNameFromCache,
        getClassIdByName,
        getClassNameFromCache,
        getRaceIdByName,
        getRaceNameFromCache,
        getRaceSizeIdFromCache,
        getDomainIdByName,
        getDomainNameFromCache,
        getDeityIdByName,
        getDeityNameFromCache,
        getItemIdByName,
        getItemNameFromCache,
        getSourceBookIdByName,
        getSourceBookNameFromCache,
        getSourceBookFromCache,
    };
};

// Standalone synchronous functions for non-React code (services, utilities, etc.)
// These use getQueryClient() directly instead of the hook
const getStandaloneQueryClient = () => getQueryClient();

// Generic helper function for name-to-ID lookups from cache
function getIdByNameFromCacheStandalone<T extends { id: number; name: string }>(
    cacheKey: (string | number | object)[],
    name: string
): number | undefined {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<{ results: T[] }>(cacheKey);
    if (!cacheData?.results) return undefined;

    const lowerName = name.toLowerCase();
    const entity = cacheData.results.find(e => e.name.toLowerCase() === lowerName);
    return entity?.id;
}

// Standalone synchronous lookup functions (for non-React code)
export const getSpellIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['spells-cache'], name);
};

export const getSpellNameFromCache = (id: number): string | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<SpellCacheResponse>(['spells-cache']);
    if (!cacheData?.results) return undefined;
    const spell = cacheData.results.find(s => s.id === id);
    return spell?.name;
};

export const getSpellSummaryFromCache = (id: number): string | null | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<SpellCacheResponse>(['spells-cache']);
    if (!cacheData?.results) return undefined;
    const spell = cacheData.results.find(s => s.id === id);
    return spell?.summary;
};

export const getMonsterIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['monsters-cache'], name);
};

export const getMonsterNameFromCache = (id: number): string | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<MonsterCacheResponse>(['monsters-cache']);
    if (!cacheData?.results) return undefined;
    const monster = cacheData.results.find(m => m.id === id);
    return monster?.name;
};

export const getFeatIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['feats-cache'], name);
};

export const getFeatNameFromCache = (id: number): string | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
    if (!cacheData?.results) return undefined;
    const feat = cacheData.results.find(f => f.id === id);
    return feat?.name;
};

export const getFeatByIdFromCache = (id: number): { id: number; name: string; useSubId: boolean } | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
    if (!cacheData?.results) return undefined;
    const feat = cacheData.results.find(f => f.id === id);
    if (!feat) return undefined;
    return {
        id: feat.id,
        name: feat.name,
        useSubId: feat.useSubId,
    };
};

export const getSkillIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['skills-cache'], name);
};

export const getSkillNameFromCache = (id: number): string | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<SkillCacheResponse>(['skills-cache']);
    if (!cacheData?.results) return undefined;
    const skill = cacheData.results.find(s => s.id === id);
    return skill?.name;
};

export const getClassIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['classes-cache'], name);
};

export const getClassNameFromCache = (id: number): string | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<ClassCacheResponse>(['classes-cache']);
    if (!cacheData?.results) return undefined;
    const classEntry = cacheData.results.find(c => c.id === id);
    return classEntry?.name;
};

export const getRaceIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['races-cache'], name);
};

export const getRaceNameFromCache = (id: number): string | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<RaceCacheResponse>(['races-cache']);
    if (!cacheData?.results) return undefined;
    const race = cacheData.results.find(r => r.id === id);
    return race?.name;
};

export const getRaceSizeIdFromCache = (id: number): number | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<RaceCacheResponse>(['races-cache']);
    if (!cacheData?.results) return undefined;
    const race = cacheData.results.find(r => r.id === id);
    return race?.sizeId;
};

export const getDomainIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['domains-cache'], name);
};

export const getDomainNameFromCache = (id: number): string | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<DomainCacheResponse>(['domains-cache']);
    if (!cacheData?.results) return undefined;
    const domain = cacheData.results.find(d => d.id === id);
    return domain?.name;
};

// Standalone synchronous function for getting domains by edition
export const getDomainSelectByEdition = (editionId: number): Array<DomainCacheEntry & FilterableComponent> => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<DomainCacheResponse>(['domains-cache']);
    if (!cacheData?.results) return [];
    const allDomains = cacheData.results as Array<DomainCacheEntry & FilterableComponent>;
    return getByEdition(allDomains, editionId);
};

export const getDeityIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['deities-cache'], name);
};

export const getDeityNameFromCache = (id: number): string | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<DeityCacheResponse>(['deities-cache']);
    if (!cacheData?.results) return undefined;
    const deity = cacheData.results.find(d => d.id === id);
    return deity?.name;
};

export const getItemIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['items-cache'], name);
};

export const getItemNameFromCache = (id: number): string | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<ItemCacheResponse>(['items-cache']);
    if (!cacheData?.results) return undefined;
    const item = cacheData.results.find(i => i.id === id);
    return item?.name;
};

export const getSourceBookIdByName = (name: string): number | undefined => {
    return getIdByNameFromCacheStandalone<{ id: number; name: string }>(['sourcebooks-cache'], name);
};

export const getSourceBookNameFromCache = (id: number): string | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<SourceBookCacheResponse>(['sourcebooks-cache']);
    if (!cacheData?.results) return undefined;
    const sourceBook = cacheData.results.find(sb => sb.id === id);
    return sourceBook?.name;
};

export const getSourceBookFromCache = (id: number): { id: number; name: string; abbreviation: string } | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<SourceBookCacheResponse>(['sourcebooks-cache']);
    if (!cacheData?.results) return undefined;
    const sourceBook = cacheData.results.find(sb => sb.id === id);
    if (!sourceBook) return undefined;
    return {
        id: sourceBook.id,
        name: sourceBook.name,
        abbreviation: sourceBook.abbreviation,
    };
};

// Standalone synchronous functions that return full cache entries (for non-React code)
export const getClassNameById = (id: number): ClassCacheEntry | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<ClassCacheResponse>(['classes-cache']);
    if (!cacheData?.results) return undefined;
    return cacheData.results.find(item => item.id === id);
};

export const getRaceNameById = (id: number): RaceCacheEntry | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<RaceCacheResponse>(['races-cache']);
    if (!cacheData?.results) return undefined;
    return cacheData.results.find(item => item.id === id);
};

export const getSpellNameById = (id: number): SpellCacheEntry | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<SpellCacheResponse>(['spells-cache']);
    if (!cacheData?.results) return undefined;
    return cacheData.results.find(item => item.id === id);
};

export const getSkillNameById = (id: number): SkillCacheEntry | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<SkillCacheResponse>(['skills-cache']);
    if (!cacheData?.results) return undefined;
    return cacheData.results.find(item => item.id === id);
};

export const getFeatNameById = (id: number): FeatCacheEntry | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
    if (!cacheData?.results) return undefined;
    return cacheData.results.find(item => item.id === id);
};

export const getProficiencyFeatNameById = (id: number): FeatCacheEntry | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
    if (!cacheData?.results) return undefined;
    return cacheData.results.find(item => item.id === id);
};

export const getDeityNameById = (id: number): DeityCacheEntry | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<DeityCacheResponse>(['deities-cache']);
    if (!cacheData?.results) return undefined;
    return cacheData.results.find(item => item.id === id);
};

export const getDomainNameById = (id: number): DomainCacheEntry | undefined => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<DomainCacheResponse>(['domains-cache']);
    if (!cacheData?.results) return undefined;
    return cacheData.results.find(item => item.id === id);
};

export const getClassSelectFull = (): Array<ClassCacheEntry & FilterableComponent> => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<ClassCacheResponse>(['classes-cache']);
    if (!cacheData?.results) return [];
    return cacheData.results as Array<ClassCacheEntry & FilterableComponent>;
};

export const getClassSelectByEdition = (
    editionId: number,
    includePrestige?: boolean,
    includeVariant?: boolean
): Array<ClassCacheEntry & FilterableComponent> => {
    const allClasses = getClassSelectFull();
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
};

export const getBaseClassSelectByEdition = (editionId: number): Array<ClassCacheEntry & FilterableComponent> => {
    return getClassSelectByEdition(editionId, false, false);
};

export const getSpellcasterClassSelectByEdition = (editionId: number): Array<ClassCacheEntry & FilterableComponent> => {
    const allClasses = getClassSelectByEdition(editionId);
    return allClasses.filter(classEntry => classEntry.canCastSpells);
};

export const getRaceSelectFull = (): Array<RaceCacheEntry & FilterableComponent> => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<RaceCacheResponse>(['races-cache']);
    if (!cacheData?.results) return [];
    return cacheData.results as Array<RaceCacheEntry & FilterableComponent>;
};

export const getRaceSelectByEdition = (editionId: number): Array<RaceCacheEntry & FilterableComponent> => {
    const allRaces = getRaceSelectFull();
    return getByEdition(allRaces, editionId);
};

export const getFeatSelectFull = (): Array<FeatCacheEntry & FilterableComponent> => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
    if (!cacheData?.results) return [];
    return cacheData.results as Array<FeatCacheEntry & FilterableComponent>;
};

export const getFeatSelectByEdition = (editionId: number): Array<FeatCacheEntry & FilterableComponent> => {
    const allFeats = getFeatSelectFull();
    return getByEdition(allFeats, editionId);
};

export const getProficiencyFeatSelectFull = (): Array<FeatCacheEntry & FilterableComponent> => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<FeatCacheResponse>(['feats-cache']);
    if (!cacheData?.results) return [];
    return cacheData.results as Array<FeatCacheEntry & FilterableComponent>;
};

export const getProficiencyFeatSelectByEdition = (editionId: number): Array<FeatCacheEntry & FilterableComponent> => {
    const allProficiencyFeats = getProficiencyFeatSelectFull();
    return getByEdition(allProficiencyFeats, editionId);
};

export const getDeitySelectFull = (): Array<DeityCacheEntry & FilterableComponent> => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<DeityCacheResponse>(['deities-cache']);
    if (!cacheData?.results) return [];
    return cacheData.results as Array<DeityCacheEntry & FilterableComponent>;
};

export const getDeitySelectByEdition = (editionId: number): Array<DeityCacheEntry & FilterableComponent> => {
    const allDeities = getDeitySelectFull();
    return getByEdition(allDeities, editionId);
};

export const getDomainSelectFull = (): Array<DomainCacheEntry & FilterableComponent> => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<DomainCacheResponse>(['domains-cache']);
    if (!cacheData?.results) return [];
    return cacheData.results as Array<DomainCacheEntry & FilterableComponent>;
};

export const getSkillSelectFull = (): Array<SkillCacheEntry & FilterableComponent> => {
    const queryClient = getStandaloneQueryClient();
    const cacheData = queryClient.getQueryData<SkillCacheResponse>(['skills-cache']);
    if (!cacheData?.results) return [];
    return cacheData.results as Array<SkillCacheEntry & FilterableComponent>;
};

export const getSkillSelectByEdition = (editionId: number): Array<SkillCacheEntry & FilterableComponent> => {
    const allSkills = getSkillSelectFull();
    return getByEdition(allSkills, editionId);
};
