import { compileMarkdownToHast } from '@/plugins/compileMarkdownToHast';
import { CacheEntry, MarkdownComponentProps } from './types';
import { Root } from 'hast';

const markdownCache = new Map<string, CacheEntry>();

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
                entry!.error = err;
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
