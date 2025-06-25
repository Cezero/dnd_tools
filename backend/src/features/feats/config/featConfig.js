export const featFilterConfig = {
    base: {
        table: 'feats',
        sort: 'feat_name',
        groupColumn: 'feat_id',
    },
    feat_name: {
        column: 'feat_name',
        isSearch: true,
        operator: 'LIKE',
        dataType: 'string'
    },
    feat_type: {
        column: 'feat_type',
    },
    feat_description: {
        column: 'feat_description',
        isSearch: true,
        operator: 'LIKE',
        dataType: 'string'
    },
    feat_benefit: {
        column: 'feat_benefit',
        isSearch: true,
        operator: 'LIKE',
        dataType: 'string'
    },
    feat_normal: {
        column: 'feat_normal',
        isSearch: true,
        operator: 'LIKE',
        dataType: 'string'
    },
    feat_special: {
        column: 'feat_special',
        isSearch: true,
        operator: 'LIKE',
        dataType: 'string'
    },
    feat_prereq: {
        column: 'feat_prereq',
        isSearch: true,
        operator: 'LIKE',
        dataType: 'string'
    },
    feat_multi_times: {
        column: 'feat_multi_times',
        dataType: 'boolean'
    }
}; 