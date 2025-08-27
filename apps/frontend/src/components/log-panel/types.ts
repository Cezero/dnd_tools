import React from 'react';

export interface LogEntry {
    id: string;
    timestamp: Date;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    source?: string; // e.g., 'dice-box', 'system', etc.
    data?: {
        formattedContent?: React.ReactElement;
        [key: string]: unknown;
    }
}

export interface LogPanelContextType {
    addLogEntry: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
    clearLog: () => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    entries: LogEntry[];
} 
