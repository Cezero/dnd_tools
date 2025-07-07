import React, { forwardRef, createContext, useContext } from 'react';
import { z } from 'zod';

import { useZodValidation, type ValidationState } from '@/hooks/useZodValidation';

// Form Context
interface FormContextType {
    formData: Record<string, unknown>;
    setFormData: (data: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => void;
    validation: ReturnType<typeof useZodValidation>;
}

const FormContext = createContext<FormContextType | null>(null);

// Hook to use form context
function useFormContext() {
    const context = useContext(FormContext);
    if (!context) {
        throw new Error('ValidatedInput must be used within a ValidatedForm');
    }
    return context;
}

// Validated Input Component
export interface ValidatedInputProps {
    field: string;
    label: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'textarea';
    required?: boolean;
    placeholder?: string;
    componentExtraClassName?: string;
    labelExtraClassName?: string;
    inputExtraClassName?: string;
    disabled?: boolean;
    min?: number;
    max?: number;
    step?: number;
    rows?: number;
}

export const ValidatedInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, ValidatedInputProps>(
    ({
        field,
        label,
        type = 'text',
        required = false,
        componentExtraClassName = '',
        labelExtraClassName = '',
        inputExtraClassName = '',
        disabled = false,
        rows = 4,
        ...props
    }, ref) => {
        const { formData, setFormData, validation } = useFormContext();

        const value = formData[field] ?? '';
        const error = validation.getError(field);
        const hasError = validation.hasError(field);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            let value: string | number = e.target.value;

            // Convert to number for number inputs
            if (type === 'number') {
                const numValue = e.target.value === '' ? '' : Number(e.target.value);
                value = numValue;
            }

            setFormData(prev => ({ ...prev, [field]: value }));
            validation.validateField(field, value);
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            let value: string | number = e.target.value;

            // Convert to number for number inputs
            if (type === 'number') {
                const numValue = e.target.value === '' ? '' : Number(e.target.value);
                value = numValue;
            }

            validation.validateField(field, value);
        };

        const inputClassName = `
            block p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600
            ${hasError ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${inputExtraClassName}
        `.replace(/\s+/g, ' ').trim();

        const commonProps = {
            id: field,
            name: field,
            value: value as string | number,
            onChange: handleChange,
            onBlur: handleBlur,
            className: inputClassName,
            disabled,
            ...props,
        };

        return (
            <div className={`${componentExtraClassName}`}>
                {label && (
                    <label htmlFor={field} className={`block font-medium ${labelExtraClassName}`}>
                        {label}{required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                {type === 'textarea' ? (
                    <textarea
                        ref={ref as React.Ref<HTMLTextAreaElement>}
                        rows={rows}
                        {...commonProps}
                    />
                ) : (
                    <input
                        ref={ref as React.Ref<HTMLInputElement>}
                        type={type}
                        {...commonProps}
                    />
                )}
                {error && (
                    <span className="text-red-500 text-sm mt-1">{error}</span>
                )}
            </div>
        );
    }
);

ValidatedInput.displayName = 'ValidatedInput';

// Form Container Component
export interface ValidatedFormProps {
    children: React.ReactNode;
    onSubmit: (e: React.FormEvent) => void;
    validationState?: ValidationState;
    isLoading?: boolean;
    className?: string;
    formData: Record<string, unknown>;
    setFormData: (data: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => void;
    validation: ReturnType<typeof useZodValidation>;
}

export const ValidatedForm: React.FC<ValidatedFormProps> = ({
    children,
    onSubmit,
    validationState,
    isLoading = false,
    className = '',
    formData,
    setFormData,
    validation,
    ...props
}) => {
    return (
        <FormContext.Provider value={{ formData, setFormData, validation }}>
            <form
                onSubmit={onSubmit}
                className={`space-y-4 ${className}`}
                {...props}
            >
                {children}
                {validationState?.hasErrors && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
                        <p className="text-red-700 dark:text-red-300 text-sm">
                            Please fix the validation errors before submitting.
                        </p>
                    </div>
                )}
            </form>
        </FormContext.Provider>
    );
};

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