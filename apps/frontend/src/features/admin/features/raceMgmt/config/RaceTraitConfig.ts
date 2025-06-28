import { TextInput } from '@/components/GenericList/TextInput';

export const COLUMN_DEFINITIONS = {
    slug: {
        label: 'Slug',
        id: 'slug',
        sortable: true,
        filterable: true,
        filterType: 'input',
        filterLabel: 'Search Traits',
        multiColumn: ['slug', 'name', 'desc']
    },
    name: {
        label: 'Name',
        id: 'name',
        sortable: true,
    },
    desc: {
        label: 'Description',
        id: 'desc',
        sortable: false
    },
    has_value: {
        label: 'Has Value',
        sortable: false
    },
};

export const DEFAULT_COLUMNS = ['slug', 'name', 'has_value'];

export const RaceTraitFilterOptions = () => ({
    slug: { component: TextInput, props: { type: 'text', placeholder: 'Search Traits' } }
}); 
