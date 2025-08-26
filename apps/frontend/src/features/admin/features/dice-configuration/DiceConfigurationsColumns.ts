import { ColumnDef } from '@tanstack/react-table';

import { createContainsFilter, createEqualsFilter } from '@/components/generic-list/filterFunctions';
import { formatColorWithSwatch } from '@/lib/ColorFormatters';
import { DiceBoxAdminConfigInQueryResponse } from '@shared/schema';
import { getDiceThemeById, FilterType, THREE_D_DICE_THEME_SELECT_LIST } from '@shared/static-data';


export const DICE_CONFIGURATION_COLUMNS: ColumnDef<DiceBoxAdminConfigInQueryResponse, unknown>[] = [
    {
        accessorKey: 'name',
        header: 'Configuration Name',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 200,
        filterFn: createContainsFilter(),
        meta: {
            required: true,
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by name...'
        },
    },
    {
        accessorKey: 'isDefault',
        header: 'Default',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 80,
        filterFn: createEqualsFilter(),
        cell: info => {
            const isDefault = info.getValue() as boolean;
            return isDefault ? 'Yes' : 'No';
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: [
                { value: true, label: 'Yes' },
                { value: false, label: 'No' }
            ],
        },
    },
    {
        accessorKey: 'theme',
        header: '3D Theme',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 120,
        filterFn: createEqualsFilter(),
        cell: info => {
            const themeId = info.getValue() as number;
            const theme = getDiceThemeById(themeId);
            return theme?.name || themeId;
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: THREE_D_DICE_THEME_SELECT_LIST,
        },
    },
    {
        accessorKey: 'themeColor',
        header: 'Theme Color',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 120,
        filterFn: createContainsFilter(),
        cell: info => {
            const color = info.getValue() as string;
            return formatColorWithSwatch(color);
        },
        meta: {
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by color...'
        },
    },
    {
        accessorKey: 'scale',
        header: 'Scale',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 80,
        filterFn: createEqualsFilter(),
        meta: {
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by scale...'
        },
    },
]; 
