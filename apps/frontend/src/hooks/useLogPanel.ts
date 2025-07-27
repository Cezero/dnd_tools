import { useLogPanel } from '@/components/log-panel';

/**
 * Global hook to access the log panel functionality
 * Must be used within a LogPanelProvider
 */
export function useLogPanelHook() {
    try {
        return useLogPanel();
    } catch (error) {
        console.warn('useLogPanel must be used within LogPanelProvider');
        return null;
    }
} 
