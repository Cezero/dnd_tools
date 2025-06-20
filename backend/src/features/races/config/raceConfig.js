const raceFilterConfig = {
    name: {
        column: 'r.race_name',
        isSearch: true,
        operator: 'LIKE',
        data_type: 'string',
    },
    race_abbr: {
        column: 'r.race_abbr',
        isSearch: true,
        operator: 'LIKE',
        data_type: 'string',
    },
    edition_id: {
        column: 'r.edition_id',
        isMultiValued: true,
        logicSupported: true,
    },
    display: {
        column: 'r.display',
        data_type: 'boolean',
    },
    sort: 'race_name'
};

export { raceFilterConfig };
