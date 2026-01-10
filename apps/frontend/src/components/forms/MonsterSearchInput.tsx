import { useMemo } from 'react';

import { CacheQueryHooks } from '@/services/query/CacheQueryHooks';
import type { MonsterCacheEntry } from '@shared/schema';

import { GenericSearchInput, type SearchableItem } from './GenericSearchInput';

type MonsterListItem = SearchableItem & {
    typeIds?: number[]; // Array of monster type IDs
};

export interface MonsterSearchInputProps {
    value: number | null;
    onValueChange: (monsterId: number | null) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    componentExtraClassName?: string;
    labelExtraClassName?: string;
    monsterList?: MonsterListItem[]; // Optional prop for pre-loaded monsters
    customOptions?: MonsterListItem[]; // Custom options to prepend (e.g., "All" option with id: -1)
    filter?: (monster: MonsterListItem) => boolean; // Filter function for monsters (e.g., by type)
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
    customOptions = [],
    filter,
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
                typeIds: monster.typeIds,
            }));
        }
        return [];
    }, [monsterList, monstersData?.results]);

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
            customOptions={customOptions}
            filter={filter}
        />
    );
}

