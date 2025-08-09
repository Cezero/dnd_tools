import { Toast } from '@base-ui-components/react/toast';
import React from 'react';

import { GenericToast } from './GenericToast';

interface ToastProviderProps {
    children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps): React.JSX.Element {
    return (
        <Toast.Provider limit={5}>
            {children}
            <Toast.Portal>
                <Toast.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                    <ToastList />
                </Toast.Viewport>
            </Toast.Portal>
        </Toast.Provider>
    );
}

// Generic toast list component
function ToastList(): React.JSX.Element {
    const { toasts } = Toast.useToastManager();

    return (
        <>
            {toasts.map((toast) => (
                <GenericToast
                    key={toast.id}
                    toast={toast}
                    isDarkMode={document.documentElement.classList.contains('dark')}
                />
            ))}
        </>
    );
} 
