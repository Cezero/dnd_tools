import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_COLUMNS, COLUMN_DEFINITIONS, SpellFilterOptions } from '@/features/spells/config/SpellConfig';
import { Api } from '@/services/Api';
import { UseAuth } from '@/auth/AuthProvider';
import { GenericList } from '@/components/GenericList/GenericList';
import { GetClassDisplay } from '@/features/spells/lib/SpellUtil';
import { SpellSchoolNameList, SpellDescriptorNameList, SpellComponentAbbrList } from '@shared/static-data/SpellData';
import { GetSourceDisplay } from '@shared/static-data/SourceData';

export function SpellList(): React.JSX.Element {
    const navigate = useNavigate();
    const { user, isLoading: isAuthLoading } = UseAuth();

    const spellFetchData = useCallback(async (params: URLSearchParams): Promise<{ data: any[]; total: number }> => {
        if (user?.preferred_edition_id !== undefined) {
            params.set('edition_id', user.preferred_edition_id === null ? '0' : user.preferred_edition_id);
        }

        const data = await Api(`/spells?${params.toString()}`);
        const processedResults = data.results.map((spell: any) => ({
            ...spell,
            schools: spell.school_ids ? spell.school_ids.split(',').map(Number) : [],
            descriptors: spell.desc_ids ? spell.desc_ids.split(',').map(Number) : [],
            components: spell.component_ids ? spell.component_ids.split(',').map(Number) : [],
            sources: spell.source_info ? spell.source_info.split(',').map((s: string) => {
                const [book_id, page_number] = s.split(':');
                return { book_id: Number(book_id), page_number: page_number ? Number(page_number) : null };
            }) : [],
            class_id: spell.class_info ? spell.class_info.split(',').map((c: string) => {
                const [class_id, level] = c.split(':');
                return { class_id: Number(class_id), level: Number(level) };
            }) : []
        }));
        return { data: processedResults, total: data.total };
    }, [user]);

    const RenderSpellCell = (spell: any, columnId: string): React.ReactNode => {
        switch (columnId) {
            case 'name':
                return spell.name;
            case 'spell_level':
                return spell.base_level;
            case 'summary':
                return spell.summary;
            case 'school':
                return SpellSchoolNameList(spell.schools);
            case 'descriptors':
                return SpellDescriptorNameList(spell.descriptors);
            case 'casting_time':
                return spell.cast_time;
            case 'range_str':
                return spell.range_str;
            case 'area_desc':
                return spell.area_desc;
            case 'duration':
                return spell.duration_desc;
            case 'effect_desc':
                return spell.effect_desc;
            case 'target_desc':
                return spell.target_desc;
            case 'save_desc':
                return spell.save_desc;
            case 'sr_desc':
                return spell.sr_desc;
            case 'components':
                return SpellComponentAbbrList(spell.components);
            case 'source':
                return GetSourceDisplay(spell.sources, true);
            case 'class_id':
                return GetClassDisplay(spell.class_id, spell.base_level);
            default:
                return null;
        }
    };

    if (isAuthLoading) {
        return <div className="p-4 bg-white text-black dark:bg-[#121212] dark:text-white">Loading...</div>;
    }

    return (
        <GenericList
            storageKey="spellListColumns"
            defaultColumns={DEFAULT_COLUMNS}
            columnDefinitions={COLUMN_DEFINITIONS}
            requiredColumnId="name"
            fetchData={spellFetchData}
            renderCell={RenderSpellCell}
            filterOptions={SpellFilterOptions}
            navigate={navigate}
            detailPagePath="/spells/:id"
            idKey="id"
            itemDesc="spell"
        />
    );
}
