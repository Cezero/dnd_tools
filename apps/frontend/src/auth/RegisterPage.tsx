import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UseAuth } from '@/auth/AuthProvider';

export function RegisterPage(): React.JSX.Element {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [error, setError] = useState<string>('');
    const navigate = useNavigate();
    const { Login } = UseAuth();

    const HandleRegister = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, email }),
        });
        if (res.ok) {
            // Auto-login after registration
            const success = await Login(username, password);
            if (success) navigate('/');
        } else {
            const data = await res.json();
            setError(data.message || 'Registration failed');
        }
    };

    return (
        <div className="p-4 bg-white text-black dark:bg-gray-900 dark:text-white">
            <h1 className="text-2xl font-bold mb-4">Register</h1>
            <form onSubmit={HandleRegister} className="space-y-4">
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                    className="p-2 border rounded w-full dark:bg-gray-800"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    className="p-2 border rounded w-full dark:bg-gray-800"
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    className="p-2 border rounded w-full dark:bg-gray-800"
                />
                {error && <p className="text-red-500">{error}</p>}
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Register</button>
            </form>
        </div>
    );
} 