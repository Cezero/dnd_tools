import { TextInput, SingleSelect } from '@/components/generic-list';
import { FEAT_BENEFIT_TYPE_LIST } from '@shared/static-data';

export const COLUMN_DEFINITIONS = {
    benefit_id: {
        label: 'Benefit ID',
        id: 'benefit_id',
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
    benefit_type: {
        label: 'Benefit Type',
        id: 'benefit_type',
        sortable: true,
        filterable: true,
        filterType: 'single-select',
    },
    benefit_type_id: {
        label: 'Benefit Type ID',
        id: 'benefit_type_id',
        sortable: true,
        filterable: true,
        filterType: 'input',
    },
    benefit_amount: {
        label: 'Benefit Amount',
        id: 'benefit_amount',
        sortable: true,
        filterable: true,
        filterType: 'input',
    },
};

export const DEFAULT_COLUMNS = ['benefit_id', 'feat_id', 'benefit_type', 'benefit_amount'];

export const FeatBenefitFilterOptions = () => ({
    benefit_id: { component: TextInput, props: { type: 'text', placeholder: 'Search by ID...' } },
    feat_id: { component: TextInput, props: { type: 'text', placeholder: 'Search by Feat ID...' } },
    benefit_type: {
        component: SingleSelect,
        props: {
            options: FEAT_BENEFIT_TYPE_LIST,
            displayKey: 'name',
            valueKey: 'id',
            className: 'w-32'
        }
    }
}); 