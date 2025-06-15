import { Navigate } from 'react-router-dom';
import { useAuth } from './authProvider';

export default function RequireAuth({ children }) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="p-4 text-black dark:text-white">Loading authentication...</div>;
    }

    return user ? children : <Navigate to="/login" replace />;
}
