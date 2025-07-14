import { ColumnDefinition, FilterType } from '@/components/generic-list';
import { RouteConfig } from '@/types';

import { ItemDetail } from './ItemDetail';
import { ItemEdit } from './ItemEdit';
import { ItemList } from './ItemList';
import { ITEM_TYPE_SELECT_LIST } from '@shared/static-data';

export const routes: RouteConfig[] = [
    { path: 'items', component: ItemList, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'items/:id', component: ItemDetail, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'items/:id/edit', component: ItemEdit, exact: true, requireAuth: true, requireAdmin: true },
];

export const COLUMN_DEFINITIONS: Record<string, ColumnDefinition> = {
    name: {
        label: 'Item Name',
        sortable: true,
        isRequired: true,
        isDefault: true,
        filterConfig: {
            type: FilterType.TEXT_INPUT,
            props: { placeholder: 'Filter by name...' }
        }
    },
    typeId: {
        label: 'Type',
        sortable: true,
        isDefault: true,
        filterConfig: {
            type: FilterType.SINGLE_SELECT,
            props: {
                options: ITEM_TYPE_SELECT_LIST,
                className: 'w-44'
            }
        }
    },
    cost: {
        label: 'Cost',
        sortable: true,
        isDefault: true,
        filterConfig: {
            type: FilterType.TEXT_INPUT,
            props: { placeholder: 'Filter by cost...' }
        }
    },
    weight: {
        label: 'Weight',
        sortable: true,
        isDefault: true,
        filterConfig: {
            type: FilterType.TEXT_INPUT,
            props: { placeholder: 'Filter by weight...' }
        }
    },
    description: {
        label: 'Description',
        isDefault: true,
    }
}; 
