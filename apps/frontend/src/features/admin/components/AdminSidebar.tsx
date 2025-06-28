import React, { useRef, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TableCellsIcon, ChevronRightIcon, ChevronLeftIcon, HomeIcon } from '@heroicons/react/24/outline';

interface AdminSidebarProps {
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
    isHidden: boolean;
    setIsHidden: (hidden: boolean) => void;
}

export function AdminSidebar({ isExpanded, setIsExpanded, isHidden, setIsHidden }: AdminSidebarProps): React.JSX.Element {
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [showHandle, setShowHandle] = useState<boolean>(false); // New state for handle visibility
    const location = useLocation(); // Get current location

    // This button toggles between Expanded and Minimal states
    const ToggleExpandedMinimal = (): void => {
        setIsExpanded(!isExpanded);
    };

    // This button hides the sidebar (from Minimal state)
    const HideSidebar = (): void => {
        setIsHidden(true);
        setIsExpanded(false); // Ensure it's not expanded when hidden
    };

    // This button (the handle) shows the sidebar from hidden state (to minimal)
    const HandleExpandFromHandle = (): void => {
        setIsHidden(false); // Show sidebar
        setIsExpanded(false); // Ensure it's in minimal state initially
    };

    useEffect(() => {
        const HandleMouseMove = (event: MouseEvent): void => {
            // Only show handle if sidebar is hidden
            if (isHidden) {
                // Adjust this threshold as needed
                if (event.clientX < 20) { // If mouse is within 20px of the left edge
                    setShowHandle(true);
                } else {
                    setShowHandle(false);
                }
            }
        };

        document.addEventListener('mousemove', HandleMouseMove);

        return () => {
            document.removeEventListener('mousemove', HandleMouseMove);
        };
    }, [isHidden]); // Re-run effect if isHidden changes

    return (
        <>
            {!isHidden && (
                <div
                    ref={sidebarRef}
                    className={`fixed top-[44px] bottom-2 bg-gray-200 dark:bg-gray-700 shadow-lg z-10 
                        flex flex-col transition-all duration-300 ease-in-out py-4 rounded-tr-lg rounded-br-lg
                        ${isExpanded ? 'w-64 px-4' : 'w-16 items-center px-1'}`}
                >
                    {/* Buttons for toggling expanded/minimal and hiding */}
                    <div className={`flex ${isExpanded ? 'justify-end' : 'justify-center'} w-full items-center mb-4`}>
                        {/* Main Toggle Button (Expanded <-> Minimal) */}
                        <button
                            onClick={ToggleExpandedMinimal}
                            className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                            aria-label={isExpanded ? "Collapse sidebar to minimal" : "Expand sidebar to full"}
                        >
                            {isExpanded ? <ChevronLeftIcon className="mr-1" /> : <ChevronRightIcon className="mr-1" />}
                        </button>

                        {/* Hide Button (visible only in Minimal state) */}
                        {!isExpanded && (
                            <button
                                onClick={HideSidebar}
                                className="ml-auto p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                aria-label="Hide sidebar"
                                title="Hide sidebar"
                            >
                                <ChevronLeftIcon className="mr-1" />
                            </button>
                        )}
                    </div>

                    {/* Navigation Links */}
                    <nav className="grow">
                        <ul>
                            <li>
                                <Link
                                    to="/admin"
                                    className={`flex items-center px-4 py-2 rounded 
                                        text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 
                                        ${isExpanded ? 'justify-start' : 'justify-center'}
                                        ${location.pathname === '/admin' ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                    title="Admin Dashboard"
                                >
                                    <HomeIcon className={`${location.pathname === '/admin' ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                    {isExpanded && <span className={`ml-3 ${location.pathname === '/admin' ? 'text-blue-600 dark:text-blue-400' : ''}`}>Dashboard</span>}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/admin/referencetables"
                                    className={`flex items-center px-4 py-2 rounded 
                                        text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 
                                        ${isExpanded ? 'justify-start' : 'justify-center'}
                                        ${location.pathname === '/admin/referencetables' ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                    title="Reference Tables"
                                >
                                    <TableCellsIcon className={`${location.pathname === '/admin/referencetables' ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                    {isExpanded && <span className={`ml-3 ${location.pathname.startsWith('/admin/referencetables') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Reference Tables</span>}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/admin/classes"
                                    className={`flex items-center px-4 py-2 rounded 
                                        text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 
                                        ${isExpanded ? 'justify-start' : 'justify-center'}
                                        ${location.pathname === '/admin/classes' ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                    title="Classes"
                                >
                                    <TableCellsIcon className={`${location.pathname === '/admin/classes' ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                    {isExpanded && <span className={`ml-3 ${location.pathname.startsWith('/admin/classes') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Classes</span>}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/admin/races"
                                    className={`flex items-center px-4 py-2 rounded 
                                        text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 
                                        ${isExpanded ? 'justify-start' : 'justify-center'}
                                        ${location.pathname === '/admin/races' ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                    title="Races"
                                >
                                    <TableCellsIcon className={`${location.pathname === '/admin/races' ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                    {isExpanded && <span className={`ml-3 ${location.pathname.startsWith('/admin/races') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Races</span>}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/admin/skills"
                                    className={`flex items-center px-4 py-2 rounded 
                                        text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 
                                        ${isExpanded ? 'justify-start' : 'justify-center'}
                                        ${location.pathname === '/admin/skills' ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                    title="Skills"
                                >
                                    <TableCellsIcon className={`${location.pathname === '/admin/skills' ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                    {isExpanded && <span className={`ml-3 ${location.pathname.startsWith('/admin/skills') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Skills</span>}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/admin/feats"
                                    className={`flex items-center px-4 py-2 rounded 
                                        text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 
                                        ${isExpanded ? 'justify-start' : 'justify-center'}
                                        ${location.pathname === '/admin/feats' ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                    title="Skills"
                                >
                                    <TableCellsIcon className={`${location.pathname === '/admin/feats' ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                    {isExpanded && <span className={`ml-3 ${location.pathname.startsWith('/admin/feats') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Feats</span>}
                                </Link>
                            </li>
                            {/* Add other admin functions here */}
                        </ul>
                    </nav>

                </div>
            )}

            {/* Hidden Sidebar Handle */}
            {isHidden && showHandle && (
                <button
                    onClick={HandleExpandFromHandle}
                    className="absolute top-1/2 -translate-y-1/2 h-14 left-0 w-8 flex items-center justify-center z-20
                        bg-gray-300 dark:bg-gray-800 rounded-r-lg shadow-lg
                        hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors duration-200"
                    aria-label="Expand sidebar"
                >
                    <ChevronRightIcon className="text-gray-800 dark:text-gray-100" />
                </button>
            )}
        </>
    );
}