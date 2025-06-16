import React, { useState } from 'react';
import AdminSidebar from '@/features/admin/components/AdminSidebar';
import { Outlet } from 'react-router-dom';

function AdminDashboardPage() {
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); // Initial state for sidebar
    const [isSidebarHidden, setIsSidebarHidden] = useState(false); // New state for hidden sidebar

    return (
        <div className="flex h-full bg-gray-100 dark:bg-gray-900">
            <AdminSidebar
                isExpanded={isSidebarExpanded}
                setIsExpanded={setIsSidebarExpanded}
                isHidden={isSidebarHidden}
                setIsHidden={setIsSidebarHidden}
            />
            <div className={`flex-grow p-4 transition-all duration-300 ease-in-out overflow-y-auto
        ${isSidebarHidden ? 'ml-0' : (isSidebarExpanded ? 'ml-64' : 'ml-16')}`}>
                <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-gray-700 dark:text-gray-300">This page will display various administrative statistics and tools.</p>
                {/* Placeholder for statistics or main admin content */}
                <Outlet /> {/* Renders nested routes, e.g., ReferenceTablesPage */}
            </div>
        </div>
    );
}

export default AdminDashboardPage; 