import {
    SourceBookCacheResponse,
} from '@shared/schema';

export interface SourceBookService {
    getSourceBookCache: () => Promise<SourceBookCacheResponse>;
}
