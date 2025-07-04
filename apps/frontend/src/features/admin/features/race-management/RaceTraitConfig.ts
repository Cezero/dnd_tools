import { ColumnDefinition } from '@/components/generic-list';

export const COLUMN_DEFINITIONS: Record<string, ColumnDefinition> = {
    slug: {
        label: 'Slug',
        sortable: true,
        isRequired: true,
        isDefault: true,
        filterConfig: {
            type: 'text-input',
            props: { placeholder: 'Filter by name...' }
        },
        multiColumn: ['slug', 'name', 'description']
    },
    name: {
        label: 'Name',
        sortable: true,
        isDefault: true,
    },
    description: {
        label: 'Description',
        sortable: false,
    },
    hasValue: {
        label: 'Has Value',
        sortable: true,
        isDefault: true,
        filterConfig: {
            type: 'boolean'
        }
    },
};
