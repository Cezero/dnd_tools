import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationState {
    errors: Record<string, string>;
    isValid: boolean;
    hasErrors: boolean;
}

export interface UseZodValidationOptions {
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    debounceMs?: number;
}

export function useZodValidation<T extends z.ZodSchema>(
    schema: T,
    options: UseZodValidationOptions = {}
) {
    const { validateOnChange = true, validateOnBlur = true, debounceMs = 300 } = options;

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isValidating, setIsValidating] = useState(false);

    // Memoize field schemas for performance
    const fieldSchemas = useMemo(() => {
        if (schema instanceof z.ZodObject) {
            return schema.shape;
        }
        return {};
    }, [schema]);

    // Validate a single field
    const validateField = useCallback((fieldName: string, value: unknown): boolean => {
        const fieldSchema = fieldSchemas[fieldName];
        if (!fieldSchema) return true;

        try {
            fieldSchema.parse(value);
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const message = error.errors[0]?.message || 'Invalid value';
                setErrors(prev => ({ ...prev, [fieldName]: message }));
            }
            return false;
        }
    }, [fieldSchemas]);

    // Validate entire form
    const validateForm = useCallback((data: unknown): boolean => {
        setIsValidating(true);
        try {
            schema.parse(data);
            setErrors({});
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Record<string, string> = {};
                error.errors.forEach(err => {
                    const field = err.path.join('.');
                    newErrors[field] = err.message;
                });
                setErrors(newErrors);
            }
            return false;
        } finally {
            setIsValidating(false);
        }
    }, [schema]);

    // Clear all errors
    const clearErrors = useCallback(() => {
        setErrors({});
    }, []);

    // Clear specific field error
    const clearFieldError = useCallback((fieldName: string) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    }, []);

    // Get validation state
    const validationState: ValidationState = useMemo(() => ({
        errors,
        isValid: Object.keys(errors).length === 0,
        hasErrors: Object.keys(errors).length > 0
    }), [errors]);

    // Create field validation handlers
    const createFieldHandlers = useCallback((fieldName: string) => {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const handleChange = (value: unknown) => {
            if (validateOnChange) {
                if (timeoutId) clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    validateField(fieldName, value);
                }, debounceMs);
            }
        };

        const handleBlur = (value: unknown) => {
            if (timeoutId) clearTimeout(timeoutId);
            if (validateOnBlur) {
                validateField(fieldName, value);
            }
        };

        return {
            onChange: handleChange,
            onBlur: handleBlur,
            error: errors[fieldName] || '',
            hasError: !!errors[fieldName]
        };
    }, [validateOnChange, validateOnBlur, debounceMs, validateField, errors]);

    return {
        // State
        errors,
        isValidating,
        validationState,

        // Methods
        validateField,
        validateForm,
        clearErrors,
        clearFieldError,
        createFieldHandlers,

        // Utility
        hasError: (fieldName: string) => !!errors[fieldName],
        getError: (fieldName: string) => errors[fieldName] || '',
        setError: (fieldName: string, message: string) => {
            setErrors(prev => ({ ...prev, [fieldName]: message }));
        }
    };
} 