import React from 'react';

import { useAuthAuto } from '@/components/auth';
import { CacheQueryHooks } from '@/services/query/CacheQueryHooks';

// Component to handle cache prefetching
const CachePrefetcher: React.FC<{ isAuthenticated: boolean }> = ({ isAuthenticated }) => {
    // Pre-fetch all cache endpoints with staleTime: Infinity to keep them cached
    CacheQueryHooks.useClassesCache({}, {
        enabled: isAuthenticated,
        staleTime: Infinity,
        gcTime: Infinity,
    });
    CacheQueryHooks.useRacesCache({}, {
        enabled: isAuthenticated,
        staleTime: Infinity,
        gcTime: Infinity,
    });
    CacheQueryHooks.useSpellsCache({}, {
        enabled: isAuthenticated,
        staleTime: Infinity,
        gcTime: Infinity,
    });
    CacheQueryHooks.useSkillsCache({}, {
        enabled: isAuthenticated,
        staleTime: Infinity,
        gcTime: Infinity,
    });
    CacheQueryHooks.useFeatsCache({ queryType: 'all' }, {
        enabled: isAuthenticated,
        staleTime: Infinity,
        gcTime: Infinity,
    });
    CacheQueryHooks.useFeatsCache({ queryType: 'proficiency' }, {
        enabled: isAuthenticated,
        staleTime: Infinity,
        gcTime: Infinity,
    });
    CacheQueryHooks.useDeitiesCache({}, {
        enabled: isAuthenticated,
        staleTime: Infinity,
        gcTime: Infinity,
    });
    CacheQueryHooks.useDomainsCache({}, {
        enabled: isAuthenticated,
        staleTime: Infinity,
        gcTime: Infinity,
    });

    return null;
};

export const CacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuthAuto();

    return (
        <>
            <CachePrefetcher isAuthenticated={isAuthenticated} />
            {children}
        </>
    );
};
