import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';

import { useAuthAuto } from '@/components/auth';
import { CacheQueryHooks } from '@/services/query/CacheQueryHooks';

// Component to handle cache prefetching
const CachePrefetcher: React.FC<{ isAuthenticated: boolean; authLoading: boolean }> = ({ isAuthenticated, authLoading }) => {
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Wait for auth to finish loading before attempting to prefetch
        if (authLoading) {
            return;
        }

        // Only prefetch if authenticated
        if (!isAuthenticated) {
            setIsLoading(false);
            return;
        }

        // Pre-fetch all cache endpoints imperatively to ensure they all load
        const prefetchAllCaches = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Fetch all caches in parallel for faster loading
                await Promise.all([
                    queryClient.fetchQuery({
                        queryKey: ['classes-cache'],
                        queryFn: () => CacheQueryHooks.getClassesCacheQueryFn(),
                        staleTime: Infinity,
                        gcTime: Infinity,
                    }),
                    queryClient.fetchQuery({
                        queryKey: ['races-cache'],
                        queryFn: () => CacheQueryHooks.getRacesCacheQueryFn(),
                        staleTime: Infinity,
                        gcTime: Infinity,
                    }),
                    queryClient.fetchQuery({
                        queryKey: ['spells-cache'],
                        queryFn: () => CacheQueryHooks.getSpellsCacheQueryFn(),
                        staleTime: Infinity,
                        gcTime: Infinity,
                    }),
                    queryClient.fetchQuery({
                        queryKey: ['skills-cache'],
                        queryFn: () => CacheQueryHooks.getSkillsCacheQueryFn(),
                        staleTime: Infinity,
                        gcTime: Infinity,
                    }),
                    queryClient.fetchQuery({
                        queryKey: ['feats-cache'],
                        queryFn: () => CacheQueryHooks.getFeatsCacheQueryFn(),
                        staleTime: Infinity,
                        gcTime: Infinity,
                    }),
                    queryClient.fetchQuery({
                        queryKey: ['deities-cache'],
                        queryFn: () => CacheQueryHooks.getDeitiesCacheQueryFn(),
                        staleTime: Infinity,
                        gcTime: Infinity,
                    }),
                    queryClient.fetchQuery({
                        queryKey: ['domains-cache'],
                        queryFn: () => CacheQueryHooks.getDomainsCacheQueryFn(),
                        staleTime: Infinity,
                        gcTime: Infinity,
                    }),
                    queryClient.fetchQuery({
                        queryKey: ['monsters-cache'],
                        queryFn: () => CacheQueryHooks.getMonstersCacheQueryFn(),
                        staleTime: Infinity,
                        gcTime: Infinity,
                    }),
                    queryClient.fetchQuery({
                        queryKey: ['items-cache'],
                        queryFn: () => CacheQueryHooks.getItemsCacheQueryFn(),
                        staleTime: Infinity,
                        gcTime: Infinity,
                    }),
                    queryClient.fetchQuery({
                        queryKey: ['sourcebooks-cache'],
                        queryFn: () => CacheQueryHooks.getSourcebooksCacheQueryFn(),
                        staleTime: Infinity,
                        gcTime: Infinity,
                    }),
                    queryClient.fetchQuery({
                        queryKey: ['companions-cache'],
                        queryFn: () => CacheQueryHooks.getCompanionsCacheQueryFn(),
                        staleTime: Infinity,
                        gcTime: Infinity,
                    }),
                ]);

                setIsLoading(false);
            } catch (err) {
                console.error('Error prefetching caches:', err);
                setError(err instanceof Error ? err : new Error('Failed to prefetch caches'));
                setIsLoading(false);
            }
        };

        prefetchAllCaches();
    }, [isAuthenticated, authLoading, queryClient]);

    // Show loading state if needed (optional - can be removed if not needed)
    if (isLoading && isAuthenticated) {
        // Return null to not block rendering, but you could show a loading indicator here
        return null;
    }

    if (error) {
        console.error('Cache prefetch error:', error);
        // Still return null to not block rendering
        return null;
    }

    return null;
};

export const CacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading: authLoading } = useAuthAuto();

    return (
        <>
            <CachePrefetcher isAuthenticated={isAuthenticated} authLoading={authLoading} />
            {children}
        </>
    );
};
