export const classFilterConfig = {
    base: {
        table: 'classes',
        sort: 'class_name',
        groupColumn: 'class_id',
    },
    class_name: {
        column: 'class_name',
        dataType: 'string'
    },
    class_abbr: {
        column: 'class_abbr'
    },
    edition_id: {
        column: 'edition_id',
        isMultiValued: true,
        logicSupported: true
    },
    is_prestige_class: {
        dataType: 'boolean',
        column: 'is_prestige_class'
    },
    display: {
        dataType: 'boolean',
        column: 'display'
    },
    caster: {
        dataType: 'boolean',
        column: 'caster'
    },
    hit_die: {
        column: 'hit_die',
        isMultiValued: true,
        logicSupported: true
    },
    source: {
        isMultiValued: true,
        logicSupported: true,
        join: {
            table: 'class_source_map',
            mainIdColumn: 'class_id',
            filterColumn: 'book_id',
        },
    },
}; 