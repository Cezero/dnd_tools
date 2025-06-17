import { createContext, useContext, useEffect, useState, useRef } from 'react';
import api from '@/services/api';
import userProfileService from '@/services/userProfileService';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const refreshTokenTimeoutRef = useRef();

    const getJwtExpiration = (token) => {
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

    const refreshToken = async () => {
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
                scheduleRefreshToken(data.token);
            } else {
                console.warn('Token refresh failed. User might need to re-login.');
                logout();
            }
        } catch (error) {
            console.error('Error refreshing token:', error);
            logout();
        }
    };

    const scheduleRefreshToken = (token) => {
        if (refreshTokenTimeoutRef.current) {
            clearTimeout(refreshTokenTimeoutRef.current);
        }

        const exp = getJwtExpiration(token);
        if (!exp) {
            return;
        }

        const now = Date.now() / 1000;
        const refreshThreshold = 10 * 60; // Refresh 10 minutes before expiration
        const timeUntilExpiration = exp - now;

        if (timeUntilExpiration > refreshThreshold) {
            refreshTokenTimeoutRef.current = setTimeout(refreshToken, (timeUntilExpiration - refreshThreshold) * 1000);
            console.log(`Token refresh scheduled in ${(timeUntilExpiration - refreshThreshold).toFixed(0)} seconds.`);
        } else if (timeUntilExpiration > 0) {
            console.log('Token is nearing expiration, refreshing now.');
            refreshToken();
        } else {
            console.log('Token already expired, logging out.');
            logout();
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api('/auth/me')
                .then(data => {
                    setUser(data.user);
                    scheduleRefreshToken(token);
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
    }, []);

    const login = async (username, password) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('token', data.token);
            setUser(data.user);
            scheduleRefreshToken(data.token);
            return true;
        }
        return false;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        if (refreshTokenTimeoutRef.current) {
            clearTimeout(refreshTokenTimeoutRef.current);
        }
    };

    const updatePreferredEdition = async (editionId) => {
        try {
            const responseData = await userProfileService.updateUserProfile({ preferred_edition_id: editionId });
            console.log('Response data from updateUserProfile:', responseData);
            const token = responseData.token;
            const user = responseData.user;

            if (token) {
                localStorage.setItem('token', token);
                setUser(user);
                scheduleRefreshToken(token);
                return true;
            } else {
                console.error('No token received after updating preferred edition.', responseData);
                logout();
                return false;
            }
        } catch (error) {
            console.error('Error updating preferred edition:', error);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading, updatePreferredEdition }}>
            {children}
        </AuthContext.Provider>
    );
}
