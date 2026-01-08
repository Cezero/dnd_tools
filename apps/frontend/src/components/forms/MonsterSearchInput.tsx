import { useMemo } from 'react';

import { CacheQueryHooks } from '@/services/query/CacheQueryHooks';
import type { MonsterCacheEntry } from '@shared/schema';

import { GenericSearchInput, type SearchableItem } from './GenericSearchInput';

type MonsterListItem = SearchableItem;

export interface MonsterSearchInputProps {
    value: number | null;
    onValueChange: (monsterId: number | null) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    componentExtraClassName?: string;
    labelExtraClassName?: string;
    monsterList?: MonsterListItem[]; // Optional prop for pre-loaded monsters
    typeId?: number; // Optional filter by monster type (not supported in cache, but kept for API compatibility)
}

export function MonsterSearchInput({
    value,
    onValueChange,
    label = 'Monster',
    placeholder = 'Search for a monster...',
    disabled = false,
    componentExtraClassName = '',
    labelExtraClassName = '',
    monsterList,
    typeId: _typeId, // Note: typeId filtering not supported in cache endpoint, but kept for API compatibility
}: MonsterSearchInputProps) {
    // Fetch lightweight monster cache if not provided
    const { data: monstersData, isLoading } = CacheQueryHooks.useMonstersCache(
        undefined,
        { enabled: !monsterList } // Only fetch if monsterList not provided
    );

    // Memoize monsters array to prevent infinite loops
    const monsters: MonsterListItem[] = useMemo(() => {
        if (monsterList) {
            return monsterList;
        }
        if (monstersData?.results) {
            return monstersData.results.map((monster: MonsterCacheEntry) => ({
                id: monster.id,
                name: monster.name,
            }));
        }
        return [];
    }, [monsterList, monstersData?.results]);

    // Note: typeId filtering is not supported in the cache endpoint
    // If typeId filtering is needed, consider using MonsterQueryHooks.useGetAllMonsters instead

    return (
        <GenericSearchInput
            value={value}
            onValueChange={onValueChange}
            items={monsters}
            label={label}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            componentExtraClassName={componentExtraClassName}
            labelExtraClassName={labelExtraClassName}
            emptyMessage="No monsters found matching {searchTerm}"
        />
    );
}

