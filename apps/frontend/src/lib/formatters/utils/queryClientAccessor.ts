import { queryClient } from '@/providers/QueryProvider';

/**
 * Get the global QueryClient instance
 * 
 * This is the single source of truth for accessing QueryClient throughout the formatting system.
 * Formatters, labelers, and cache helpers use this function to access the QueryClient instance
 * without needing it passed as a parameter.
 * 
 * @returns The global QueryClient instance
 */
export function getQueryClient() {
    return queryClient;
}
