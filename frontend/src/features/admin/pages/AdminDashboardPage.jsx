import React, { useState } from 'react';
import AdminSidebar from '@/features/admin/components/AdminSidebar';
import { Outlet } from 'react-router-dom';

function AdminDashboardPage() {
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); // Initial state for sidebar
    const [isSidebarHidden, setIsSidebarHidden] = useState(false); // New state for hidden sidebar

    return (
        <div className="flex h-full bg-gray-100 dark:bg-[#121212]">
            <AdminSidebar
                isExpanded={isSidebarExpanded}
                setIsExpanded={setIsSidebarExpanded}
                isHidden={isSidebarHidden}
                setIsHidden={setIsSidebarHidden}
            />
            <div className={`flex-grow p-4 transition-all duration-300 ease-in-out overflow-y-auto
        ${isSidebarHidden ? 'ml-0' : (isSidebarExpanded ? 'ml-64' : 'ml-16')}`}>
                {/* The Outlet will render the matched child route component here */}
                <Outlet />
            </div>
        </div>
    );
}

export default AdminDashboardPage; 