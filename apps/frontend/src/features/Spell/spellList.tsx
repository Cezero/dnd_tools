import React, { useCallback } from 'react';
import { DEFAULT_COLUMNS, COLUMN_DEFINITIONS, SpellFilterOptions, SpellQuerySchema } from './spellConfig';
import { Api } from '@/services/Api';
import { UseAuth } from '@/components/auth/AuthProvider';
import { GenericList } from '@/components/GenericList';
import { GetClassDisplay } from './spellUtil';
import { SpellSchoolNameList, SpellDescriptorNameList, SpellComponentAbbrList, GetSourceDisplay } from '@shared/static-data';
import type { Spell } from '@shared/prisma-client/client';
import { z } from 'zod';

// Use Prisma type for spell items with relations
type SpellItem = Spell & {
    levelMapping: Array<{
        classId: number;
        level: number;
        class: {
            name: string;
            abbreviation: string;
        };
    }>;
    schools: Array<{ schoolId: number }>;
    descriptors: Array<{ descriptorId: number }>;
    sources: Array<{ bookId: number; pageNumber: number | null }>;
    components?: number[]; // Components are added by the backend but not in Prisma relations
};

export function SpellList(): React.JSX.Element {
    const { user, isLoading: isAuthLoading } = UseAuth();

    const spellFetchData = useCallback(async (params: URLSearchParams): Promise<{ data: SpellItem[]; total: number }> => {
        if (user?.preferred_edition_id !== undefined) {
            params.set('edition_id', user.preferred_edition_id === null ? '0' : user.preferred_edition_id.toString());
        }

        // Validate query parameters using Zod
        const queryParams = Object.fromEntries(params.entries());
        const validatedParams = SpellQuerySchema.parse(queryParams);

        const data = await Api<{ results: SpellItem[]; total: number }>(`/spells?${params.toString()}`);
        return { data: data.results, total: data.total };
    }, [user]);

    const RenderSpellCell = (spell: SpellItem, columnId: string): React.ReactNode => {
        switch (columnId) {
            case 'name':
                return spell.name;
            case 'baseLevel':
                return spell.baseLevel;
            case 'summary':
                return spell.summary;
            case 'school':
                return SpellSchoolNameList(spell.schools.map(s => s.schoolId));
            case 'descriptors':
                return SpellDescriptorNameList(spell.descriptors.map(d => d.descriptorId));
            case 'castingTime':
                return spell.castingTime;
            case 'range':
                return spell.range;
            case 'area':
                return spell.area;
            case 'duration':
                return spell.duration;
            case 'effect':
                return spell.effect;
            case 'target':
                return spell.target;
            case 'savingThrow':
                return spell.savingThrow;
            case 'spellResistance':
                return spell.spellResistance;
            case 'components':
                return spell.components ? SpellComponentAbbrList(spell.components) : '';
            case 'source':
                return GetSourceDisplay(spell.sources.map(s => ({ book_id: s.bookId, page_number: s.pageNumber })), true);
            case 'class_id':
                return GetClassDisplay(spell.levelMapping.map(lm => ({ class_id: lm.classId, level: lm.level })), spell.baseLevel);
            default:
                return null;
        }
    };

    if (isAuthLoading) {
        return <div className="p-4 bg-white text-black dark:bg-[#121212] dark:text-white">Loading...</div>;
    }

    return (
        <GenericList<SpellItem>
            storageKey="spellListColumns"
            defaultColumns={DEFAULT_COLUMNS}
            columnDefinitions={COLUMN_DEFINITIONS}
            requiredColumnId="name"
            fetchData={spellFetchData}
            renderCell={RenderSpellCell}
            filterOptions={SpellFilterOptions}
            detailPagePath="/spells/:id"
            idKey="id"
            itemDesc="spell"
        />
    );
}
