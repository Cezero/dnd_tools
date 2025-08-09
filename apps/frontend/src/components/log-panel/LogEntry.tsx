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
        // If pre-formatted content is provided, use it
        if (entry.data?.formattedContent) {
            return entry.data.formattedContent;
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
