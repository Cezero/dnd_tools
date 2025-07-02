import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UseAuth } from './AuthProvider';
import { AuthService } from '@/services/AuthService';
import { RegisterUserSchema } from '@shared/schema';
import { z } from 'zod';
import type { RegisterPageProps } from './types';

export function RegisterPage({ redirectTo = '/' }: RegisterPageProps = {}): React.JSX.Element {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [error, setError] = useState<string>('');
    const navigate = useNavigate();
    const { Login } = UseAuth();

    const HandleRegister = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        try {
            // Validate input with Zod
            const registerData = RegisterUserSchema.parse({ username, password, email });

            const responseData = await AuthService.register(registerData);

            // Auto-login after registration
            const success = await Login(username, password);
            if (success) navigate('/');
        } catch (error) {
            if (error instanceof z.ZodError) {
                setError(error.errors[0]?.message || 'Validation failed');
            } else {
                setError('Registration failed');
            }
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