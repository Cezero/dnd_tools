import React from 'react';
import type { LogEntry } from './types';

interface LogEntryProps {
    entry: LogEntry;
}

export function LogEntryComponent({ entry }: LogEntryProps): React.JSX.Element {
    const formatTimestamp = (date: Date): string => {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const getTypeColor = (type?: string): string => {
        switch (type) {
            case 'success':
                return 'text-green-600 dark:text-green-400';
            case 'warning':
                return 'text-yellow-600 dark:text-yellow-400';
            case 'error':
                return 'text-red-600 dark:text-red-400';
            default:
                return 'text-gray-600 dark:text-gray-300';
        }
    };

    const renderMessage = () => {
        // If this is a dice result with structured data, render it specially
        if (entry.source === 'dice-box' && entry.data?.individualRolls) {
            return (
                <div className="flex items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                        {entry.data.title}:{' '}
                        <span className="font-mono">
                            {entry.data.individualRolls.map((roll: string, index: number) => {
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
                                = {entry.data.total}
                            </span>
                        </span>
                    </span>
                </div>
            );
        }

        // Default message rendering
        return (
            <span className={`text-sm ${getTypeColor(entry.type)}`}>
                {entry.message}
            </span>
        );
    };

    return (
        <div className="py-1 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <div className="flex items-center p-1.5 gap-4 border border-content rounded-md">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {formatTimestamp(entry.timestamp)}
                </div>
                <div className="flex-1">
                    {renderMessage()}
                </div>
            </div>
        </div>
    );
} 
