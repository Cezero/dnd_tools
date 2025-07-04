import { typedApi } from "@/services/Api";
import { ReferenceTableDataResponse, ReferenceTableDataResponseSchema, ReferenceTableSlugParamRequest, ReferenceTableSlugParamSchema } from "@shared/schema";

type Timeout = ReturnType<typeof setTimeout>;

// Get class by ID with path parameter
const getReferenceTableBySlug = typedApi<undefined, typeof ReferenceTableDataResponseSchema, typeof ReferenceTableSlugParamSchema>({
    path: '/reference-tables/:slug',
    method: 'GET',
    paramsSchema: ReferenceTableSlugParamSchema,
    responseSchema: ReferenceTableDataResponseSchema,
});

const unresolvedSlugs = new Set<ReferenceTableSlugParamRequest['slug']>();
const resolvedTables = new Map<ReferenceTableSlugParamRequest['slug'], ReferenceTableDataResponse>();

let pendingResolvers: { slug: ReferenceTableSlugParamRequest['slug']; resolve: (value: ReferenceTableDataResponse) => void }[] = [];
let timeout: Timeout | null = null;
let resolveTimeoutPromise: (() => void) | null = null;

const allRequestedSlugsInCurrentFlush = new Set<ReferenceTableSlugParamRequest['slug']>();

export function queueTableResolution(slug: ReferenceTableSlugParamRequest['slug']): Promise<ReferenceTableDataResponse> {
    allRequestedSlugsInCurrentFlush.add(slug);

    return new Promise((resolve) => {
        if (resolvedTables.has(slug)) {
            return resolve(resolvedTables.get(slug));
        }

        pendingResolvers.push({ slug, resolve });
        unresolvedSlugs.add(slug);

        if (!timeout) {
            timeout = setTimeout(async () => {
                const response: ReferenceTableDataResponse = await getReferenceTableBySlug(undefined, { slug });

                resolvedTables.set(slug, response);

                for (const { slug, resolve } of pendingResolvers) {
                    resolve(resolvedTables.get(slug));
                }

                pendingResolvers = [];
                unresolvedSlugs.clear();
                timeout = null;
                if (resolveTimeoutPromise) {
                    resolveTimeoutPromise();
                    resolveTimeoutPromise = null;
                }
            }, 50); // You can lower the delay since it's only one entity type now
        }
    });
}

export async function flushTableResolutionQueue(): Promise<Record<ReferenceTableSlugParamRequest['slug'], ReferenceTableDataResponse>> {
    if (timeout) {
        await new Promise<void>((resolve) => {
            resolveTimeoutPromise = resolve;
        });
    }

    const result: Record<ReferenceTableSlugParamRequest['slug'], ReferenceTableDataResponse> = {};
    const slugsToReturn = Array.from(allRequestedSlugsInCurrentFlush);
    allRequestedSlugsInCurrentFlush.clear();

    for (const slug of slugsToReturn) {
        result[slug] = resolvedTables.get(slug);
    }

    return result;
}
