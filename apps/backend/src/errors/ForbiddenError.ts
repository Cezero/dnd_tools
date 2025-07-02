import { BaseError } from './BaseError';

export class ForbiddenError extends BaseError {
    constructor(message = 'Forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}
