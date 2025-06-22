import Input from '@/components/GenericList/Input';

export const COLUMN_DEFINITIONS = {
    trait_slug: {
        label: 'Trait Slug',
        id: 'trait_slug',
        sortable: true,
        filterable: true,
        filterType: 'input',
        filterLabel: 'Search Traits',
        multiColumn: ['trait_slug', 'trait_name', 'trait_description']
    },
    trait_name: {
        label: 'Trait Name',
        id: 'trait_name',
        sortable: true,
    },
    trait_description: {
        label: 'Trait Description',
        id: 'trait_description',
        sortable: false
    },
    value_flag: {
        label: 'Has Value',
        sortable: false
    },
};

export const DEFAULT_COLUMNS = ['trait_slug', 'trait_name', 'value_flag'];

export const raceTraitFilterOptions = () => ({
    trait_slug: { component: Input, props: { type: 'text', placeholder: 'Search Traits' } }
}); 

/*
    const columnDefinitions = useMemo(() => ({
        trait_slug: {
            id: 'trait_slug',
            label: 'Trait Slug',
            sortable: true,
            filterable: true,
            filterType: 'input',
            filterLabel: 'Search Traits',
            multiColumn: ['trait_slug', 'trait_name', 'trait_description'],
            alwaysVisible: true,
        },
        trait_name: {
            id: 'trait_name',
            label: 'Trait Name',
            sortable: true,
            filterable: false
        },
        trait_description: {
            id: 'trait_description',
            label: 'Description',
            sortable: false,
            filterable: false
        },
    }), []);

    const filterOptions = useMemo(() => ({
        trait_slug: { component: Input, props: { type: 'text', placeholder: 'Filter ...' } },
    }), []);
*/