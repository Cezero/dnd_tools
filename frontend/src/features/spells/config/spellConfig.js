import SpellList from '@/features/spells/components/spellList';
import SpellDetail from '@/features/spells/components/spellDetail';
import SpellEdit from '@/features/spells/components/spellEdit';
import Input from '@/components/GenericList/Input';
import MultiSelect from '@/components/GenericList/MultiSelect';
import SingleSelect from '@/components/GenericList/SingleSelect';
import LookupService from '@/services/LookupService';
import { SPELL_DESCRIPTOR_LIST, SPELL_SCHOOL_LIST, SPELL_COMPONENT_LIST } from 'shared-data/src/spellData';

export const routes = [
    { path: '/spells', component: SpellList, exact: true },
    { path: '/spells/:id', component: SpellDetail, exact: true },
    { path: '/spells/:id/edit', component: SpellEdit, exact: true },
];

export const navigation = {
    label: "Spells",
    path: "/spells",
};

export const DEFAULT_COLUMNS = ['spell_name', 'spell_level', 'spell_summary'];

export const COLUMN_DEFINITIONS = {
    spell_name: {
        label: 'Name',
        sortable: true,
        filterable: true,
        filterType: 'input',
        paramName: 'name',
        dynamicFilter: true
    },
    spell_level: {
        label: 'Level',
        sortable: true,
        filterable: true,
        filterType: 'select'
    },
    spell_summary: {
        label: 'Summary',
        sortable: false,
        filterable: false
    },
    school: {
        label: 'School',
        sortable: true,
        filterable: true,
        filterType: 'multi-select'
    },
    descriptors: {
        label: 'Descriptors',
        sortable: false,
        filterable: true,
        filterType: 'multi-select'
    },
    casting_time: {
        label: 'Casting Time',
        sortable: false,
        filterable: false
    },
    spell_range: {
        label: 'Range',
        sortable: false,
        filterable: false
    },
    duration: {
        label: 'Duration',
        sortable: false,
        filterable: false
    },
    components: {
        label: 'Components',
        sortable: false,
        filterable: true,
        filterType: 'multi-select'
    },
    source: {
        label: 'Sources',
        sortable: false,
        filterable: true,
        filterType: 'multi-select'
    },
    class_id: {
        label: 'Classes',
        sortable: false,
        filterable: true,
        filterType: 'multi-select'
    },
    spell_effect: {
        label: 'Effect',
        sortable: false,
        filterable: false
    },
    spell_target: {
        label: 'Target',
        sortable: false,
        filterable: false
    },
    spell_area: {
        label: 'Area',
        sortable: false,
        filterable: false
    },
    spell_save: {
        label: 'Saving Throw',
        sortable: false,
        filterable: false
    },
    spell_resistance: {
        label: 'Spell Resistance',
        sortable: false,
        filterable: false
    }
};

export const SPELL_FILTER_OPTIONS = (lookupsInitialized) => ({
    spell_name: {
        component: Input,
        props: {
            type: 'text',
            placeholder: 'Filter by name...',
        }
    },
    spell_level: {
        component: SingleSelect,
        props: {
            options: [...Array(10).keys()].map(level => ({ id: level, name: level.toString() })),
            displayKey: 'name',
            valueKey: 'id',
            placeholder: 'All Levels',
            className: 'w-32',
        }
    },
    school: {
        component: MultiSelect,
        props: {
            options: SPELL_SCHOOL_LIST,
            displayKey: 'name',
            valueKey: 'id',
            placeholder: 'Select Schools',
            className: 'w-48'
        }
    },
    descriptors: {
        component: MultiSelect,
        props: {
            options: SPELL_DESCRIPTOR_LIST,
            displayKey: 'name',
            valueKey: 'id',
            placeholder: 'Select Descriptors',
            className: 'w-48'
        }
    },
    source: {
        component: MultiSelect,
        props: {
            options: lookupsInitialized ? LookupService.getAll('sources').filter(source => source.has_spells).sort((a, b) => {
                if (a.sort_order !== 999 && b.sort_order !== 999) {
                    return a.sort_order - b.sort_order;
                } else if (a.sort_order !== 999) {
                    return -1;
                } else if (b.sort_order !== 999) {
                    return 1;
                } else {
                    return a.book_id - b.book_id;
                }
            }) : [],
            displayKey: 'title',
            valueKey: 'book_id',
            placeholder: 'Select Sources',
            className: 'w-52'
        }
    },
    class_id: {
        component: MultiSelect,
        props: {
            options: lookupsInitialized ? LookupService.getAll('classes').filter(dndClass => dndClass.caster && dndClass.display) : [],
            displayKey: 'class_name',
            valueKey: 'class_id',
            placeholder: 'Select Classes',
            className: 'w-52'
        }
    },
    components: {
        component: MultiSelect,
        props: {
            options: SPELL_COMPONENT_LIST,
            displayKey: 'name',
            valueKey: 'id',
            placeholder: 'Select Components',
            className: 'w-48'
        }
    },
});
