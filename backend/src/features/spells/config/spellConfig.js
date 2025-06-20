const spellFilterConfig = {
    // Define filter configurations here
    name: {
        column: 'sp.spell_name',
        isSearch: true,
        operator: 'LIKE',
        data_type: 'string',
    },
    classId: {
        column: 'slm.class_id',
        isMultiValued: true,
        logicSupported: true,
        isBaseTableDecider: true,
        applyDirectlyToMainQuery: true,
        fixedConditions: ['slm.display = 1'],
    },
    spell_level: {
        column: 'slm.spell_level',
    },
    school: {
        isMultiValued: true,
        logicSupported: true,
        join: {
            table: 'spell_school_map',
            mainIdColumn: 'sp.spell_id',
            filterColumn: 'school_id',
            fixedConditions: [],
        },
    },
    descriptors: {
        isMultiValued: true,
        logicSupported: true,
        join: {
            table: 'spell_descriptor_map',
            mainIdColumn: 'sp.spell_id',
            filterColumn: 'desc_id',
            fixedConditions: [],
        },
    },
    source: {
        isMultiValued: true,
        logicSupported: true,
        join: {
            table: 'spell_source_map',
            mainIdColumn: 'sp.spell_id',
            filterColumn: 'book_id',
            fixedConditions: ['display = 1'],
        },
    },
    components: {
        isMultiValued: true,
        logicSupported: true,
        join: {
            table: 'spell_component_map',
            mainIdColumn: 'sp.spell_id',
            filterColumn: 'comp_id',
            fixedConditions: [],
        },
    },
    edition_id: {
        column: 'sp.edition_id',
        specialHandling: (value, whereClauses, whereValues) => {
            if (value === 4) { // 4 is the edition_id for 3E, which means combined 3E/3.5E
                whereClauses.push(`sp.edition_id IN (?, ?)`);
                whereValues.push(4, 5);
            } else {
                whereClauses.push(`sp.edition_id = ?`);
                whereValues.push(value);
            }
        },
    },
    // Pagination and sorting
    page: {},
    limit: {},
    sort: {},
    order: {},
};

export { spellFilterConfig }; 