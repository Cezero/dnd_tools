export const raceTraitFilterConfig = {
    base: {
        table: 'race_traits',
        sort: 'trait_slug',
        groupColumn: 'trait_slug',
    },
    trait_name: {
        column: 'trait_name',
        isSearch: true,
        type: 'string',
        operators: ['LIKE']
    },
    trait_slug: {
        column: 'trait_slug',
        isSearch: true,
        type: 'string',
        operators: ['LIKE']
    },
    trait_description: {
        column: 'trait_description',
        isSearch: true,
        type: 'string',
        operators: ['LIKE']
    },
}; 