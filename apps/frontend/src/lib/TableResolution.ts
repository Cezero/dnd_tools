import { typedApi } from "@/services/Api";
import { ReferenceTableDataResponse, ReferenceTableDataResponseSchema, ReferenceTableSlugParamRequest, ReferenceTableSlugParamSchema } from "@shared/schema";

type Timeout = ReturnType<typeof setTimeout>;

// Get class by ID with path parameter
const getReferenceTableBySlug = typedApi<undefined, typeof ReferenceTableDataResponseSchema, typeof ReferenceTableSlugParamSchema>({
    path: '/referencetables/:slug',
    method: 'GET',
    paramsSchema: ReferenceTableSlugParamSchema,
    responseSchema: ReferenceTableDataResponseSchema,
});

// Instance-specific state
const instanceStates = new Map<string, {
    unresolvedSlugs: Set<ReferenceTableSlugParamRequest['slug']>;
    resolvedTables: Map<ReferenceTableSlugParamRequest['slug'], ReferenceTableDataResponse>;
    pendingResolvers: { slug: ReferenceTableSlugParamRequest['slug']; resolve: (value: ReferenceTableDataResponse) => void }[];
    timeout: Timeout | null;
    resolveTimeoutPromise: (() => void) | null;
    allRequestedSlugsInCurrentFlush: Set<ReferenceTableSlugParamRequest['slug']>;
}>();

function getInstanceState(id: string) {
    if (!instanceStates.has(id)) {
        instanceStates.set(id, {
            unresolvedSlugs: new Set(),
            resolvedTables: new Map(),
            pendingResolvers: [],
            timeout: null,
            resolveTimeoutPromise: null,
            allRequestedSlugsInCurrentFlush: new Set(),
        });
    }
    return instanceStates.get(id)!;
}

export function queueTableResolution(slug: ReferenceTableSlugParamRequest['slug'], id: string): Promise<ReferenceTableDataResponse> {
    const state = getInstanceState(id);
    state.allRequestedSlugsInCurrentFlush.add(slug);

    return new Promise((resolve) => {
        if (state.resolvedTables.has(slug)) {
            return resolve(state.resolvedTables.get(slug)!);
        }

        state.pendingResolvers.push({ slug, resolve });
        state.unresolvedSlugs.add(slug);

        if (!state.timeout) {
            state.timeout = setTimeout(async () => {
                // Resolve all queued slugs for this instance
                for (const queuedSlug of state.unresolvedSlugs) {
                    const response: ReferenceTableDataResponse = await getReferenceTableBySlug(undefined, { slug: queuedSlug });
                    state.resolvedTables.set(queuedSlug, response);
                }

                // Resolve all pending promises for this instance
                for (const { slug, resolve } of state.pendingResolvers) {
                    resolve(state.resolvedTables.get(slug)!);
                }

                state.pendingResolvers = [];
                state.unresolvedSlugs.clear();
                state.timeout = null;
                if (state.resolveTimeoutPromise) {
                    state.resolveTimeoutPromise();
                    state.resolveTimeoutPromise = null;
                }
            }, 50);
        }
    });
}

export async function flushTableResolutionQueue(id: string): Promise<Record<ReferenceTableSlugParamRequest['slug'], ReferenceTableDataResponse>> {
    const state = getInstanceState(id);

    if (state.timeout) {
        await new Promise<void>((resolve) => {
            state.resolveTimeoutPromise = resolve;
        });
    }

    const result: Record<ReferenceTableSlugParamRequest['slug'], ReferenceTableDataResponse> = {};
    const slugsToReturn = Array.from(state.allRequestedSlugsInCurrentFlush);
    state.allRequestedSlugsInCurrentFlush.clear();

    for (const slug of slugsToReturn) {
        result[slug] = state.resolvedTables.get(slug)!;
    }

    // Clear the resolved tables for this instance so they get re-fetched on next request
    state.resolvedTables.clear();

    return result;
}
