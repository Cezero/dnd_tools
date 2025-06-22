import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LookupService from '@/services/LookupService';
import { DEFAULT_COLUMNS, COLUMN_DEFINITIONS, SPELL_FILTER_OPTIONS } from '@/features/spells/config/spellConfig';
import api from '@/services/api';
import { useAuth } from '@/auth/authProvider';
import GenericList from '@/components/GenericList/GenericList';
import React from 'react';
import { getClassDisplay } from '../lib/spellUtil';
import { SCHOOL_NAME_LIST, DESCRIPTOR_NAME_LIST, COMPONENT_ABBREVIATION_LIST } from 'shared-data/src/spellData';

function SpellList() {
    const navigate = useNavigate();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [lookupsInitialized, setLookupsInitialized] = useState(false);

    useEffect(() => {
        const initializeLookups = async () => {
            try {
                await LookupService.initialize();
                setLookupsInitialized(true);
            } catch (error) {
                console.error('Failed to initialize lookup service:', error);
            }
        };
        initializeLookups();
    }, []);

    const spellFetchData = useCallback(async (params) => {
        if (!lookupsInitialized) {
            return { data: [], total: 0 };
        }

        if (user?.preferred_edition_id !== undefined) {
            params.set('edition_id', user.preferred_edition_id === null ? '0' : user.preferred_edition_id);
        }

        const data = await api(`/spells?${params.toString()}`);
        const processedResults = data.results.map(spell => ({
            ...spell,
            schools: spell.school_ids ? spell.school_ids.split(',').map(Number) : [],
            descriptors: spell.desc_ids ? spell.desc_ids.split(',').map(Number) : [],
            components: spell.component_ids ? spell.component_ids.split(',').map(Number) : [],
            sources: spell.source_info ? spell.source_info.split(',').map(s => {
                const [book_id, page_number] = s.split(':');
                return { book_id: Number(book_id), page_number: page_number ? Number(page_number) : null };
            }) : [],
            class_id: spell.class_info ? spell.class_info.split(',').map(c => {
                const [class_id, level] = c.split(':');
                return { class_id: Number(class_id), level: Number(level) };
            }) : []
        }));
        return { data: processedResults, total: data.total };
    }, [lookupsInitialized, user]);

    const renderSpellCell = (spell, columnId) => {
        switch (columnId) {
            case 'spell_name':
                return spell.spell_name;
            case 'spell_level':
                return spell.spell_level;
            case 'spell_summary':
                return spell.spell_summary;
            case 'school':
                return SCHOOL_NAME_LIST(spell.schools);
            case 'descriptors':
                return DESCRIPTOR_NAME_LIST(spell.descriptors);
            case 'casting_time':
                return spell.cast_time;
            case 'spell_range':
                return spell.spell_range;
            case 'spell_area':
                return spell.spell_area;
            case 'duration':
                return spell.spell_duration;
            case 'spell_effect':
                return spell.spell_effect;
            case 'spell_target':
                return spell.spell_target;
            case 'spell_save':
                return spell.spell_save;
            case 'spell_resistance':
                return spell.spell_resistance;
            case 'components':
                return COMPONENT_ABBREVIATION_LIST(spell.components);
            case 'source':
                return LookupService.getSourceDisplay(spell.sources, true);
            case 'class_id':
                return getClassDisplay(spell.class_id, spell.spell_level);
            default:
                return null;
        }
    };

    if (!lookupsInitialized || isAuthLoading) {
        return <div className="p-4 bg-white text-black dark:bg-[#121212] dark:text-white">Loading...</div>;
    }

    return (
        <GenericList
            storageKey="spellListColumns"
            defaultColumns={DEFAULT_COLUMNS}
            columnDefinitions={COLUMN_DEFINITIONS}
            requiredColumnId="spell_name"
            fetchData={spellFetchData}
            renderCell={renderSpellCell}
            filterOptions={SPELL_FILTER_OPTIONS(lookupsInitialized)}
            navigate={navigate}
            detailPagePath="/spells/:id"
            idKey="spell_id"
            itemDesc="spell"
        />
    );
}

export default SpellList;