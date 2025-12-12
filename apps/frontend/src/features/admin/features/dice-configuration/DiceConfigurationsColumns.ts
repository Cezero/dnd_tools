import { ColumnDef } from '@tanstack/react-table';

import { createContainsFilter, createEqualsFilter } from '@/components/generic-list/filterFunctions';
import { formatColorWithSwatch } from '@/lib/ColorFormattersUtils';
import { DiceBoxAdminConfig } from '@shared/schema';
import { FilterType, THREE_D_DICE_THEME_LIST, BooleanFilter, BOOLEAN_FILTER_LIST } from '@shared/static-data';
import { getDiceThemeById } from '@shared/utils';

export const DICE_CONFIGURATION_COLUMNS: ColumnDef<DiceBoxAdminConfig, unknown>[] = [
    {
        accessorKey: 'name',
        header: 'Configuration Name',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 200,
        filterFn: createContainsFilter<DiceBoxAdminConfig>(),
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
        filterFn: (row, columnId, filterValue) => {
            const isDefault = row.getValue(columnId) as boolean;
            if (filterValue === BooleanFilter.TRUE) {
                return isDefault;
            } else if (filterValue === BooleanFilter.FALSE) {
                return !isDefault;
            }
            return true;
        },
        cell: info => {
            const isDefault = info.getValue() as boolean;
            return isDefault ? 'Yes' : 'No';
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: BOOLEAN_FILTER_LIST,
        },
    },
    {
        accessorKey: 'theme',
        header: '3D Theme',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 120,
        filterFn: createEqualsFilter<DiceBoxAdminConfig>(),
        cell: info => {
            const themeId = info.getValue() as number;
            const theme = getDiceThemeById(themeId);
            return theme?.name || themeId;
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: THREE_D_DICE_THEME_LIST,
        },
    },
    {
        accessorKey: 'themeColor',
        header: 'Theme Color',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 120,
        filterFn: createContainsFilter<DiceBoxAdminConfig>(),
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
        filterFn: createEqualsFilter<DiceBoxAdminConfig>(),
        meta: {
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by scale...'
        },
    },
]; 
