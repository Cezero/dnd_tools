import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';

export function ThemeToggle(): React.JSX.Element {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            return true;
        } else {
            return false;
        }
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        }
    }, [isDarkMode]);

    const ToggleTheme = (): void => {
        setIsDarkMode(prevMode => !prevMode);
    };

    return (
        <button
            onClick={ToggleTheme}
            className="p-1 border rounded flex items-center justify-center"
            title={isDarkMode ? "Enable light mode" : "Enable dark mode"}
        >
            {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>
    );
} 