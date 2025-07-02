import { FeatList } from '@/features/admin/features/feat-management/FeatList';
import { FeatDetail } from '@/features/admin/features/feat-management/FeatDetail';
import { FeatEdit } from '@/features/admin/features/feat-management/FeatEdit';
import { FeatBenefitDetail } from '@/features/admin/features/feat-management/FeatBenefitDetail';
import { FeatPrereqDetail } from '@/features/admin/features/feat-management/FeatPrereqDetail';
import { FeatPrereqEdit } from '@/features/admin/features/feat-management/FeatPrereqEdit';
import { TextInput, MultiSelect, BooleanInput } from '@/components/generic-list';
import { FEAT_TYPE_LIST } from '@shared/static-data';
import { RouteConfig } from '@/types';

export const routes: RouteConfig[] = [
    { path: 'feats', component: FeatList, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'feats/:id', component: FeatDetail, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'feats/:id/edit', component: FeatEdit, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'feats/benefits/:id', component: FeatBenefitDetail, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'feats/prereqs/:id', component: FeatPrereqDetail, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'feats/prereqs/:id/edit', component: FeatPrereqEdit, exact: true, requireAuth: true, requireAdmin: true },
];

interface FeatColumnDefinition {
    label: string;
    type: 'text' | 'boolean';
    sortable: boolean;
    filterable: boolean;
    filterType?: 'input' | 'multi-select' | 'boolean';
    textArea?: boolean;
}

interface FeatFilterOption {
    component: React.ComponentType<any>;
    props?: Record<string, any>;
}

export const COLUMN_DEFINITIONS: Record<string, FeatColumnDefinition> = {
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

export const FeatFilterOptions = (): Record<string, FeatFilterOption> => ({
    feat_name: { component: TextInput, props: { type: 'text', placeholder: 'Filter by name...' } },
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

export const DEFAULT_COLUMNS: string[] = ['feat_name', 'feat_type', 'feat_multi_times']; 