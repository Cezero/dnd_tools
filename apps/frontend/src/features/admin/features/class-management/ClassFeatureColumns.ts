import { ColumnDef } from '@tanstack/react-table';
import { FilterType } from '@/components/generic-list/types';
import { ClassFeatureSchema } from '@shared/schema';
import { createContainsFilter } from '@/components/generic-list/filterFunctions';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { z } from 'zod';

export const CLASS_FEATURE_COLUMNS: ColumnDef<z.infer<typeof ClassFeatureSchema>, unknown>[] = [
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
        accessorKey: 'description',
        header: 'Description',
        enableResizing: true,
        size: 300,
        cell: info => {
            const description = info.getValue() as string;
            return <ProcessMarkdown id={ `class-feature-${info.row.original.slug}-description` } markdown = { description || ''
        } />;
        },
    }
]; 
