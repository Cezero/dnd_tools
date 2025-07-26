import React from 'react';

interface ColorPickerProps {
    label: string;
    value: string;
    onChange: (color: string) => void;
    className?: string;
    disabled?: boolean;
    placeholder?: string;
    showLabel?: boolean;
}

export function ColorPicker({
    label,
    value,
    onChange,
    className = '',
    disabled = false,
    placeholder = '#000000',
    showLabel = true
}: ColorPickerProps): React.JSX.Element {
    // Handle empty/null values by using placeholder
    const displayValue = value || placeholder;

    return (
        <div className={`space-y-2 ${className}`}>
            {showLabel && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </label>
            )}
            <div className="flex items-center space-x-3">
                <input
                    type="color"
                    value={displayValue}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                />
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder={placeholder}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>
        </div>
    );
} 
