import React, { useState, useRef, useCallback } from 'react';

import { LogPanelContext } from './LogPanelContext';
import type { LogEntry, LogPanelContextType } from './types';

interface LogPanelProviderProps {
    children: React.ReactNode;
    maxEntries?: number;
}

export function LogPanelProvider({ children, maxEntries = 500 }: LogPanelProviderProps): React.JSX.Element {
    const [entries, setEntries] = useState<LogEntry[]>([]);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const entriesRef = useRef<LogEntry[]>([]);

    // Update ref when entries change
    entriesRef.current = entries;

    const addLogEntry = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
        const newEntry: LogEntry = {
            ...entry,
            id: crypto.randomUUID(),
            timestamp: new Date(),
        };

        setEntries(prevEntries => {
            const updatedEntries = [...prevEntries, newEntry];

            // Remove oldest entries if we exceed maxEntries
            if (updatedEntries.length > maxEntries) {
                return updatedEntries.slice(-maxEntries);
            }

            return updatedEntries;
        });
    }, [maxEntries]);

    const clearLog = useCallback(() => {
        setEntries([]);
    }, []);

    const value: LogPanelContextType = {
        addLogEntry,
        clearLog,
        isOpen,
        setIsOpen,
        entries,
    };

    return (
        <LogPanelContext.Provider value={value}>
            {children}
        </LogPanelContext.Provider>
    );
}


