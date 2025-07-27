import React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import { DiceResultToast } from '../dice-box/DiceResultToast';
import type { ParsedDiceResult } from '../dice-box/DiceResultParser';

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

// Generic toast list component with custom renderers
function ToastList(): React.JSX.Element {
    const { toasts } = Toast.useToastManager();

    return (
        <>
            {toasts.map((toast) => {
                // Check if this is a dice result toast
                if (toast.data && typeof toast.data === 'object' && 'individualRolls' in toast.data) {
                    return (
                        <DiceResultToast
                            key={toast.id}
                            toast={toast as Toast.Root.ToastObject<ParsedDiceResult>}
                            isDarkMode={document.documentElement.classList.contains('dark')}
                        />
                    );
                }

                // Default toast renderer
                return (
                    <Toast.Root
                        key={toast.id}
                        toast={toast}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]"
                        swipeDirection="up"
                    >
                        <div className="relative">
                            <Toast.Title className="font-semibold text-gray-900 dark:text-white mb-2">
                                {toast.title}
                            </Toast.Title>
                            <Toast.Description className="text-sm text-gray-600 dark:text-gray-300">
                                {toast.description}
                            </Toast.Description>
                            <Toast.Close className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </Toast.Close>
                        </div>
                    </Toast.Root>
                );
            })}
        </>
    );
} 
