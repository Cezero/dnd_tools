import React, { useEffect, useState } from 'react';
import JsonView from '@uiw/react-json-view';

interface JsonViewerProps {
    data: unknown;
    loading?: boolean;
    error?: string | null;
}

export function JsonViewer({ data, loading = false, error = null }: JsonViewerProps): React.JSX.Element {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Check if dark mode is active
        const checkDarkMode = () => {
            const isDark = document.documentElement.classList.contains('dark') ||
                window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(isDark);
        };

        checkDarkMode();

        // Watch for changes
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', checkDarkMode);

        return () => {
            observer.disconnect();
            mediaQuery.removeEventListener('change', checkDarkMode);
        };
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-gray-600 dark:text-gray-400">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-red-600 dark:text-red-400">Error: {error}</div>
            </div>
        );
    }

    if (data === null || data === undefined) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-gray-600 dark:text-gray-400">No data available</div>
            </div>
        );
    }

    // Light theme colors
    const lightTheme = {
        '--w-rjv-color': '#000000',
        '--w-rjv-key-string': '#000000',
        '--w-rjv-key-number': '#000000',
        '--w-rjv-background-color': 'transparent',
        '--w-rjv-line-color': '#ebebeb',
        '--w-rjv-arrow-color': '#000000',
        '--w-rjv-type-string-color': '#d14',
        '--w-rjv-type-int-color': '#099',
        '--w-rjv-type-float-color': '#099',
        '--w-rjv-type-bigint-color': '#099',
        '--w-rjv-type-boolean-color': '#c00',
        '--w-rjv-type-null-color': '#808080',
        '--w-rjv-type-date-color': '#099',
        '--w-rjv-type-nan-color': '#808080',
        '--w-rjv-undefined-color': '#808080',
        '--w-rjv-curlybraces-color': '#000000',
        '--w-rjv-colon-color': '#000000',
        '--w-rjv-brackets-color': '#000000',
    };

    // Dark theme colors with lighter keys
    const darkTheme = {
        '--w-rjv-color': '#e5e7eb', // Light gray for default text/keys
        '--w-rjv-key-string': '#e5e7eb', // Light gray for string keys
        '--w-rjv-key-number': '#e5e7eb', // Light gray for number keys
        '--w-rjv-background-color': 'transparent',
        '--w-rjv-line-color': '#4b5563', // Darker gray for lines
        '--w-rjv-arrow-color': '#e5e7eb', // Light gray for arrows
        '--w-rjv-type-string-color': '#fca5a5', // Light red for strings
        '--w-rjv-type-int-color': '#7dd3fc', // Light blue for numbers
        '--w-rjv-type-float-color': '#7dd3fc',
        '--w-rjv-type-bigint-color': '#7dd3fc',
        '--w-rjv-type-boolean-color': '#fbbf24', // Light yellow for booleans
        '--w-rjv-type-null-color': '#9ca3af', // Medium gray for null
        '--w-rjv-type-date-color': '#7dd3fc',
        '--w-rjv-type-nan-color': '#9ca3af',
        '--w-rjv-undefined-color': '#9ca3af',
        '--w-rjv-curlybraces-color': '#e5e7eb', // Light gray for braces
        '--w-rjv-colon-color': '#e5e7eb', // Light gray for colons
        '--w-rjv-brackets-color': '#e5e7eb', // Light gray for brackets
    };

    const themeStyles = isDarkMode ? darkTheme : lightTheme;
    const themeId = `json-viewer-theme-${isDarkMode ? 'dark' : 'light'}`;

    return (
        <>
            <style>
                {`
                    .${themeId} {
                        ${Object.entries(themeStyles).map(([key, value]) => `${key}: ${value} !important;`).join('\n                        ')}
                    }
                    .${themeId} .w-rjv,
                    .${themeId} .w-rjv * {
                        ${Object.entries(themeStyles).map(([key, value]) => `${key}: ${value} !important;`).join('\n                        ')}
                    }
                `}
            </style>
            <div className={`w-full h-full overflow-auto max-h-[calc(100vh-300px)] border border-gray-300 dark:border-gray-600 rounded-md p-4 ${themeId}`}>
                <JsonView
                    value={data}
                    style={themeStyles}
                    theme="default"
                />
            </div>
        </>
    );
}

