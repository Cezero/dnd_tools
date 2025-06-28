import { Link, useLocation } from 'react-router-dom';
import { UseAuth } from '@/auth/AuthProvider';
import { ThemeToggle } from '@/components/NavBar/ThemeToggle';
import React, { useState, useRef, useEffect } from 'react';
import { FeatureNavigation } from '@/features/FeatureRoutes';
import { EDITION_LIST } from '@shared/static-data';

interface EditionOption {
    value: string;
    label: string;
}

export function NavBar(): React.JSX.Element {
    const { user, Logout, UpdatePreferredEdition } = UseAuth();
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [editions, setEditions] = useState<EditionOption[]>([]);
    const [selectedEdition, setSelectedEdition] = useState<string>('4');

    const ToggleDropdown = (): void => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const HandleLogout = (): void => {
        Logout();
        setIsDropdownOpen(false);
    };

    useEffect(() => {
        async function LoadEditions(): Promise<void> {
            let editionOptions: EditionOption[] = EDITION_LIST
                .filter(e => e.id !== 5)
                .map(e => {
                    const myLabel = (e.id === 4 ? '3E/3.5E Combined' : e.abbr);
                    return { value: String(e.id), label: myLabel }
                });

            setEditions(editionOptions);

            // Set initial selected edition from user profile or default
            if (user?.preferred_edition_id) {
                setSelectedEdition(String(user.preferred_edition_id));
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
    }, [user]); // Depend on user to re-evaluate preferred edition on login/logout

    const HandleEditionChange = async (event: React.ChangeEvent<HTMLSelectElement>): Promise<void> => {
        const newEditionId = event.target.value;
        setSelectedEdition(newEditionId);
        // Send the actual edition ID for the combined option (which is 4) to the backend
        const editionIdForBackend = parseInt(newEditionId, 10);
        await UpdatePreferredEdition(editionIdForBackend);
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
                {user && user.is_admin && (
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
                    <select
                        value={selectedEdition}
                        onChange={HandleEditionChange}
                        className="bg-gray-200 dark:bg-gray-700 text-black dark:text-white text-sm px-2 py-1 rounded focus:outline-none"
                    >
                        {editions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                )}

                {user ? (
                    <div className="relative">
                        <button onClick={ToggleDropdown} className="text-sm items-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none">
                            Logged in as <strong>{user.username}</strong>
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