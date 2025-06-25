import FeatList from '@/features/admin/features/featMgmt/components/FeatList';
import FeatDetail from '@/features/admin/features/featMgmt/components/FeatDetail';
import FeatEdit from '@/features/admin/features/featMgmt/components/FeatEdit';
import FeatBenefitDetail from '@/features/admin/features/featMgmt/components/FeatBenefitDetail';
import FeatBenefitEdit from '@/features/admin/features/featMgmt/components/FeatBenefitEdit';
import FeatPrereqDetail from '@/features/admin/features/featMgmt/components/FeatPrereqDetail';
import FeatPrereqEdit from '@/features/admin/features/featMgmt/components/FeatPrereqEdit';
import Input from '@/components/GenericList/Input';
import MultiSelect from '@/components/GenericList/MultiSelect';
import BooleanInput from '@/components/GenericList/BooleanInput';
import { FEAT_TYPE_LIST } from 'shared-data/src/featData';

export const routes = [
    { path: 'feats', component: FeatList, exact: true },
    { path: 'feats/:id', component: FeatDetail, exact: true },
    { path: 'feats/:id/edit', component: FeatEdit, exact: true },
    { path: 'feats/benefits/:id', component: FeatBenefitDetail, exact: true },
    { path: 'feats/benefits/:id/edit', component: FeatBenefitEdit, exact: true },
    { path: 'feats/prereqs/:id', component: FeatPrereqDetail, exact: true },
    { path: 'feats/prereqs/:id/edit', component: FeatPrereqEdit, exact: true },
];

export const COLUMN_DEFINITIONS = {
    feat_name: {
        label: 'Feat Name',
        type: 'text',
        sortable: true,
        filterable: true,
        filterType: 'input'
    },
    feat_type: {
        label: 'Feat Type',
        type: 'text',
        sortable: true,
        filterable: true,
        filterType: 'multi-select'
    },
    feat_description: {
        label: 'Description',
        type: 'text',
        sortable: false,
        filterable: false,
        textArea: true
    },
    feat_benefit: {
        label: 'Benefit',
        type: 'text',
        sortable: false,
        filterable: false,
        textArea: true
    },
    feat_normal: {
        label: 'Normal',
        type: 'text',
        sortable: false,
        filterable: false,
        textArea: true
    },
    feat_special: {
        label: 'Special',
        type: 'text',
        sortable: false,
        filterable: false,
        textArea: true
    },
    feat_prereq: {
        label: 'Prerequisite',
        type: 'text',
        sortable: false,
        filterable: false,
        textArea: true
    },
    feat_multi_times: {
        label: 'Multi-Times',
        type: 'boolean',
        sortable: true,
        filterable: true,
        filterType: 'boolean'
    }
};

export const featFilterOptions = () => ({
    feat_name: { component: Input, props: { type: 'text', placeholder: 'Filter by name...' } },
    feat_type: {
        component: MultiSelect,
        props: {
            options: FEAT_TYPE_LIST,
            displayKey: 'name',
            valueKey: 'id',
            className: 'w-32'
        }
    },
    feat_multi_times: { component: BooleanInput },
});

export const DEFAULT_COLUMNS = ['feat_name', 'feat_type', 'feat_multi_times']; 