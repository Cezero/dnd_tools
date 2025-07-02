import React from 'react';
import { Outlet } from 'react-router-dom';

import { NavBar } from '@/components/navbar';

export function Layout(): React.JSX.Element {
    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-grow bg-gray-100 dark:bg-[#121212]">
                <Outlet />
            </main>
        </div>
    );
}
