import { Root } from 'hast';

interface MarkdownProcessingOptions {
    extraRehypePlugins?: unknown[];
    enableTables?: boolean;
}

type CacheEntry = {
    status: 'pending' | 'fulfilled' | 'rejected';
    promise: Promise<Root>;
    result?: Root;
    error?: any;
};

interface MarkdownComponentProps {
    markdown: string;
    id: string;
    userVars?: Record<string, unknown>;
    tableClass?: string;
}

export type { MarkdownProcessingOptions, CacheEntry, MarkdownComponentProps };
