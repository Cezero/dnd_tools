import { TextInput, SingleSelect } from '@/components/generic-list';
import { FEAT_PREREQUISITE_TYPE_LIST } from '@shared/static-data';

export const COLUMN_DEFINITIONS = {
    prereq_id: {
        label: 'Prerequisite ID',
        id: 'prereq_id',
        sortable: true,
        filterable: true,
        filterType: 'input',
    },
    feat_id: {
        label: 'Feat ID',
        id: 'feat_id',
        sortable: true,
        filterable: true,
        filterType: 'input',
    },
    prereq_type: {
        label: 'Prerequisite Type',
        id: 'prereq_type',
        sortable: true,
        filterable: true,
        filterType: 'single-select',
    },
    prereq_type_id: {
        label: 'Prerequisite Type ID',
        id: 'prereq_type_id',
        sortable: true,
        filterable: true,
        filterType: 'input',
    },
    prereq_amount: {
        label: 'Prerequisite Amount',
        id: 'prereq_amount',
        sortable: true,
        filterable: true,
        filterType: 'input',
    },
};

export const DEFAULT_COLUMNS = ['prereq_id', 'feat_id', 'prereq_type', 'prereq_amount'];

export const FeatPrereqFilterOptions = () => ({
    prereq_id: { component: TextInput, props: { type: 'text', placeholder: 'Search by ID...' } },
    feat_id: { component: TextInput, props: { type: 'text', placeholder: 'Search by Feat ID...' } },
    prereq_type: {
        component: SingleSelect,
        props: {
            options: FEAT_PREREQUISITE_TYPE_LIST,
            displayKey: 'name',
            valueKey: 'id',
            className: 'w-32'
        }
    }
}); 