import React from 'react';
import { Outlet } from 'react-router-dom';

export function AdminDashboardPage(): React.JSX.Element {
    return (
        <div className="h-full">
            <Outlet />
        </div>
    );
}
