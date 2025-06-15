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
        filterable: false
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
        filterable: false
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
    }
}; 