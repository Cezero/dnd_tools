const raceFilterConfig = {
    base: {
        table: 'races',
        sort: 'race_name',
        groupColumn: 'race_id',
    },
    race_name: {
        column: 'race_name',
        isSearch: true,
        operator: 'LIKE',
        dataType: 'string',
    },
    edition_id: {
        column: 'edition_id',
        multiValue: {
            column: 'edition_id',
            alias: 'edition_ids'
        },
        logicSupported: true,
    },
    display: {
        column: 'display',
        dataType: 'boolean',
    },
    size_id: {
        column: 'size_id'
    },
    race_speed: {
        column: 'race_speed',
    },
    favored_class_id: {
        column: 'favored_class_id',
    },
};

export { raceFilterConfig };
