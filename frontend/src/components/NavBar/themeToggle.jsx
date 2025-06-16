import React, { useState, useEffect } from 'react';
import Icon from '@mdi/react';
import { mdiWeatherSunny, mdiWeatherNight } from '@mdi/js';

function ThemeToggle() {
    const [isDarkMode, setIsDarkMode] = useState(() => {
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

    const toggleTheme = () => {
        setIsDarkMode(prevMode => !prevMode);
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-1 border rounded text-sm dark:bg-[#141e2d] dark:text-white bg-gray-200 text-black"
            title={isDarkMode ? "Enable light mode" : "Enable dark mode"}
        >
            <Icon path={isDarkMode ? mdiWeatherSunny : mdiWeatherNight} size={0.7} />
        </button>
    );
}

export default ThemeToggle;