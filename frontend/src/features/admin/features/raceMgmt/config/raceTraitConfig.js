import Input from '@/components/GenericList/Input';

export const COLUMN_DEFINITIONS = {
    trait_slug: {
        label: 'Trait Slug',
        sortable: true,
        filterable: true,
        filterType: 'input',
        filterLabel: 'Search Traits',
        multiColumn: ['trait_slug', 'trait_name', 'trait_description']
    },
    trait_name: {
        label: 'Trait Name',
        sortable: true,
    },
    trait_description: {
        label: 'Trait Description',
        sortable: false
    },
    value_flag: {
        label: 'Has Value',
        sortable: true,
    },
};

export const DEFAULT_COLUMNS = ['trait_slug', 'trait_name', 'value_flag'];

export const raceTraitFilterOptions = () => ({
    trait_slug: { component: Input, props: { type: 'text', placeholder: 'Filter by trait slug...' } }
}); 