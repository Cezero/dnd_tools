import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { AdminSidebar } from '@/features/admin/components/AdminSidebar';

export function AdminDashboardPage(): React.JSX.Element {
    const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true); // Initial state for sidebar
    const [isSidebarHidden, setIsSidebarHidden] = useState<boolean>(false); // New state for hidden sidebar

    return (
        <div className="flex h-full bg-gray-100 dark:bg-[#121212]">
            <AdminSidebar
                isExpanded={isSidebarExpanded}
                setIsExpanded={setIsSidebarExpanded}
                isHidden={isSidebarHidden}
                setIsHidden={setIsSidebarHidden}
            />
            <div className={`fixed bottom-2 top-[40px] left-2 right-4 transition-all duration-300 ease-in-out overflow-y-auto
        ${isSidebarHidden ? 'ml-0' : (isSidebarExpanded ? 'ml-64' : 'ml-16')}`}>
                {/* The Outlet will render the matched child route component here */}
                <Outlet />
            </div>
        </div>
    );
}
