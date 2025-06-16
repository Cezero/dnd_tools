import SpellList from '@/features/spells/components/spellList';
import SpellDetail from '@/features/spells/components/spellDetail';
import SpellEdit from '@/features/spells/components/spellEdit';

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
    },
    spell_level: {
        label: 'Level',
        sortable: true,
        filterable: true
    },
    spell_summary: {
        label: 'Summary',
        sortable: false,
        filterable: false
    },
    school: {
        label: 'School',
        sortable: true,
        filterable: true
    },
    descriptors: {
        label: 'Descriptors',
        sortable: false,
        filterable: true
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
        filterable: true
    },
    source: {
        label: 'Sources',
        sortable: false,
        filterable: true
    },
    classId: {
        label: 'Classes',
        sortable: true,
        filterable: true
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
