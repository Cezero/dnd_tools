import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UseAuth } from './AuthProvider';
import { LoginUserSchema } from '@shared/schema';
import { z } from 'zod';
import type { LoginPageProps } from './types';

export function LoginPage({ redirectTo = '/' }: LoginPageProps = {}): React.JSX.Element {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const auth = UseAuth();
    const navigate = useNavigate();

    const HandleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        try {
            // Validate input with Zod
            const loginData = LoginUserSchema.parse({ username, password });
            const success = await auth.Login(loginData.username, loginData.password);
            if (success) navigate('/');
            else setError('Invalid credentials');
        } catch (error) {
            if (error instanceof z.ZodError) {
                setError(error.errors[0]?.message || 'Validation failed');
            } else {
                setError('Login failed');
            }
        }
    };

    return (
        <div className="p-4 bg-white text-black dark:bg-gray-900 dark:text-white">
            <h1 className="text-2xl font-bold mb-4">Login</h1>
            <form onSubmit={HandleSubmit} className="space-y-4">
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
                {error && <p className="text-red-500">{error}</p>}
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Login</button>
            </form>
            <p className="text-sm mt-4">Don&apos;t have an account? <Link to="/register" className="text-blue-500 hover:underline">Register</Link></p>
        </div>
    );
} 