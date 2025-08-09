import React from 'react';

import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';

import { GenericListColumnMeta } from './types';

/**
 * Renders a cell value with optional truncation and markdown processing
 */
export function renderCellValue(
    value: any,
    meta: GenericListColumnMeta | undefined,
    markdownId?: string
): React.ReactNode {
    let displayValue = value || '';

    // Apply truncation if specified
    if (meta?.truncate && typeof displayValue === 'string' && displayValue.length > meta.truncate) {
        displayValue = displayValue.substring(0, meta.truncate) + '...';
    }

    // Apply markdown processing if specified
    if (meta?.isMarkdown && typeof displayValue === 'string') {
        return (
            <ProcessMarkdown
                id={markdownId || 'generic-markdown'}
                markdown={displayValue}
            />
        );
    }

    return displayValue;
}

/**
 * Creates a cell renderer function that handles truncation and markdown
 */
export function createCellRenderer<T>(
    meta: GenericListColumnMeta | undefined,
    getMarkdownId?: (row: T) => string
) {
    return ({ row, getValue }: { row: { original: T }; getValue: () => T }) => {
        const value = getValue();
        const markdownId = getMarkdownId ? getMarkdownId(row.original) : undefined;
        return renderCellValue(value, meta, markdownId);
    };
} 
