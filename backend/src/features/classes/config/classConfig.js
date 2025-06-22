export const classFilterConfig = {
    class_name: { type: 'text', queryKey: 'class_name', column: 'class_name' },
    class_abbr: { type: 'text', queryKey: 'class_abbr', column: 'class_abbr' },
    edition_id: { type: 'number', queryKey: 'edition_id', column: 'edition_id' },
    is_prestige_class: { type: 'boolean', queryKey: 'is_prestige_class', column: 'is_prestige_class' },
    display: { type: 'boolean', queryKey: 'display', column: 'display' },
    caster: { type: 'boolean', queryKey: 'caster', column: 'caster' },
    hit_die: { type: 'number', queryKey: 'hit_die', column: 'hit_die' },
    'sort': 'class_name'
}; 