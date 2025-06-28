import { SpellList } from '@/features/spells/components/SpellList';
import { SpellDetail } from '@/features/spells/components/SpellDetail';
import { SpellEdit } from '@/features/spells/components/SpellEdit';
import { TextInput } from '@/components/GenericList/TextInput';
import { MultiSelect } from '@/components/GenericList/MultiSelect';
import { SingleSelect } from '@/components/GenericList/SingleSelect';
import { SPELL_DESCRIPTOR_LIST, SPELL_SCHOOL_LIST, SPELL_COMPONENT_LIST } from '@shared/static-data/SpellData';
import { CLASS_LIST } from '@shared/static-data/ClassData';
import { SOURCE_BOOK_LIST } from '@shared/static-data/SourceData';
import { RouteConfig, NavigationItem } from '@/types';

export const routes: RouteConfig[] = [
    { path: '/spells', component: SpellList, exact: true },
    { path: '/spells/:id', component: SpellDetail, exact: true },
    { path: '/spells/:id/edit', component: SpellEdit, exact: true },
];

export const navigation: NavigationItem = {
    label: "Spells",
    path: "/spells",
};

export const DEFAULT_COLUMNS: string[] = ['name', 'spell_level', 'summary'];

interface ColumnDefinition {
    label: string;
    sortable: boolean;
    filterable: boolean;
    filterType?: 'input' | 'select' | 'multi-select';
    paramName?: string;
    dynamicFilter?: boolean;
}

interface FilterOption {
    component: React.ComponentType<any>;
    props: Record<string, any>;
}

export const COLUMN_DEFINITIONS: Record<string, ColumnDefinition> = {
    name: {
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
    summary: {
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
    range_str: {
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
    effect_desc: {
        label: 'Effect',
        sortable: false,
        filterable: false
    },
    target_desc: {
        label: 'Target',
        sortable: false,
        filterable: false
    },
    area_desc: {
        label: 'Area',
        sortable: false,
        filterable: false
    },
    save_desc: {
        label: 'Saving Throw',
        sortable: false,
        filterable: false
    },
    sr_desc: {
        label: 'Spell Resistance',
        sortable: false,
        filterable: false
    }
};

export const SpellFilterOptions: Record<string, FilterOption> = {
    name: {
        component: TextInput,
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
            options: SOURCE_BOOK_LIST.filter(source => source.has_spells).sort((a, b) => {
                if (a.sort_order !== 999 && b.sort_order !== 999) {
                    return a.sort_order - b.sort_order;
                } else if (a.sort_order !== 999) {
                    return -1;
                } else if (b.sort_order !== 999) {
                    return 1;
                } else {
                    return a.book_id - b.book_id;
                }
            }),
            displayKey: 'name',
            valueKey: 'id',
            placeholder: 'Select Sources',
            className: 'w-52'
        }
    },
    class_id: {
        component: MultiSelect,
        props: {
            options: CLASS_LIST.filter(dndClass => dndClass.can_cast && dndClass.display),
            displayKey: 'name',
            valueKey: 'id',
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
};
