import { Toast } from '@base-ui-components/react/toast';

/**
 * Global hook to access the toast manager
 * Must be used within a ToastProvider
 */
export function useToast() {
    try {
        return Toast.useToastManager();
    } catch (error) {
        console.warn('useToast must be used within ToastProvider');
        return null;
    }
} 
