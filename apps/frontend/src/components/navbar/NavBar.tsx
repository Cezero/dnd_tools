import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { withAuthContext } from '@/components/auth/withAuth';
import { ThemeToggle } from '@/components/navbar/themeToggle';
import { FeatureNavigation } from '@/features/FeatureRoutes';
import { NavBarService } from '@/services/NavBarService';
import { EDITION_SELECT_LIST, EditionSelect } from '@shared/static-data';

import type { NavBarProps } from './types';

function NavBarComponent({ auth }: NavBarProps): React.JSX.Element {
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [editions, setEditions] = useState<EditionSelect[]>([]);
    const [selectedEdition, setSelectedEdition] = useState<string>('4');
    const [isUpdatingEdition, setIsUpdatingEdition] = useState<boolean>(false);

    const ToggleDropdown = (): void => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const HandleLogout = (): void => {
        auth.Logout();
        setIsDropdownOpen(false);
    };

    useEffect(() => {
        async function LoadEditions(): Promise<void> {
            setEditions(EDITION_SELECT_LIST);

            // Set initial selected edition from user profile or default
            if (auth.user?.preferredEditionId) {
                setSelectedEdition(String(auth.user.preferredEditionId));
            } else {
                setSelectedEdition('4');
            }
        }

        LoadEditions();

        function HandleClickOutside(event: MouseEvent): void {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", HandleClickOutside);
        return () => {
            document.removeEventListener("mousedown", HandleClickOutside);
        };
    }, [auth.user]); // Depend on user to re-evaluate preferred edition on login/logout

    const HandleEditionChange = async (event: React.ChangeEvent<HTMLSelectElement>): Promise<void> => {
        const newEditionId = event.target.value;
        setSelectedEdition(newEditionId);

        try {
            setIsUpdatingEdition(true);
            const editionIdForBackend = parseInt(newEditionId, 10);

            // Use NavBarService instead of direct auth call
            const response = await NavBarService.updatePreferredEdition(editionIdForBackend);

            // Update auth context with new user data
            await auth.UpdatePreferredEdition(editionIdForBackend);
        } catch (error) {
            console.error('Failed to update preferred edition:', error);
            // Revert selection on error
            setSelectedEdition(String(auth.user?.preferredEditionId || '4'));
        } finally {
            setIsUpdatingEdition(false);
        }
    };

    return (
        <nav className="bg-gray-100 dark:bg-gray-800 h-11 shadow flex">
            <div className="flex items-center pl-4">
                <Link to="/" className="font-bold text-lg">DnD Tools</Link>
            </div>
            <div className="flex items-end space-x-1 ml-6">
                {FeatureNavigation.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`px-2 border border-b-0 border-gray-300 dark:border-gray-600 rounded-t-lg 
                ${isActive ? 'bg-white dark:bg-gray-900 font-bold' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </div>
            <div className="flex items-end space-x-1 mr-6 ml-auto">
                {auth.user && auth.user.isAdmin && (
                    <Link
                        to="/admin"
                        className={`px-2 border border-b-0 border-gray-300 dark:border-gray-600 rounded-t-lg 
              ${location.pathname.startsWith('/admin') ? 'bg-white dark:bg-gray-900 font-bold' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                        Admin
                    </Link>
                )}
            </div>
            <div className="flex items-center space-x-2 pr-4">
                {editions.length > 0 && (
                    <div className="flex items-center space-x-1">
                        <select
                            value={selectedEdition}
                            onChange={HandleEditionChange}
                            disabled={isUpdatingEdition}
                            className="bg-gray-200 dark:bg-gray-700 text-black dark:text-white text-sm px-2 py-1 rounded focus:outline-none disabled:opacity-50"
                        >
                            {editions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {isUpdatingEdition && (
                            <span className="text-xs text-gray-500">Updating...</span>
                        )}
                    </div>
                )}

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