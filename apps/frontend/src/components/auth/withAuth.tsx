import React, { ComponentType } from 'react';
import { UseAuth } from './AuthProvider';
import type { WithAuthProps } from './types';

// HOC that injects auth context
export function withAuth<T extends WithAuthProps>(
    Component: ComponentType<T>
): ComponentType<Omit<T, keyof WithAuthProps>> {
    const WrappedComponent = (props: Omit<T, keyof WithAuthProps>) => {
        const auth = UseAuth();
        return <Component {...(props as T)} auth={auth} />;
    };

    // Set display name for debugging
    WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;

    return WrappedComponent;
}

// Alternative: HOC that provides auth as a separate prop
export function withAuthContext<T extends object>(
    Component: ComponentType<T & { auth: ReturnType<typeof UseAuth> }>
): ComponentType<T> {
    const WrappedComponent = (props: T) => {
        const auth = UseAuth();
        return <Component {...props} auth={auth} />;
    };

    WrappedComponent.displayName = `withAuthContext(${Component.displayName || Component.name})`;

    return WrappedComponent;
} 