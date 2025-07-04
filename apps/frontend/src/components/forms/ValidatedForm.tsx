import { Select } from '@base-ui-components/react/select';
import { ChevronUpDownIcon } from '@heroicons/react/24/solid';
import React, { forwardRef } from 'react';
import { z } from 'zod';

import { useZodValidation, type ValidationState } from '@/hooks/useZodValidation';

// Validated Input Component
export interface ValidatedInputProps {
    name: string;
    label: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'textarea';
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    error?: string;
    hasError?: boolean;
    required?: boolean;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    min?: number;
    max?: number;
    step?: number;
}

export const ValidatedInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, ValidatedInputProps>(
    ({
        name,
        label,
        type = 'text',
        value,
        onChange,
        onBlur,
        error,
        hasError = false,
        required = false,
        placeholder,
        className = '',
        disabled = false,
        min,
        max,
        step,
        ...props
    }, ref) => {
        const inputClassName = `
            mt-1 block p-2 border rounded dark:bg-gray-700 dark:border-gray-600
            ${hasError ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
        `.trim();

        return (
            <div className="flex flex-col">
                <label htmlFor={name} className="block font-medium">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {type === 'textarea' ? (
                    <textarea
                        ref={ref as React.Ref<HTMLTextAreaElement>}
                        id={name}
                        name={name}
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder={placeholder}
                        className={inputClassName}
                        disabled={disabled}
                        rows={4}
                        {...props}
                    />
                ) : (
                    <input
                        ref={ref as React.Ref<HTMLInputElement>}
                        type={type}
                        id={name}
                        name={name}
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder={placeholder}
                        className={inputClassName}
                        disabled={disabled}
                        min={min}
                        max={max}
                        step={step}
                        {...props}
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

// Validated Checkbox Component
export interface ValidatedCheckboxProps {
    name: string;
    label: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    hasError?: boolean;
    disabled?: boolean;
    className?: string;
}

export const ValidatedCheckbox = forwardRef<HTMLInputElement, ValidatedCheckboxProps>(
    ({
        name,
        label,
        checked,
        onChange,
        error,
        hasError = false,
        disabled = false,
        className = '',
        ...props
    }, ref) => {
        const checkboxClassName = `
            form-checkbox h-5 w-5 text-blue-600 rounded dark:bg-gray-700 dark:border-gray-600 
            accent-blue-600 checked:bg-blue-600 dark:checked:bg-blue-600
            ${hasError ? 'border-red-500' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
        `.trim();

        return (
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <input
                        ref={ref}
                        type="checkbox"
                        id={name}
                        name={name}
                        checked={checked}
                        onChange={onChange}
                        className={checkboxClassName}
                        disabled={disabled}
                        {...props}
                    />
                    <label htmlFor={name} className="font-medium">
                        {label}
                    </label>
                </div>
                {error && (
                    <span className="text-red-500 text-sm mt-1">{error}</span>
                )}
            </div>
        );
    }
);

ValidatedCheckbox.displayName = 'ValidatedCheckbox';

// Validated Select Component
export interface ValidatedSelectProps {
    name: string;
    label: string;
    value: string | number | null;
    onChange: (value: string | number | null) => void;
    options: Array<{ value: string | number; label: string }>;
    error?: string;
    hasError?: boolean;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

export const ValidatedSelect = forwardRef<HTMLSelectElement, ValidatedSelectProps>(
    ({
        name,
        label,
        value,
        onChange,
        options,
        error,
        hasError = false,
        required = false,
        disabled = false,
        placeholder = 'Select an option',
        className = '',
        ...props
    }, ref) => {
        const selectClassName = `
            mt-1 block p-2 border rounded dark:bg-gray-700 dark:border-gray-600
            ${hasError ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
        `.trim();

        return (
            <div className="flex flex-col">
                <label htmlFor={name} className="block font-medium">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <select
                    ref={ref}
                    id={name}
                    name={name}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value || null)}
                    className={selectClassName}
                    disabled={disabled}
                    {...props}
                >
                    <option value="">{placeholder}</option>
                    {options.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <span className="text-red-500 text-sm mt-1">{error}</span>
                )}
            </div>
        );
    }
);

ValidatedSelect.displayName = 'ValidatedSelect';

// Validated Listbox Component
export interface ValidatedListboxProps {
    name: string;
    label: string;
    value: string | number | null;
    onChange: (value: string | number | null) => void;
    options: Array<{ value: string | number; label: string }>;
    error?: string;
    hasError?: boolean;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

export const ValidatedListbox = forwardRef<HTMLDivElement, ValidatedListboxProps>(
    ({
        name,
        label,
        value,
        onChange,
        options,
        error,
        hasError = false,
        required = false,
        disabled = false,
        placeholder = 'Select an option',
        className = '',
        ...props
    }, ref) => {
        const selectedOption = options.find(option => option.value === value);

        return (
            <div className="flex flex-col" ref={ref}>
                <label htmlFor={name} className="block font-medium">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <Select.Root
                    value={value}
                    onValueChange={onChange}
                    disabled={disabled}
                    {...props}
                >
                    <Select.Trigger className={`
                        relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600
                        ${hasError ? 'ring-red-500 focus:ring-red-500' : ''}
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        ${className}
                    `.trim()}>
                        <Select.Value>
                            {selectedOption ? selectedOption.label : placeholder}
                        </Select.Value>
                        <Select.Icon>
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                        <Select.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
                        <Select.Positioner>
                            <Select.Popup className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:text-gray-100">
                                {options.map(option => (
                                    <Select.Item
                                        key={option.value}
                                        value={option.value}
                                        className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 dark:text-gray-100 hover:bg-blue-600 hover:text-white data-[highlighted]:bg-blue-600 data-[highlighted]:text-white"
                                    >
                                        <Select.ItemText>
                                            {option.label}
                                        </Select.ItemText>
                                    </Select.Item>
                                ))}
                            </Select.Popup>
                        </Select.Positioner>
                    </Select.Portal>
                </Select.Root>
                {error && (
                    <span className="text-red-500 text-sm mt-1">{error}</span>
                )}
            </div>
        );
    }
);

ValidatedListbox.displayName = 'ValidatedListbox';

// Form Container Component
export interface ValidatedFormProps {
    children: React.ReactNode;
    onSubmit: (e: React.FormEvent) => void;
    validationState?: ValidationState;
    isLoading?: boolean;
    className?: string;
}

export const ValidatedForm: React.FC<ValidatedFormProps> = ({
    children,
    onSubmit,
    validationState,
    isLoading = false,
    className = '',
    ...props
}) => {
    return (
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

    const createFieldProps = (fieldName: string) => {
        const handlers = validation.createFieldHandlers(fieldName);

        return {
            value: formData[fieldName] || '',
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                const { name, value, type } = e.target;
                const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

                setFormData(prev => ({ ...prev, [name]: newValue }));
                handlers.onChange(newValue);
            },
            onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                const { name, value, type } = e.target;
                const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

                handlers.onBlur(newValue);
            },
            error: handlers.error,
            hasError: handlers.hasError
        };
    };

    const createCheckboxProps = (fieldName: string) => {
        const handlers = validation.createFieldHandlers(fieldName);

        return {
            checked: formData[fieldName] || false,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                const { name, checked } = e.target;

                setFormData(prev => ({ ...prev, [name]: checked }));
                handlers.onChange(checked);
            },
            onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                const { checked } = e.target as HTMLInputElement;
                handlers.onBlur(checked);
            },
            error: handlers.error,
            hasError: handlers.hasError
        };
    };

    return {
        validation,
        createFieldProps,
        createCheckboxProps
    };
} 