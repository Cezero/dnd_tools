import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { withAuthContext } from '@/components/auth/withAuth';
import { ThemeToggle } from '@/components/navbar/themeToggle';

import type { NavBarProps } from './types';

function NavBarComponent({ auth }: NavBarProps): React.JSX.Element {
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const ToggleDropdown = (): void => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const HandleLogout = (): void => {
        auth.Logout();
        setIsDropdownOpen(false);
    };

    useEffect(() => {
        function HandleClickOutside(event: MouseEvent): void {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", HandleClickOutside);
        return () => {
            document.removeEventListener("mousedown", HandleClickOutside);
        };
    }, []);

    return (
        <nav className="sticky top-0 z-50 h-11 bg-gray-100 dark:bg-gray-800 shadow flex">
            <div className="flex items-center pl-4">
                <Link to="/" className="font-bold text-lg">DnD Tools</Link>
            </div>
            <div className="flex items-center space-x-2 pr-4 ml-auto">
                {auth.user ? (
                    <div className="relative">
                        <button onClick={ToggleDropdown} className="text-sm items-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none">
                            Logged in as <strong>{auth.user.username}</strong>
                        </button>
                        {isDropdownOpen && (
                            <div ref={dropdownRef} className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-20">
                                <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => setIsDropdownOpen(false)}>Profile</Link>
                                <button onClick={HandleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Logout</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link to="/login" className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Login</Link>
                )}
                <ThemeToggle />
            </div>
        </nav>
    );
}

// Export the component wrapped with auth context
export const NavBar = withAuthContext(NavBarComponent); 
