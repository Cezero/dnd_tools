import React, { forwardRef } from 'react';

import { CoreComponent } from '@shared/static-data';

import { CustomSelect, CustomCheckbox } from './FormComponents';
import type {
    ValidatedInputProps,
    ValidatedCustomCheckboxProps,
    ValidatedCustomSelectProps,
    ValidatedFormProps,
} from './types';
import { FormContext, useFormContext } from './ValidatedFormHooks';

/**
 * Sets a value at a dot path immutably (clones each segment so the original object is not mutated).
 * Required for nested form state so that change detection (e.g. draft sync) sees actual changes.
 */
function setNestedValueImmutable(
    obj: Record<string, unknown>,
    path: string,
    value: unknown
): Record<string, unknown> {
    const keys = path.split('.');
    if (keys.length === 1) return { ...obj, [path]: value };

    const newObj = { ...obj };
    let current = newObj;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const existing = current[key];
        const nextKey = keys[i + 1];
        const isNextArrayIndex = /^\d+$/.test(nextKey);

        if (Array.isArray(existing) && isNextArrayIndex) {
            const idx = parseInt(nextKey, 10);
            const newArr = [...existing];
            const existingItem = newArr[idx];
            newArr[idx] =
                existingItem != null && typeof existingItem === 'object' && !Array.isArray(existingItem)
                    ? { ...(existingItem as Record<string, unknown>) }
                    : ({} as Record<string, unknown>);
            current[key] = newArr;
            current = newArr[idx] as Record<string, unknown>;
            i += 1;
        } else if (existing != null && typeof existing === 'object' && !Array.isArray(existing)) {
            current[key] = { ...(existing as Record<string, unknown>) };
            current = current[key] as Record<string, unknown>;
        } else {
            current[key] = isNextArrayIndex ? [] : {};
            current = current[key] as Record<string, unknown>;
        }
    }

    current[keys[keys.length - 1]] = value;
    return newObj;
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

        const setNestedValue = (o: Record<string, unknown>, p: string, v: unknown) =>
            nested ? setNestedValueImmutable(o, p, v) : { ...o, [p]: v };

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

            const newFormData = setNestedValue(formData, field, value);
            setFormData(newFormData);
            validation.validateField(field, value, newFormData);
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            let value: string | number = e.target.value;

            // Convert to number for number inputs
            if (type === 'number') {
                const numValue = e.target.value === '' ? null : Number(e.target.value);
                value = numValue;
            }

            validation.validateField(field, value, formData);
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
            'data-1p-ignore': 'true',
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

        const setNestedValue = (o: Record<string, unknown>, p: string, v: boolean) =>
            nested ? setNestedValueImmutable(o, p, v) : { ...o, [p]: v };

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

export const ValidatedCustomSelect = <T extends CoreComponent = CoreComponent>({
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
}: ValidatedCustomSelectProps<T>) => {
    const { formData, setFormData } = useFormContext();

    // Helper function to get nested value
    const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
        if (!nested) return obj[path] ?? null;
        return path.split('.').reduce((current, key) => {
            return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
        }, obj) ?? null;
    };

    const setNestedValue = (o: Record<string, unknown>, p: string, v: unknown) =>
        nested ? setNestedValueImmutable(o, p, v) : { ...o, [p]: v };

    const value = getNestedValue(formData, field);

    const handleValueChange = (newValue: string | number) => {
        setFormData(prev => setNestedValue(prev, field, newValue));
    };

    return (
        <CustomSelect
            value={value as number}
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
};

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


