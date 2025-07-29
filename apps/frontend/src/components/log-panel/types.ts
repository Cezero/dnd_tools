export interface LogEntry {
    id: string;
    timestamp: Date;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    source?: string; // e.g., 'dice-box', 'system', etc.
    data?: any; // Additional structured data
}

export interface LogPanelContextType {
    addLogEntry: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
    clearLog: () => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    entries: LogEntry[];
} 
