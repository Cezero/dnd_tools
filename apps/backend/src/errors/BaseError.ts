// errors/BaseError.ts
export class BaseError extends Error {
    public status: number;
    public code: string;

    constructor(message: string, status = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
        this.code = code;

        Error.captureStackTrace(this, this.constructor);
    }
}
