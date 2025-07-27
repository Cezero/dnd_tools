import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Toast } from '@base-ui-components/react/toast';
import type { ParsedDiceResult } from './DiceResultParser';

interface DiceResultToastProps {
    toast: Toast.Root.ToastObject<ParsedDiceResult>;
    isDarkMode?: boolean;
}

export function DiceResultToast({ toast, isDarkMode = false }: DiceResultToastProps): React.JSX.Element {
    const { title, description, individualRolls, total, hasSpecialResults } = toast.data || {};

    // Parse the description to extract individual rolls and apply styling
    const renderDescription = () => {
        if (!individualRolls || individualRolls.length === 0) {
            return <span className="text-sm text-gray-600 dark:text-gray-300">{description}</span>;
        }

        return (
            <span className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                {individualRolls.map((roll, index) => {
                    // Extract the class and value from the roll string
                    const parts = roll.split(' ');
                    const className = parts[0];
                    const value = parts[1] || roll;

                    let rollClasses = "inline-block px-2 py-1 mx-1 rounded text-xs font-semibold min-w-[20px] text-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600";

                    if (className === 'crit-success') {
                        rollClasses = "inline-block px-2 py-1 mx-1 rounded text-xs font-semibold min-w-[20px] text-center bg-gradient-to-br from-green-500 to-green-600 text-white shadow-sm";
                    } else if (className === 'crit-failure') {
                        rollClasses = "inline-block px-2 py-1 mx-1 rounded text-xs font-semibold min-w-[20px] text-center bg-gradient-to-br from-red-500 to-red-600 text-white shadow-sm";
                    }

                    return (
                        <span key={index} className={rollClasses}>
                            {value}
                        </span>
                    );
                })}
                <span className="ml-2 font-bold text-base text-gray-900 dark:text-white">
                    = {total}
                </span>
            </span>
        );
    };

    return (
        <Toast.Root
            toast={toast}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]"
            swipeDirection="up"
        >
            <div className="relative">
                <Toast.Title className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                    {title}
                </Toast.Title>
                <Toast.Description>
                    {renderDescription()}
                </Toast.Description>
                <Toast.Close
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Close dice result"
                >
                    <XMarkIcon className="h-4 w-4" />
                </Toast.Close>
            </div>
        </Toast.Root>
    );
}

// Helper component for creating toast data
export function createDiceResultToastData(parsedResult: ParsedDiceResult) {
    return {
        title: parsedResult.title,
        description: parsedResult.description,
        data: parsedResult,
        type: parsedResult.hasSpecialResults ? 'success' : 'default',
    };
} 
