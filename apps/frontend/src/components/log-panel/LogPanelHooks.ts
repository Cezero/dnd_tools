import { useContext } from 'react';

import { LogPanelContext } from './LogPanelContext';
import type { LogPanelContextType } from './types';

// Hook to use LogPanel context
export function useLogPanel(): LogPanelContextType {
    const context = useContext(LogPanelContext);
    if (!context) {
        throw new Error('useLogPanel must be used within a LogPanelProvider');
    }
    return context;
}
