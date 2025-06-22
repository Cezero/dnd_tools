export const raceTraitFilterConfig = {
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
    'sort': 'trait_slug'
}; 