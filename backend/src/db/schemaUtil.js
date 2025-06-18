const TABLE_NAME_MAP = {
    'spell': 'spells',
}

export function getTableNameForType(type) {
    if (TABLE_NAME_MAP[type.toLowerCase()]) {
        return TABLE_NAME_MAP[type.toLowerCase()];
    }
    throw new Error(`Unknown type: ${type}`);
}

export default {
    getTableNameForType
}