import React, { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import { Api } from '@/services/Api';
import { UserProfileService } from '@/services/UserProfileService';

interface User {
    id: number;
    username: string;
    email: string;
    is_admin: boolean;
    preferred_edition_id?: number;
}

interface AuthContextType {
    user: User | null;
    Login: (username: string, password: string) => Promise<boolean>;
    Logout: () => void;
    isLoading: boolean;
    UpdatePreferredEdition: (editionId: number) => Promise<boolean>;
}

const authContext = createContext<AuthContextType | undefined>(undefined);

export function UseAuth(): AuthContextType {
    const context = useContext(authContext);
    if (context === undefined) {
        throw new Error('UseAuth must be used within an AuthProvider');
    }
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const refreshTokenTimeoutRef = useRef<number | null>(null);
    const refreshTokenRef = useRef<(() => Promise<void>) | undefined>(undefined);

    const GetJwtExpiration = (token: string): number | null => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload).exp;
        } catch (error) {
            console.error('Error decoding JWT:', error);
            return null;
        }
    };

    const ScheduleRefreshToken = useCallback((token: string): void => {
        if (refreshTokenTimeoutRef.current) {
            clearTimeout(refreshTokenTimeoutRef.current);
        }

        const exp = GetJwtExpiration(token);
        if (!exp) {
            return;
        }

        const now = Date.now() / 1000;
        const refreshThreshold = 10 * 60; // Refresh 10 minutes before expiration
        const timeUntilExpiration = exp - now;

        if (timeUntilExpiration > refreshThreshold) {
            refreshTokenTimeoutRef.current = setTimeout(refreshTokenRef.current, (timeUntilExpiration - refreshThreshold) * 1000);
            console.log(`Token refresh scheduled in ${(timeUntilExpiration - refreshThreshold).toFixed(0)} seconds.`);
        } else if (timeUntilExpiration > 0) {
            console.log('Token is nearing expiration, refreshing now.');
            refreshTokenRef.current();
        } else {
            console.log('Token already expired, logging out.');
            Logout();
        }
    }, []);

    const RefreshToken = useCallback(async (): Promise<void> => {
        const token = localStorage.getItem('token');
        if (!token) {
            setUser(null);
            return;
        }

        try {
            const res = await fetch('/api/auth/refresh-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.token);
                ScheduleRefreshToken(data.token);
            } else {
                console.warn('Token refresh failed. User might need to re-login.');
                Logout();
            }
        } catch (error) {
            console.error('Error refreshing token:', error);
            Logout();
        }
    }, [ScheduleRefreshToken]);

    // Set the ref after RefreshToken is defined
    refreshTokenRef.current = RefreshToken;

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            Api('/auth/me')
                .then((data: { user: User }) => {
                    setUser(data.user);
                    ScheduleRefreshToken(token);
                })
                .catch(error => {
                    console.warn('Could not fetch user info from token:', error);
                    setUser(null);
                    localStorage.removeItem('token');
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }

        return () => {
            if (refreshTokenTimeoutRef.current) {
                clearTimeout(refreshTokenTimeoutRef.current);
            }
        };
    }, [ScheduleRefreshToken]);

    const Login = async (username: string, password: string): Promise<boolean> => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('token', data.token);
            setUser(data.user);
            ScheduleRefreshToken(data.token);
            return true;
        }
        return false;
    };

    const Logout = (): void => {
        localStorage.removeItem('token');
        setUser(null);
        if (refreshTokenTimeoutRef.current) {
            clearTimeout(refreshTokenTimeoutRef.current);
        }
    };

    const UpdatePreferredEdition = async (editionId: number): Promise<boolean> => {
        try {
            const responseData = await UserProfileService.updateUserProfile({ preferred_edition_id: editionId });
            console.log('Response data from updateUserProfile:', responseData);
            const token = responseData.token;
            const user = responseData.user;

            if (token) {
                localStorage.setItem('token', token);
                setUser(user);
                ScheduleRefreshToken(token);
                return true;
            } else {
                console.error('No token received after updating preferred edition.', responseData);
                Logout();
                return false;
            }
        } catch (error) {
            console.error('Error updating preferred edition:', error);
            return false;
        }
    };

    return (
        <authContext.Provider value={{ user, Login, Logout, isLoading, UpdatePreferredEdition }}>
            {children}
        </authContext.Provider>
    );
} 