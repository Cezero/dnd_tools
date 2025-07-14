import { ColumnDef } from '@tanstack/react-table';
import { FilterType } from '@/components/generic-list/types';
import { RaceTraitSchema } from '@shared/schema';
import { createContainsFilter, createEqualsFilter } from '@/components/generic-list/filterFunctions';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { z } from 'zod';

export const RACE_TRAIT_COLUMNS: ColumnDef<z.infer<typeof RaceTraitSchema>, unknown>[] = [
    {
        accessorKey: 'slug',
        header: 'Slug',
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
        accessorKey: 'description',
        header: 'Description',
        enableResizing: true,
        size: 300,
        cell: info => {
            const description = info.getValue() as string;
            return <ProcessMarkdown id={ `race-trait-${info.row.original.slug}-description` } markdown = { description || ''
        } />;
        },
    },
{
    accessorKey: 'hasValue',
        header: 'Has Value',
            enableSorting: true,
                enableColumnFilter: true,
                    enableResizing: true,
                        size: 100,
                            filterFn: createEqualsFilter(),
                                cell: info => {
                                    const hasValue = info.getValue() as boolean;
                                    return hasValue ? 'Yes' : 'No';
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
