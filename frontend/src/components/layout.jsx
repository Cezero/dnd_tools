import { Outlet } from 'react-router-dom';
import Navbar from './NavBar/navbar';

export default function Layout() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow bg-gray-100 dark:bg-[#121212]">
                <Outlet />
            </main>
        </div>
    );
}
