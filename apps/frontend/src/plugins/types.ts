import type { QueryClient } from '@tanstack/react-query';
import { Root } from 'hast';

interface MarkdownProcessingOptions {
    extraRehypePlugins?: unknown[];
    enableTables?: boolean;
    queryClient?: QueryClient;
}

// Define specific error types for markdown processing
type MarkdownProcessingError = {
    type: 'markdown_processing';
    message: string;
    details?: string;
};

type TableApiError = {
    type: 'table_api';
    message: string;
    status?: number;
    slug?: string;
};

type TableResolutionError = {
    type: 'table_resolution';
    message: string;
    slug?: string;
    id?: string;
};

type UnifiedProcessorError = {
    type: 'unified_processor';
    message: string;
    plugin?: string;
};

// Union type for all possible errors in markdown cache
type MarkdownCacheError = 
    | MarkdownProcessingError
    | TableApiError
    | TableResolutionError
    | UnifiedProcessorError
    | Error; // Fallback for unknown errors

type CacheEntry = {
    status: 'pending' | 'fulfilled' | 'rejected';
    promise: Promise<Root>;
    result?: Root;
    error?: MarkdownCacheError;
};


interface MarkdownComponentProps {
    markdown: string;
    id: string;
    userVars?: Record<string, unknown>;
    tableClass?: string;
    queryClient?: QueryClient;
}

export type { 
    MarkdownProcessingOptions, 
    CacheEntry, 
    MarkdownComponentProps,
    MarkdownCacheError,
    MarkdownProcessingError,
    TableApiError,
    TableResolutionError,
    UnifiedProcessorError
};
