const raceFilterConfig = {
    race_name: {
        column: 'r.race_name',
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
    size_id: {
        column: 'r.size_id'
    },
    race_speed: {
        column: 'r.race_speed',
    },
    favored_class_id: {
        column: 'r.favored_class_id',
    },
    sort: 'race_name'
};

export { raceFilterConfig };
