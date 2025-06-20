import { defaultSchema } from 'rehype-sanitize';

export const sanitizeSchema = {
    ...defaultSchema,
    attributes: {
        ...defaultSchema.attributes,
        a: [
            ...(defaultSchema.attributes.a ? defaultSchema.attributes.a.filter(attr => !Array.isArray(attr) || attr[0] !== 'className') : []),
            ['className', 'entity-link']
        ],
        table: [
            ['className', 'md-table']
        ],
        th: [
            ...(defaultSchema.attributes.th || []),
            ['style', 'key']
        ],
        td: [
            ...(defaultSchema.attributes.td || []),
            'style',
        ]
    },
    allowCssProperties: [
        ...(defaultSchema.allowCssProperties || []),
        'text-align',
    ]
}; 