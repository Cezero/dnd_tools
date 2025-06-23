const spellFilterConfig = {
    base: {
        table: 'spells',
        alt: 'spell_level_map',
        joinColumn: 'spell_id',
        groupColumn: 'spell_id',
        fixedConditions: ['display = 1'],
        sort: 'spell_name',
    },
    name: {
        column: 'spell_name',
        isSearch: true,
        operator: 'LIKE',
        dataType: 'string'
    },
    class_id: {
        column: 'class_id',  // slm.class_id
        multiValue: {
            column: 'class_id',
            value: 'spell_level',
            alias: 'class_info',
        },
        logicSupported: true,
        isBaseTableDecider: true,
        useAltTable: true,
        sortLogic: {
            altTable: {
                column: 'class_id'
            }
        },
        applyDirectlyToMainQuery: true,
        fixedConditions: ['display = 1'],  // slm.display
    },
    spell_level: {
        column: 'spell_level', // slm.spell_level
        useAltTable: true,
        sortLogic: {
            altTable: {
                function: 'MIN',
                column: 'spell_level'
            },
            baseTable: {
                column: 'spell_level'
            },
            sortAlias: 'sort_spell_level'
        }
    },
    school: {
        multiValue: {
            column: 'school_id',
            alias: 'school_ids',
        },
        sortLogic: {
            sortAlias: 'school_ids'
        },
        logicSupported: true,
        join: {
            table: 'spell_school_map',
            mainIdColumn: 'spell_id',
            filterColumn: 'school_id',
            fixedConditions: [],
        },
    },
    descriptors: {
        multiValue: {
            column: 'desc_id',
            alias: 'desc_ids',
        },
        logicSupported: true,
        join: {
            table: 'spell_descriptor_map',
            mainIdColumn: 'spell_id',
            filterColumn: 'desc_id',
            fixedConditions: [],
        },
    },
    source: {
        multiValue: {
            column: 'book_id',
            value: 'page_number',
            alias: 'source_info',
        },
        logicSupported: true,
        join: {
            table: 'spell_source_map',
            mainIdColumn: 'spell_id',
            filterColumn: 'book_id',
            fixedConditions: ['display = 1'],
        },
    },
    components: {
        multiValue: {
            column: 'comp_id',
            alias: 'component_ids',
        },
        logicSupported: true,
        join: {
            table: 'spell_component_map',
            mainIdColumn: 'spell_id',
            filterColumn: 'comp_id',
            fixedConditions: [],
        },
    },
    edition_id: {
        column: 'edition_id',
        specialHandling: (value, whereClauses, whereValues) => {
            if (value === 4) { // 4 is the edition_id for 3E, which means combined 3E/3.5E
                whereClauses.push(`edition_id IN (?, ?)`);
                whereValues.push(4, 5);
            } else {
                whereClauses.push(`edition_id = ?`);
                whereValues.push(value);
            }
        },
    },
};

export { spellFilterConfig }; 