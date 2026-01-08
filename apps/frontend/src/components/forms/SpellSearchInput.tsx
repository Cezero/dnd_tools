import { useMemo } from 'react';

import { CacheQueryHooks } from '@/services/query/CacheQueryHooks';
import type { SpellCacheEntry } from '@shared/schema';

import { GenericSearchInput, type SearchableItem } from './GenericSearchInput';

type SpellListItem = SearchableItem & {
    editionId: number;
};

export interface SpellSearchInputProps {
    value: number | null;
    onValueChange: (spellId: number | null) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    componentExtraClassName?: string;
    labelExtraClassName?: string;
    spellList?: SpellListItem[]; // Optional prop for pre-loaded spells
}

export function SpellSearchInput({
    value,
    onValueChange,
    label = 'Spell',
    placeholder = 'Search for a spell...',
    disabled = false,
    componentExtraClassName = '',
    labelExtraClassName = '',
    spellList,
}: SpellSearchInputProps) {
    // Fetch lightweight spell cache if not provided
    const { data: spellsData, isLoading } = CacheQueryHooks.useSpellsCache(
        undefined,
        { enabled: !spellList } // Only fetch if spellList not provided
    );

    // Memoize spells array to prevent infinite loops
    const spells: SpellListItem[] = useMemo(() => {
        if (spellList) {
            return spellList;
        }
        if (spellsData?.results) {
            return spellsData.results.map((spell: SpellCacheEntry) => ({
                id: spell.id,
                name: spell.name,
                editionId: spell.editionId,
            }));
        }
        return [];
    }, [spellList, spellsData?.results]);

    return (
        <GenericSearchInput
            value={value}
            onValueChange={onValueChange}
            items={spells}
            label={label}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            componentExtraClassName={componentExtraClassName}
            labelExtraClassName={labelExtraClassName}
            emptyMessage="No spells found matching {searchTerm}"
        />
    );
}
