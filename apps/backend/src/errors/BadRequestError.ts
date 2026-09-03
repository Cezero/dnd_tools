import { BaseError } from './BaseError';

/**
 * HTTP 400 error for invalid client input that passed schema checks but failed business rules.
 */
export class BadRequestError extends BaseError {
    constructor(message = 'Bad Request') {
        super(message, 400, 'BAD_REQUEST');
    }
}
