import { createContext, useContext } from 'react';
import { z } from 'zod';

import { useZodValidation } from '@/hooks/useZodValidation';

// Form context type
export interface FormContextType {
    formData: Record<string, unknown>;
    setFormData: (data: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => void;
    validation: ReturnType<typeof useZodValidation>;
}

// Create context
export const FormContext = createContext<FormContextType | null>(null);

// Hook to use form context
export function useFormContext() {
    const context = useContext(FormContext);
    if (!context) {
        throw new Error('ValidatedInput must be used within a ValidatedForm');
    }
    return context;
}

// Hook for creating validated form fields
export function useValidatedForm<T extends z.ZodSchema>(
    schema: T,
    formData: Record<string, unknown>,
    setFormData: (data: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => void,
    options?: Parameters<typeof useZodValidation>[1]
) {
    const validation = useZodValidation(schema, options);

    return {
        formData,
        setFormData,
        validation,
    };
}
