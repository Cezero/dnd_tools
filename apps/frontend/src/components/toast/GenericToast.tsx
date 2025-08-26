import { Toast } from '@base-ui-components/react/toast';
import { XMarkIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface GenericToastProps {
    toast: Toast.Root.ToastObject<Record<string, unknown>>;
    isDarkMode?: boolean;
}

export function GenericToast({ toast, isDarkMode: _isDarkMode = false }: GenericToastProps): React.JSX.Element {
    // Check if there's formatted content in the data
    const hasFormattedContent = toast.data?.formattedContent && React.isValidElement(toast.data.formattedContent);

    return (
        <Toast.Root
            toast={toast}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[300px] max-w-[500px]"
            swipeDirection="up"
        >
            <div className="relative">
                <Toast.Title className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                    {toast.title}
                </Toast.Title>
                <Toast.Description>
                    {hasFormattedContent ? (toast.data.formattedContent as React.ReactElement) : toast.description}
                </Toast.Description>
                <Toast.Close
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Close toast"
                >
                    <XMarkIcon className="h-4 w-4" />
                </Toast.Close>
            </div>
        </Toast.Root>
    );
} 
