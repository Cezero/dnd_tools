import { Root } from 'hast';

import { compileMarkdownToHast } from '@/plugins/compileMarkdownToHast';

import {
    CacheEntry,
    MarkdownComponentProps,
    MarkdownCacheError,
    MarkdownProcessingError
} from './types';

const markdownCache = new Map<string, CacheEntry>();

// Error wrapper utility
function wrapMarkdownError(error: unknown, context: string): MarkdownCacheError {
    if (error instanceof Error) {
        return {
            type: 'markdown_processing',
            message: error.message,
            details: context
        } as MarkdownProcessingError;
    }

    return {
        type: 'markdown_processing',
        message: String(error),
        details: context
    } as MarkdownProcessingError;
}

export function useMarkdownHast(props: MarkdownComponentProps): Root {
    const cacheKey = JSON.stringify({ props });

    let entry = markdownCache.get(cacheKey);
    if (!entry) {
        const promise = compileMarkdownToHast(props);

        const wrappedPromise = promise.then(
            (res) => {
                entry!.status = 'fulfilled';
                entry!.result = res;
            },
            (err) => {
                entry!.status = 'rejected';
                entry!.error = wrapMarkdownError(err, `Markdown compilation for ${props.id}`);
            }
        );
        entry = { status: 'pending', promise: wrappedPromise as unknown as Promise<Root> };
        markdownCache.set(cacheKey, entry);
    }

    switch (entry.status) {
        case 'pending':
            throw entry.promise;
        case 'rejected':
            throw entry.error;
        case 'fulfilled':
            return entry.result;
    }
}
