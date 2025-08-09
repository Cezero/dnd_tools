import { Element as HastElement } from "hast";

import { RenderStructuredTable } from "@/plugins/RenderStructuredTable";
import { MarkdownComponentProps } from "@/plugins/types";
import { typedApi } from "@/services/Api";
import { ReferenceTableDataResponseSchema, ReferenceTableSlugParamRequest, ReferenceTableSlugParamSchema } from "@shared/schema";


const preRenderedTableCache = new Map<string, Map<string, HastElement>>();
const preloadingPromises = new Map<string, Promise<void>>();

const getReferenceTableBySlug = typedApi<undefined, typeof ReferenceTableDataResponseSchema, typeof ReferenceTableSlugParamSchema>({
    path: '/referencetables/:slug',
    method: 'GET',
    paramsSchema: ReferenceTableSlugParamSchema,
    responseSchema: ReferenceTableDataResponseSchema,
});

const TABLE_REGEX = /[\[{]table:\s([\w-]+)[\]}]/gi;

export async function preloadTablesFromMarkdown(props: MarkdownComponentProps): Promise<void> {
    // Check if we're already preloading this ID
    const existingPromise = preloadingPromises.get(props.id);
    if (existingPromise) {
        return existingPromise;
    }

    const matches = [...props.markdown.matchAll(TABLE_REGEX)];
    const slugs = Array.from(new Set(matches.map(m => m[1])));

    if (!slugs.length) {
        return;
    }

    // Create a promise for this preloading operation
    const preloadPromise = (async () => {
        const cache = new Map<ReferenceTableSlugParamRequest['slug'], HastElement>();
        for (const slug of slugs) {
            try {
                const data = await getReferenceTableBySlug(undefined, { slug });
                const newProps = {
                    ...props,
                    tableClass: props.tableClass ?? 'md-table',
                };
                const rendered = RenderStructuredTable(data, newProps);
                cache.set(slug, rendered);
            } catch (err) {
                // You may choose to cache missing results as null or leave it out
                console.warn(`Failed to fetch reference table for slug "${slug}":`, err);
            }
        }

        preRenderedTableCache.set(props.id, cache);
    })();

    // Store the promise so other components can wait for it
    preloadingPromises.set(props.id, preloadPromise);

    try {
        await preloadPromise;
    } finally {
        // Clean up the promise reference after completion
        preloadingPromises.delete(props.id);
    }
}

export function getPreRenderedTable(slug: string, id: string): HastElement {
    // Check if we're still preloading
    const preloadingPromise = preloadingPromises.get(id);
    if (preloadingPromise) {
        throw new Error(`Reference table "${slug}" not preloaded for markdown ID "${id}" - preloading still in progress.`);
    }

    const instanceCache = preRenderedTableCache.get(id);
    if (!instanceCache) {
        throw new Error(`Reference table "${slug}" not preloaded for markdown ID "${id}".`);
    }
    if (!instanceCache.has(slug)) {
        throw new Error(`Reference table "${slug}" not preloaded for markdown ID "${id}".`);
    }
    return instanceCache.get(slug)!;
}
