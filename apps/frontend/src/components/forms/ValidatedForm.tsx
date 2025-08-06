import React, { forwardRef, createContext, useContext } from 'react';
import { z } from 'zod';
import { Select } from '@base-ui-components/react/select';
import { ChevronUpDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

import { useZodValidation, type ValidationState } from '@/hooks/useZodValidation';

// Form Context
interface FormContextType {
    formData: Record<string, unknown>;
    setFormData: (data: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => void;
    validation: ReturnType<typeof useZodValidation>;
}

const FormContext = createContext<FormContextType | null>(null);

// Hook to use form context
export function useFormContext() {
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
    nested?: boolean;
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
        nested = false,
        ...props
    }, ref) => {
        const { formData, setFormData, validation } = useFormContext();

        // Helper function to get nested value
        const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
            if (!nested) return obj[path] ?? '';
            return path.split('.').reduce((current, key) => {
                return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
            }, obj) ?? '';
        };

        // Helper function to set nested value
        const setNestedValue = (obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> => {
            if (!nested) return { ...obj, [path]: value };

            const keys = path.split('.');
            const newObj = { ...obj };
            let current = newObj;

            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!(key in current) || typeof current[key] !== 'object') {
                    current[key] = {};
                }
                current = current[key] as Record<string, unknown>;
            }

            current[keys[keys.length - 1]] = value;
            return newObj;
        };

        const value = getNestedValue(formData, field);
        const error = validation.getError(field);
        const hasError = validation.hasError(field);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            let value: string | number = e.target.value;

            // Convert to number for number inputs
            if (type === 'number') {
                const numValue = e.target.value === '' ? null : Number(e.target.value);
                value = numValue;
            }

            setFormData(prev => setNestedValue(prev, field, value));
            validation.validateField(field, value);
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            let value: string | number = e.target.value;

            // Convert to number for number inputs
            if (type === 'number') {
                const numValue = e.target.value === '' ? null : Number(e.target.value);
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

// Validated Custom Select Component
export interface ValidatedCustomSelectProps {
    field: string;
    label: string;
    options: Array<{ value: string | number; label: string }>;
    required?: boolean;
    placeholder?: string;
    componentExtraClassName?: string;
    labelExtraClassName?: string;
    disabled?: boolean;
    nested?: boolean;
}

export const ValidatedCustomSelect = forwardRef<HTMLDivElement, ValidatedCustomSelectProps>(
    ({
        field,
        label,
        options,
        required = false,
        placeholder = 'Select an option',
        componentExtraClassName = '',
        labelExtraClassName = '',
        disabled = false,
        nested = false,
        ...props
    }, ref) => {
        const { formData, setFormData, validation } = useFormContext();

        // Helper function to get nested value
        const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
            if (!nested) return obj[path] ?? null;
            return path.split('.').reduce((current, key) => {
                return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
            }, obj) ?? null;
        };

        // Helper function to set nested value
        const setNestedValue = (obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> => {
            if (!nested) return { ...obj, [path]: value };

            const keys = path.split('.');
            const newObj = { ...obj };
            let current = newObj;

            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!(key in current) || typeof current[key] !== 'object') {
                    current[key] = {};
                }
                current = current[key] as Record<string, unknown>;
            }

            current[keys[keys.length - 1]] = value;
            return newObj;
        };

        const value = getNestedValue(formData, field);

        const handleValueChange = (newValue: string | number) => {
            setFormData(prev => setNestedValue(prev, field, newValue));
        };

        const selectClassName = `
            focus:ring-blue-500
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `.replace(/\s+/g, ' ').trim();

        return (
            <div className={`${componentExtraClassName}`} ref={ref}>
                {label && (
                    <label className={`block font-medium ${labelExtraClassName}`}>
                        {label}{required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <div className={selectClassName}>
                    <Select.Root
                        value={value as string | number}
                        onValueChange={handleValueChange}
                        items={options}
                        disabled={disabled}
                        modal={false}
                    >
                        <Select.Trigger className="flex items-center justify-between gap-1 pl-2 pr-1 py-2 cursor-default rounded-md bg-white shadow-sm ring-1 ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:ring-gray-600">
                            <Select.Value>
                                {(value) => {
                                    if (value === null || value === undefined) return placeholder;
                                    const option = options.find(opt => opt.value === value);
                                    return option?.label || placeholder;
                                }}
                            </Select.Value>
                            <Select.Icon>
                                <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
                            </Select.Icon>
                        </Select.Trigger>
                        <Select.Positioner>
                            <Select.Popup className="absolute z-[9999] pt-1 pb-1 pr-1 max-h-60 overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800">
                                {options.map((option) => (
                                    <Select.Item
                                        key={String(option.value)}
                                        value={option.value}
                                        className="flex items-center justify-end gap-1 text-left select-none cursor-default pl-1 pr-2 hover:bg-blue-600 data-[highlighted]:bg-blue-600 data-[selected]:text-blue-400"
                                    >
                                        <Select.ItemIndicator>
                                            <ChevronRightIcon className="h-4 w-4" />
                                        </Select.ItemIndicator>
                                        <Select.ItemText>
                                            {option.label}
                                        </Select.ItemText>
                                    </Select.Item>
                                ))}
                            </Select.Popup>
                        </Select.Positioner>
                    </Select.Root>
                </div>
            </div>
        );
    }
);

ValidatedCustomSelect.displayName = 'ValidatedCustomSelect';

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
