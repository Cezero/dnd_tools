import { Response, NextFunction } from 'express';

import {
    ValidatedNoInput,
} from '@/util/validated-types';
import {
    SourceBookCacheResponse,
} from '@shared/schema';

import { sourceBookService } from './sourcebookService';

export async function GetSourceBookCache(req: ValidatedNoInput<SourceBookCacheResponse>, res: Response, _next: NextFunction) {
    const sourceBooks = await sourceBookService.getSourceBookCache();
    res.json(sourceBooks);
}
