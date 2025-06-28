import React, { useState, useEffect } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

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
            className="p-1 border rounded text-sm dark:bg-[#141e2d] dark:text-white bg-gray-200 text-black"
            title={isDarkMode ? "Enable light mode" : "Enable dark mode"}
        >
            {isDarkMode ? <SunIcon className="mr-1" /> : <MoonIcon className="mr-1" />}
        </button>
    );
} 