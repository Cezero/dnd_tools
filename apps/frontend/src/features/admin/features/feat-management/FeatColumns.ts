import { ColumnDef } from '@tanstack/react-table';
import { FilterType } from '@/components/generic-list/types';
import { FeatInQueryResponse } from '@shared/schema';
import { FEAT_TYPE_SELECT_LIST } from '@shared/static-data';
import { createContainsFilter, createEqualsFilter } from '@/components/generic-list/filterFunctions';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';

export const FEAT_COLUMNS: ColumnDef<FeatInQueryResponse, unknown>[] = [
    {
        accessorKey: 'name',
        header: 'Feat Name',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 150,
        filterFn: createContainsFilter(),
        meta: {
            required: true,
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by name...'
        },
    },
    {
        accessorKey: 'typeId',
        header: 'Feat Type',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 120,
        filterFn: createEqualsFilter(),
        cell: info => {
            const typeId = info.getValue() as number;
            return FEAT_TYPE_SELECT_LIST.find(type => type.value === typeId)?.label || typeId;
        },
        meta: {
            filterType: FilterType.MULTI_SELECT,
            options: FEAT_TYPE_SELECT_LIST,
        },
    },
    {
        accessorKey: 'description',
        header: 'Description',
        enableResizing: true,
        size: 200,
        cell: info => {
            const description = info.getValue() as string;
            return <ProcessMarkdown id={ `feat-${info.row.original.id}-description` } markdown = { description || ''
        } />;
        },
    },
{
    accessorKey: 'benefit',
        header: 'Benefit',
            enableResizing: true,
                size: 200,
                    cell: info => {
                        const benefit = info.getValue() as string;
                        return <ProcessMarkdown id={ `feat-${info.row.original.id}-benefit` } markdown = { benefit || ''
                    } />;
},
    },
{
    accessorKey: 'normalEffect',
        header: 'Normal',
            enableResizing: true,
                size: 150,
                    cell: info => {
                        const normalEffect = info.getValue() as string;
                        return <ProcessMarkdown id={ `feat-${info.row.original.id}-normalEffect` } markdown = { normalEffect || ''
                    } />;
},
    },
{
    accessorKey: 'specialEffect',
        header: 'Special',
            enableResizing: true,
                size: 150,
                    cell: info => {
                        const specialEffect = info.getValue() as string;
                        return <ProcessMarkdown id={ `feat-${info.row.original.id}-specialEffect` } markdown = { specialEffect || ''
                    } />;
},
    },
{
    accessorKey: 'prerequisites',
        header: 'Prerequisite',
            enableResizing: true,
                size: 150,
                    cell: info => {
                        const prerequisites = info.getValue() as string;
                        return <ProcessMarkdown id={ `feat-${info.row.original.id}-prerequisites` } markdown = { prerequisites || ''
                    } />;
},
    },
{
    accessorKey: 'repeatable',
        header: 'Multi-Times',
            enableSorting: true,
                enableColumnFilter: true,
                    enableResizing: true,
                        size: 100,
                            filterFn: createEqualsFilter(),
                                cell: info => {
                                    const repeatable = info.getValue() as boolean;
                                    return repeatable ? 'Yes' : 'No';
                                },
                                    meta: {
        filterType: FilterType.SINGLE_SELECT,
            options: [
                { value: true, label: 'Yes' },
                { value: false, label: 'No' }
            ]
    },
}
]; 
