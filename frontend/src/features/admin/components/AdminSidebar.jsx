import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiTable, mdiChevronRight, mdiChevronLeft } from '@mdi/js';

function AdminSidebar({ isExpanded, setIsExpanded, isHidden, setIsHidden }) {
    const sidebarRef = useRef(null);
    const [showHandle, setShowHandle] = useState(false); // New state for handle visibility

    // This button toggles between Expanded and Minimal states
    const toggleExpandedMinimal = () => {
        setIsExpanded(!isExpanded);
    };

    // This button hides the sidebar (from Minimal state)
    const hideSidebar = () => {
        setIsHidden(true);
        setIsExpanded(false); // Ensure it's not expanded when hidden
    };

    // This button (the handle) shows the sidebar from hidden state (to minimal)
    const handleExpandFromHandle = () => {
        setIsHidden(false); // Show sidebar
        setIsExpanded(false); // Ensure it's in minimal state initially
    };

    useEffect(() => {
        const handleMouseMove = (event) => {
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

        document.addEventListener('mousemove', handleMouseMove);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
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
                            onClick={toggleExpandedMinimal}
                            className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                            aria-label={isExpanded ? "Collapse sidebar to minimal" : "Expand sidebar to full"}
                        >
                            <Icon path={isExpanded ? mdiChevronLeft : mdiChevronRight} size={1} />
                        </button>

                        {/* Hide Button (visible only in Minimal state) */}
                        {!isExpanded && (
                            <button
                                onClick={hideSidebar}
                                className="ml-auto p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                aria-label="Hide sidebar"
                                title="Hide sidebar"
                            >
                                <Icon path={mdiChevronLeft} size={1} />
                            </button>
                        )}
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-grow">
                        <ul>
                            <li>
                                <Link
                                    to="/admin/reference-tables"
                                    className={`flex items-center px-4 py-2 rounded 
                                        text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 
                                        ${isExpanded ? 'justify-start' : 'justify-center'}`}
                                    title="Reference Tables"
                                >
                                    <Icon path={mdiTable} size={1} />
                                    {isExpanded && <span className="ml-3">Reference Tables</span>}
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
                    onClick={handleExpandFromHandle}
                    className="absolute top-1/2 -translate-y-1/2 h-14 left-0 w-8 flex items-center justify-center z-20
                        bg-gray-300 dark:bg-gray-800 rounded-r-lg shadow-lg
                        hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors duration-200"
                    aria-label="Expand sidebar"
                >
                    <Icon path={mdiChevronRight} size={1} className="text-gray-800 dark:text-gray-100" />
                </button>
            )}
        </>
    );
}

export default AdminSidebar; 