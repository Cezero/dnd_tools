import { NavigationMenu } from '@base-ui-components/react/navigation-menu';
import { ChevronRightIcon, ChevronLeftIcon, UserGroupIcon, SparklesIcon, BookOpenIcon, ChevronDownIcon, AcademicCapIcon, UserIcon, WrenchScrewdriverIcon, StarIcon, CubeIcon, ChartBarIcon, TableCellsIcon as TableCellsIcon2, Cog6ToothIcon, CubeTransparentIcon, BeakerIcon, ShieldCheckIcon, HeartIcon, SwatchIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import React, { useRef, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import type { MainSidebarProps } from './types';

// Custom Link component for NavigationMenu.Link to enable client-side routing
function CustomLink(props: NavigationMenu.Link.Props) {
    return (
        <NavigationMenu.Link
            render={<Link to={props.href} />}
            {...props}
        />
    );
}

export function MainSidebar({ isExpanded, setIsExpanded, isHidden, setIsHidden }: MainSidebarProps): React.JSX.Element {
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [showHandle, setShowHandle] = useState<boolean>(false);
    const location = useLocation();

    // This button toggles between Expanded and Minimal states
    const ToggleExpandedMinimal = (): void => {
        setIsExpanded(!isExpanded);
    };

    // This button hides the sidebar (from Minimal state)
    const HideSidebar = (): void => {
        setIsHidden(true);
        setIsExpanded(false);
    };

    // This button (the handle) shows the sidebar from hidden state (to minimal)
    const HandleExpandFromHandle = (): void => {
        setIsHidden(false);
        setIsExpanded(false);
    };

    useEffect(() => {
        const HandleMouseMove = (event: MouseEvent): void => {
            // Only show handle if sidebar is hidden
            if (isHidden) {
                // Adjust this threshold as needed
                if (event.clientX < 20) {
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
    }, [isHidden]);

    // Check if any admin route is active
    const isAdminRouteActive = location.pathname.startsWith('/admin');

    return (
        <>
            {!isHidden && (
                <div
                    ref={sidebarRef}
                    className={`fixed top-[44px] bottom-2 bg-gray-200 dark:bg-gray-700 shadow-lg z-10 
                        flex flex-col transition-all duration-300 ease-in-out py-4 rounded-tr-lg rounded-br-lg
                        ${isExpanded ? 'w-50 px-4' : 'w-16 items-center px-1'}`}
                >
                    {/* Buttons for toggling expanded/minimal and hiding */}
                    <div className={`flex ${isExpanded ? 'justify-end' : 'justify-center'} w-full items-center mb-4`}>
                        {/* Hide Button (visible only in Minimal state) */}
                        {!isExpanded && (
                            <button
                                onClick={HideSidebar}
                                className="ml-auto p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                aria-label="Hide sidebar"
                                title="Hide sidebar"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                        )}
                        {/* Main Toggle Button (Expanded <-> Minimal) */}
                        <button
                            onClick={ToggleExpandedMinimal}
                            className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                            aria-label={isExpanded ? "Collapse sidebar to minimal" : "Expand sidebar to full"}
                        >
                            {isExpanded ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Navigation using Base UI Navigation Menu */}
                    <div className="grow">
                        <NavigationMenu.Root orientation="vertical" className="w-full">
                            <NavigationMenu.List className="w-full">
                                {/* Characters */}
                                <NavigationMenu.Item>
                                    <Link
                                        className={`flex items-center w-full px-4 py-2 rounded 
                                                    text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 
                                                    ${isExpanded ? 'justify-start' : 'justify-center'}
                                                    ${location.pathname.startsWith('/characters') ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                        to="/characters"
                                    >
                                        <UserGroupIcon className={`${location.pathname.startsWith('/characters') ? 'text-blue-600 dark:text-blue-400' : ''} w-7 h-7`} />
                                        {isExpanded && <span className={`ml-3 ${location.pathname.startsWith('/characters') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Characters</span>}
                                    </Link>
                                </NavigationMenu.Item>

                                {/* Reference Section */}
                                <NavigationMenu.Item>
                                    <NavigationMenu.Trigger
                                        className={`flex items-center w-full px-4 py-2 rounded 
                                                    text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 
                                                    ${isExpanded ? 'justify-start' : 'justify-center'}
                                                    ${location.pathname.startsWith('/spells') || location.pathname.startsWith('/classes') || location.pathname.startsWith('/races') || location.pathname.startsWith('/skills') || location.pathname.startsWith('/feats') || location.pathname.startsWith('/items') || location.pathname.startsWith('/domains') || location.pathname.startsWith('/deities') || location.pathname.startsWith('/companions') || location.pathname.startsWith('/tricks') || location.pathname.startsWith('/trick-purposes') ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                    >
                                        <BookOpenIcon className={`${location.pathname.startsWith('/spells') || location.pathname.startsWith('/classes') || location.pathname.startsWith('/races') || location.pathname.startsWith('/skills') || location.pathname.startsWith('/feats') || location.pathname.startsWith('/items') || location.pathname.startsWith('/domains') || location.pathname.startsWith('/deities') || location.pathname.startsWith('/companions') || location.pathname.startsWith('/tricks') || location.pathname.startsWith('/trick-purposes') ? 'text-blue-600 dark:text-blue-400' : ''} w-7 h-7`} />
                                        {isExpanded && (
                                            <>
                                                <span className={`ml-3 ${location.pathname.startsWith('/spells') || location.pathname.startsWith('/classes') || location.pathname.startsWith('/races') || location.pathname.startsWith('/skills') || location.pathname.startsWith('/feats') || location.pathname.startsWith('/items') || location.pathname.startsWith('/domains') || location.pathname.startsWith('/deities') || location.pathname.startsWith('/companions') || location.pathname.startsWith('/tricks') || location.pathname.startsWith('/trick-purposes') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Reference</span>
                                                <ChevronDownIcon className="ml-auto w-4 h-4" />
                                            </>
                                        )}
                                    </NavigationMenu.Trigger>
                                    <NavigationMenu.Content>
                                        <CustomLink
                                            className={`flex items-center px-4 py-2 text-sm
                                                        text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600
                                                        ${location.pathname.startsWith('/spells') ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                            href="/spells"
                                        >
                                            <SparklesIcon className={`${location.pathname.startsWith('/spells') ? 'text-blue-600 dark:text-blue-400' : ''} w-4 h-4 mr-2`} />
                                            <span className={`${location.pathname.startsWith('/spells') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Spells</span>
                                        </CustomLink>
                                        <CustomLink
                                            className={`flex items-center px-4 py-2 text-sm
                                                        text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600
                                                        ${location.pathname.startsWith('/classes') ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                            href="/classes"
                                        >
                                            <AcademicCapIcon className={`${location.pathname.startsWith('/classes') ? 'text-blue-600 dark:text-blue-400' : ''} w-4 h-4 mr-2`} />
                                            <span className={`${location.pathname.startsWith('/classes') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Classes</span>
                                        </CustomLink>
                                        <CustomLink
                                            className={`flex items-center px-4 py-2 text-sm
                                                        text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600
                                                        ${location.pathname.startsWith('/races') ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                            href="/races"
                                        >
                                            <UserIcon className={`${location.pathname.startsWith('/races') ? 'text-blue-600 dark:text-blue-400' : ''} w-4 h-4 mr-2`} />
                                            <span className={`${location.pathname.startsWith('/races') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Races</span>
                                        </CustomLink>
                                        <CustomLink
                                            className={`flex items-center px-4 py-2 text-sm
                                                        text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600
                                                        ${location.pathname.startsWith('/skills') ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                            href="/skills"
                                        >
                                            <WrenchScrewdriverIcon className={`${location.pathname.startsWith('/skills') ? 'text-blue-600 dark:text-blue-400' : ''} w-4 h-4 mr-2`} />
                                            <span className={`${location.pathname.startsWith('/skills') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Skills</span>
                                        </CustomLink>
                                        <CustomLink
                                            className={`flex items-center px-4 py-2 text-sm
                                                        text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600
                                                        ${location.pathname.startsWith('/feats') ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                            href="/feats"
                                        >
                                            <StarIcon className={`${location.pathname.startsWith('/feats') ? 'text-blue-600 dark:text-blue-400' : ''} w-4 h-4 mr-2`} />
                                            <span className={`${location.pathname.startsWith('/feats') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Feats</span>
                                        </CustomLink>
                                        <CustomLink
                                            className={`flex items-center px-4 py-2 text-sm
                                                        text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600
                                                        ${location.pathname.startsWith('/items') ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                            href="/items"
                                        >
                                            <CubeIcon className={`${location.pathname.startsWith('/items') ? 'text-blue-600 dark:text-blue-400' : ''} w-4 h-4 mr-2`} />
                                            <span className={`${location.pathname.startsWith('/items') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Items</span>
                                        </CustomLink>
                                        <CustomLink
                                            className={`flex items-center px-4 py-2 text-sm
                                                        text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600
                                                        ${location.pathname.startsWith('/domains') ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                            href="/domains"
                                        >
                                            <ShieldCheckIcon className={`${location.pathname.startsWith('/domains') ? 'text-blue-600 dark:text-blue-400' : ''} w-4 h-4 mr-2`} />
                                            <span className={`${location.pathname.startsWith('/domains') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Domains</span>
                                        </CustomLink>
                                        <CustomLink
                                            className={`flex items-center px-4 py-2 text-sm
                                                        text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600
                                                        ${location.pathname.startsWith('/companions') ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                            href="/companions"
                                        >
                                            <UserGroupIcon className={`${location.pathname.startsWith('/companions') ? 'text-blue-600 dark:text-blue-400' : ''} w-4 h-4 mr-2`} />
                                            <span className={`${location.pathname.startsWith('/companions') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Companions</span>
                                        </CustomLink>
                                        <CustomLink
                                            className={`flex items-center px-4 py-2 text-sm
                                                        text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600
                                                        ${location.pathname === '/tricks' || location.pathname.startsWith('/tricks/') ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                            href="/tricks"
                                        >
                                            <SparklesIcon className={`${location.pathname === '/tricks' || location.pathname.startsWith('/tricks/') ? 'text-blue-600 dark:text-blue-400' : ''} w-4 h-4 mr-2`} />
                                            <span className={`${location.pathname === '/tricks' || location.pathname.startsWith('/tricks/') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Tricks</span>
                                        </CustomLink>
                                        <CustomLink
                                            className={`flex items-center px-4 py-2 text-sm
                                                        text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600
                                                        ${location.pathname.startsWith('/trick-purposes') ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                            href="/trick-purposes"
                                        >
                                            <SparklesIcon className={`${location.pathname.startsWith('/trick-purposes') ? 'text-blue-600 dark:text-blue-400' : ''} w-4 h-4 mr-2`} />
                                            <span className={`${location.pathname.startsWith('/trick-purposes') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Trick Purposes</span>
                                        </CustomLink>
                                        <CustomLink
                                            className={`flex items-center px-4 py-2 text-sm
                                                        text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600
                                                        ${location.pathname.startsWith('/deities') ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                            href="/deities"
                                        >
                                            <HeartIcon className={`${location.pathname.startsWith('/deities') ? 'text-blue-600 dark:text-blue-400' : ''} w-4 h-4 mr-2`} />
                                            <span className={`${location.pathname.startsWith('/deities') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Deities</span>
                                        </CustomLink>
                                    </NavigationMenu.Content>
                                </NavigationMenu.Item>

                                {/* DM Tools Section */}
                                <NavigationMenu.Item>
                                    <NavigationMenu.Trigger
                                        className={`flex items-center w-full px-4 py-2 rounded 
                                                    text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 
                                                    ${isExpanded ? 'justify-start' : 'justify-center'}
                                                    ${location.pathname.startsWith('/monsters') ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                    >
                                        <SwatchIcon className={`${location.pathname.startsWith('/monsters') ? 'text-blue-600 dark:text-blue-400' : ''} w-7 h-7`} />
                                        {isExpanded && (
                                            <>
                                                <span className={`ml-3 ${location.pathname.startsWith('/monsters') ? 'text-blue-600 dark:text-blue-400' : ''}`}>DM Tools</span>
                                                <ChevronDownIcon className="ml-auto w-4 h-4" />
                                            </>
                                        )}
                                    </NavigationMenu.Trigger>
                                    <NavigationMenu.Content>
                                        <CustomLink
                                            className={`flex items-center px-4 py-2 text-sm
                                                        text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600
                                                        ${location.pathname.startsWith('/monsters') ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                            href="/monsters"
                                        >
                                            <CubeTransparentIcon className={`${location.pathname.startsWith('/monsters') ? 'text-blue-600 dark:text-blue-400' : ''} w-4 h-4 mr-2`} />
                                            <span className={`${location.pathname.startsWith('/monsters') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Monsters</span>
                                        </CustomLink>
                                    </NavigationMenu.Content>
                                </NavigationMenu.Item>

                                {/* Admin Section */}
                                <NavigationMenu.Item>
                                    <NavigationMenu.Trigger
                                        className={`flex items-center w-full px-4 py-2 rounded 
                                                    text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 
                                                    ${isExpanded ? 'justify-start' : 'justify-center'}
                                                    ${isAdminRouteActive ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                    >
                                        <Cog6ToothIcon className={`${isAdminRouteActive ? 'text-blue-600 dark:text-blue-400' : ''} w-7 h-7`} />
                                        {isExpanded && (
                                            <>
                                                <span className={`ml-3 ${isAdminRouteActive ? 'text-blue-600 dark:text-blue-400' : ''}`}>Admin</span>
                                                <ChevronDownIcon className="ml-auto w-4 h-4" />
                                            </>
                                        )}
                                    </NavigationMenu.Trigger>
                                    <NavigationMenu.Content>
                                        <CustomLink
                                            className={`flex items-center px-4 py-2 text-sm
                                                        text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600
                                                        ${location.pathname === '/admin' ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                            href="/admin"
                                        >
                                            <ChartBarIcon className={`${location.pathname === '/admin' ? 'text-blue-600 dark:text-blue-400' : ''} w-4 h-4 mr-2`} />
                                            <span className={`${location.pathname === '/admin' ? 'text-blue-600 dark:text-blue-400' : ''}`}>Dashboard</span>
                                        </CustomLink>
                                        <CustomLink
                                            className={`flex items-center px-4 py-2 text-sm
                                                        text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600
                                                        ${location.pathname.startsWith('/features') ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                            href="/features"
                                        >
                                            <SparklesIcon className={`${location.pathname.startsWith('/features') ? 'text-blue-600 dark:text-blue-400' : ''} w-4 h-4 mr-2`} />
                                            <span className={`${location.pathname.startsWith('/features') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Features</span>
                                        </CustomLink>
                                        <CustomLink
                                            className={`flex items-center px-4 py-2 text-sm
                                                        text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600
                                                        ${location.pathname.startsWith('/admin/edition-features') ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                            href="/admin/edition-features"
                                        >
                                            <BookOpenIcon className={`${location.pathname.startsWith('/admin/edition-features') ? 'text-blue-600 dark:text-blue-400' : ''} w-4 h-4 mr-2`} />
                                            <span className={`${location.pathname.startsWith('/admin/edition-features') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Edition Features</span>
                                        </CustomLink>
                                        <CustomLink
                                            className={`flex items-center px-4 py-2 text-sm
                                                        text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600
                                                        ${location.pathname.startsWith('/admin/referencetables') ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                            href="/admin/referencetables"
                                        >
                                            <TableCellsIcon2 className={`${location.pathname.startsWith('/admin/referencetables') ? 'text-blue-600 dark:text-blue-400' : ''} w-4 h-4 mr-2`} />
                                            <span className={`${location.pathname.startsWith('/admin/referencetables') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Reference Tables</span>
                                        </CustomLink>
                                        <CustomLink
                                            className={`flex items-center px-4 py-2 text-sm
                                                        text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600
                                                        ${location.pathname.startsWith('/admin/dice-configuration') ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                            href="/admin/dice-configuration"
                                        >
                                            <CubeTransparentIcon className={`${location.pathname.startsWith('/admin/dice-configuration') ? 'text-blue-600 dark:text-blue-400' : ''} w-4 h-4 mr-2`} />
                                            <span className={`${location.pathname.startsWith('/admin/dice-configuration') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Dice Configuration</span>
                                        </CustomLink>
                                        <CustomLink
                                            className={`flex items-center px-4 py-2 text-sm
                                                        text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600
                                                        ${location.pathname.startsWith('/admin/dice-testing') ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                            href="/admin/dice-testing"
                                        >
                                            <BeakerIcon className={`${location.pathname.startsWith('/admin/dice-testing') ? 'text-blue-600 dark:text-blue-400' : ''} w-4 h-4 mr-2`} />
                                            <span className={`${location.pathname.startsWith('/admin/dice-testing') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Dice Testing</span>
                                        </CustomLink>
                                        <CustomLink
                                            className={`flex items-center px-4 py-2 text-sm
                                                        text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600
                                                        ${location.pathname.startsWith('/admin/characters') ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
                                            href="/admin/characters"
                                        >
                                            <DocumentMagnifyingGlassIcon className={`${location.pathname.startsWith('/admin/characters') ? 'text-blue-600 dark:text-blue-400' : ''} w-4 h-4 mr-2`} />
                                            <span className={`${location.pathname.startsWith('/admin/characters') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Character Explorer</span>
                                        </CustomLink>
                                    </NavigationMenu.Content>
                                </NavigationMenu.Item>
                            </NavigationMenu.List>

                            <NavigationMenu.Portal>
                                <NavigationMenu.Positioner
                                    align="start"
                                    side="right"
                                    sideOffset={5}
                                    className="border rounded-md shadow-lg py-1 bg-content border-content"
                                >
                                    <NavigationMenu.Popup>
                                        <NavigationMenu.Viewport />
                                    </NavigationMenu.Popup>
                                </NavigationMenu.Positioner>
                            </NavigationMenu.Portal>
                        </NavigationMenu.Root>
                    </div>
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
                    <ChevronRightIcon className="text-gray-800 dark:text-gray-100 w-5 h-5" />
                </button>
            )}
        </>
    );
} 
