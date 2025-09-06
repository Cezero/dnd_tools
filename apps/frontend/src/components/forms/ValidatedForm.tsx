import React, { forwardRef } from 'react';

import { type ValidationState } from '@/hooks/useZodValidation';

import { CustomSelect, CustomCheckbox } from './FormComponents';
import { FormContext, useFormContext } from './ValidatedFormHooks';

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
                if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
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

        const inputClassName = `${inputExtraClassName}
            block border rounded-md dark:bg-gray-700 dark:border-gray-600
            ${hasError ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}            
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

// Validated Custom Checkbox Component
export interface ValidatedCustomCheckboxProps {
    field: string;
    label?: string;
    required?: boolean;
    componentExtraClassName?: string;
    checkboxClassName?: string;
    labelClassName?: string;
    disabled?: boolean;
    id?: string;
    labelPosition?: 'left' | 'right';
    nested?: boolean;
}

export const ValidatedCustomCheckbox = forwardRef<HTMLButtonElement, ValidatedCustomCheckboxProps>(
    ({
        field,
        label,
        required = false,
        componentExtraClassName = '',
        checkboxClassName = '',
        labelClassName = '',
        disabled = false,
        id,
        labelPosition = 'right',
        nested = false,
        ..._props
    }, _ref) => {
        const { formData, setFormData } = useFormContext();

        // Helper function to get nested value
        const getNestedValue = (obj: Record<string, unknown>, path: string): boolean | undefined => {
            if (!nested) {
                const value = obj[path];
                return value === undefined ? undefined : Boolean(value);
            }
            const result = path.split('.').reduce((current, key) => {
                return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
            }, obj);
            return result === undefined ? undefined : Boolean(result);
        };

        // Helper function to set nested value
        const setNestedValue = (obj: Record<string, unknown>, path: string, value: boolean): Record<string, unknown> => {
            if (!nested) return { ...obj, [path]: value };

            const keys = path.split('.');
            const newObj = { ...obj };
            let current = newObj;

            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
                    current[key] = {};
                }
                current = current[key] as Record<string, unknown>;
            }

            current[keys[keys.length - 1]] = value;
            return newObj;
        };

        const currentValue = getNestedValue(formData, field);

        const handleChange = (checked: boolean) => {
            setFormData(prev => setNestedValue(prev, field, checked));
        };

        return (
            <CustomCheckbox
                checked={currentValue ?? false}
                onCheckedChange={handleChange}
                label={label}
                disabled={disabled}
                componentExtraClassName={componentExtraClassName}
                checkboxClassName={checkboxClassName}
                labelClassName={labelClassName}
                required={required}
                id={id || field}
                labelPosition={labelPosition}
            />
        );
    }
);

ValidatedCustomCheckbox.displayName = 'ValidatedCustomCheckbox';

// Validated Custom Select Component
export interface ValidatedCustomSelectProps<T = string | number> {
    field: string;
    options: Array<{ value: T; label: string }>;
    label?: string;
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
    componentExtraClassName?: string;
    triggerExtraClassName?: string;
    popupExtraClassName?: string;
    itemExtraClassName?: string;
    itemTextExtraClassName?: string;
    icon?: React.ReactNode;
    displayValue?: (value: T | null) => string;
    labelExtraClassName?: string;
    nested?: boolean;
}

export const ValidatedCustomSelect = forwardRef<HTMLDivElement, ValidatedCustomSelectProps>(
    ({
        field,
        options,
        label,
        required = false,
        placeholder = 'Select an option',
        disabled = false,
        componentExtraClassName = '',
        triggerExtraClassName = '',
        popupExtraClassName = '',
        itemExtraClassName = '',
        itemTextExtraClassName = '',
        icon,
        displayValue,
        labelExtraClassName = '',
        nested = false,
        ..._props
    }, _ref) => {
        const { formData, setFormData } = useFormContext();

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
                if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
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

        return (
            <CustomSelect
                value={value as string | number}
                onValueChange={handleValueChange}
                options={options}
                placeholder={placeholder}
                disabled={disabled}
                componentExtraClassName={componentExtraClassName}
                triggerExtraClassName={triggerExtraClassName}
                popupExtraClassName={popupExtraClassName}
                itemExtraClassName={itemExtraClassName}
                itemTextExtraClassName={itemTextExtraClassName}
                label={label}
                required={required}
                labelExtraClassName={labelExtraClassName}
                icon={icon}
                displayValue={displayValue}
            />
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
    validation: ReturnType<typeof import('@/hooks/useZodValidation').useZodValidation>;
}

export const ValidatedForm: React.FC<ValidatedFormProps> = ({
    children,
    onSubmit,
    validationState,
    isLoading: _isLoading = false,
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


