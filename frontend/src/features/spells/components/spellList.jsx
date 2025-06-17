import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LookupService from '@/services/LookupService';
import { DEFAULT_COLUMNS, COLUMN_DEFINITIONS } from '@/features/spells/config/spellConfig';
import api from '@/services/api';
import { useAuth } from '@/auth/authProvider';
import GenericList from '@/components/GenericList/GenericList';
import Input from '@/components/GenericList/Input';
import Select from '@/components/GenericList/Select';
import MultiSelect from '@/components/GenericList/MultiSelect';
import React from 'react';


function SpellList() {
    const navigate = useNavigate();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [lookupsInitialized, setLookupsInitialized] = useState(false);

    const spellFilterOptions = React.useMemo(() => ({
        spell_name: {
            component: Input,
            props: {
                type: 'text',
                placeholder: 'Filter by name...',
            }
        },
        spell_level: {
            component: Select,
            type: 'select',
            props: {
                children: (
                    <>
                        <option value="">All Levels</option>
                        {[...Array(10).keys()].map(level => (
                            <option key={level} value={level}>
                                {level}
                            </option>
                        ))}
                    </>
                ),
            }
        },
        schools: {
            component: Select,
            type: 'select',
            props: {
                children: (
                    <>
                        <option value="">All Schools</option>
                        {lookupsInitialized ? LookupService.getAll('schools').map(school => (
                            <option key={school.school_id} value={school.school_name}>
                                {school.school_name}
                            </option>
                        )) : null}
                    </>
                ),
            }
        },
        descriptors: {
            component: MultiSelect,
            type: 'multi-select',
            props: {
                options: lookupsInitialized ? LookupService.getAll('descriptors') : [],
                displayKey: 'descriptor',
                valueKey: 'descriptor_id',
                placeholder: 'Select Descriptors',
                className: 'w-48'
            }
        },
        source: {
            component: Select,
            type: 'select',
            props: {
                children: (
                    <>
                        <option value="">All Sources</option>
                        {lookupsInitialized ? LookupService.getAll('sources')
                            .filter(source => source.has_spells)
                            .sort((a, b) => {
                                if (a.sort_order !== 999 && b.sort_order !== 999) {
                                    return a.sort_order - b.sort_order;
                                } else if (a.sort_order !== 999) {
                                    return -1;
                                } else if (b.sort_order !== 999) {
                                    return 1;
                                } else {
                                    return a.book_id - b.book_id;
                                }
                            })
                            .map(source => (
                                <option key={source.book_id} value={source.book_id}>
                                    {source.title}
                                </option>
                            )) : null}
                    </>
                ),
            }
        },
        classId: {
            component: MultiSelect,
            type: 'multi-select',
            props: {
                options: lookupsInitialized ? LookupService.getAll('classes').filter(dndClass => dndClass.caster) : [],
                displayKey: 'class_name',
                valueKey: 'class_id',
                placeholder: 'Select Classes',
                className: 'w-52'
            }
        },
        components: {
            component: Select,
            type: 'select',
            props: {
                children: (
                    <>
                        <option value="">All Components</option>
                        {lookupsInitialized ? LookupService.getAll('components').map(component => (
                            <option key={component.comp_id} value={component.comp_id}>
                                {component.comp_name}
                            </option>
                        )) : null}
                    </>
                ),
            }
        },
    }), [lookupsInitialized]);

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
            descriptors: spell.descriptor_ids ? spell.descriptor_ids.split(',').map(Number) : [],
            components: spell.component_ids ? spell.component_ids.split(',').map(Number) : [],
            sources: spell.source_info ? spell.source_info.split(',').map(s => {
                const [book_id, page_number] = s.split(':');
                return { book_id: Number(book_id), page_number: page_number ? Number(page_number) : null };
            }) : [],
            classId: spell.class_info ? spell.class_info.split(',').map(c => {
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
                return LookupService.getSchoolNames(spell.schools);
            case 'descriptors':
                return LookupService.getDescriptorNames(spell.descriptors);
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
                return LookupService.getComponentAbbreviations(spell.components);
            case 'source':
                return LookupService.getSourceDisplay(spell.sources, true);
            case 'classId':
                return LookupService.getClassDisplay(spell.classId, spell.spell_level);
            default:
                return null;
        }
    };

    if (!lookupsInitialized || isAuthLoading) {
        return <div className="p-4 bg-white text-black dark:bg-[#121212] dark:text-white min-h-screen">Loading...</div>;
    }

    return (
        <GenericList
            storageKey="spellListColumns"
            defaultColumns={DEFAULT_COLUMNS}
            columnDefinitions={COLUMN_DEFINITIONS}
            requiredColumnId="spell_name"
            fetchData={spellFetchData}
            renderCell={renderSpellCell}
            filterOptions={spellFilterOptions}
            navigate={navigate}
            detailPagePath="/spells/:id"
            idKey="spell_id"
        />
    );
}

export default SpellList;