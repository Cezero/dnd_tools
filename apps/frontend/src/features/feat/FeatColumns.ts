import { ColumnDef } from '@tanstack/react-table';
import React from 'react';

import { createContainsFilter, createArrayIdFilter } from '@/components/generic-list/filterFunctions';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { FeatWithFeatureInfo } from '@shared/schema';
import { FEAT_TYPE_LIST, FilterType, BooleanFilter, BOOLEAN_FILTER_LIST } from '@shared/static-data';

/**
 * Truncates a string at the first newline character.
 * If no newline is found, returns the original string.
 */
function truncateAtFirstNewline(value: string | null | undefined): string {
    if (!value) {
        return '';
    }
    const newlineIndex = value.indexOf('\n');
    if (newlineIndex === -1) {
        return value;
    }
    return value.substring(0, newlineIndex);
}

export const FEAT_COLUMNS: ColumnDef<FeatWithFeatureInfo, unknown>[] = [
    {
        accessorKey: 'name',
        header: 'Feat Name',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 150,
        filterFn: createContainsFilter<FeatWithFeatureInfo>(),
        meta: {
            required: true,
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by name...'
        },
    },
    // Note: typeId is not available in FeatWithFeatureInfo schema
    // If needed, we would need to add it to the schema
    {
        accessorKey: 'description',
        header: 'Description',
        enableResizing: true,
        size: 200,
        // Note: isMarkdown is not in meta because we have a custom cell renderer
        // that handles both truncation at first newline and markdown processing
        cell: ({ row, getValue }) => {
            const description = getValue() as string | null | undefined;
            const truncated = truncateAtFirstNewline(description);
            const featId = row.original.id;
            return (
                <ProcessMarkdown
                    id= {`feat-description-${featId}`
        }
                    markdown={ truncated }
        />
            );
        },
    },
{
    accessorKey: 'summary',
        header: 'Summary',
            enableResizing: true,
                size: 200,
                    meta: {
        isMarkdown: true,
            truncate: 200,
        },
},
    // Note: repeatable is not available in FeatWithFeatureInfo schema
    // If needed, we would need to add it to the schema
]; 
