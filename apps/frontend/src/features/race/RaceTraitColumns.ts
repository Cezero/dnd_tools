import { ColumnDef } from '@tanstack/react-table';
import { FilterType } from '@/components/generic-list/types';
import { FeatureSchema } from '@shared/schema';
import { createContainsFilter, createEqualsFilter } from '@/components/generic-list/filterFunctions';
import { z } from 'zod';

export const RACE_TRAIT_COLUMNS: ColumnDef<z.infer<typeof FeatureSchema>, unknown>[] = [
    {
        accessorKey: 'id',
        header: 'ID',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 80,
        filterFn: createContainsFilter(),
        meta: {
            required: true,
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by ID...'
        },
    },
    {
        accessorKey: 'slug',
        header: 'Feature Slug',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 200,
        filterFn: createContainsFilter(),
        meta: {
            required: true,
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by slug...'
        },
    },
    {
        accessorKey: 'name',
        header: 'Name',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 200,
        filterFn: createContainsFilter(),
    },
    {
        accessorKey: 'description',
        header: 'Description',
        enableResizing: true,
        size: 300,
        meta: {
            truncate: 200,
            isMarkdown: true,
        },
    }
]; 
