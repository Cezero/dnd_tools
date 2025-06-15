import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './authProvider';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleRegister = async (e) => {
        e.preventDefault();
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, email }),
        });
        if (res.ok) {
            // Auto-login after registration
            const success = await login(username, password);
            if (success) navigate('/');
        } else {
            const data = await res.json();
            setError(data.message || 'Registration failed');
        }
    };

    return (
        <div className="p-4 bg-white text-black dark:bg-gray-900 dark:text-white min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Register</h1>
            <form onSubmit={handleRegister} className="space-y-4">
                <input type="text" placeholder="Username" value={username}
                    onChange={(e) => setUsername(e.target.value)} className="p-2 border rounded w-full dark:bg-gray-800" />
                <input type="password" placeholder="Password" value={password}
                    onChange={(e) => setPassword(e.target.value)} className="p-2 border rounded w-full dark:bg-gray-800" />
                <input type="email" placeholder="Email" value={email}
                    onChange={(e) => setEmail(e.target.value)} className="p-2 border rounded w-full dark:bg-gray-800" />
                {error && <p className="text-red-500">{error}</p>}
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Register</button>
            </form>
        </div>
    );
}
