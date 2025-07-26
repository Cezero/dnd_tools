import { typedApi } from "@/services/Api";
import { ReferenceTableDataResponseSchema, ReferenceTableSlugParamRequest, ReferenceTableSlugParamSchema } from "@shared/schema";
import { RenderStructuredTable } from "@/plugins/RenderStructuredTable";
import { Element as HastElement } from "hast";
import { MarkdownComponentProps } from "@/plugins/types";

const preRenderedTableCache = new Map<string, Map<string, HastElement>>();

const getReferenceTableBySlug = typedApi<undefined, typeof ReferenceTableDataResponseSchema, typeof ReferenceTableSlugParamSchema>({
    path: '/referencetables/:slug',
    method: 'GET',
    paramsSchema: ReferenceTableSlugParamSchema,
    responseSchema: ReferenceTableDataResponseSchema,
});

const TABLE_REGEX = /[\[{]table:\s([\w-]+)[\]}]/gi;

export async function preloadTablesFromMarkdown(props: MarkdownComponentProps): Promise<void> {
    const matches = [...props.markdown.matchAll(TABLE_REGEX)];
    const slugs = Array.from(new Set(matches.map(m => m[1])));

    if (!slugs.length) return;

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
}

export function getPreRenderedTable(slug: string, id: string): HastElement {
    const instanceCache = preRenderedTableCache.get(id);
    if (!instanceCache || !instanceCache.has(slug)) {
        throw new Error(`Reference table "${slug}" not preloaded for markdown ID "${id}".`);
    }
    return instanceCache.get(slug)!;
}
