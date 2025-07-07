import type { Root, Element, Element as HastElement } from 'hast';

import { visit } from 'unist-util-visit';

import { flushTableResolutionQueue } from '@/lib/TableResolution';
import { SPELL_NAME_MAP, CLASS_NAME_MAP } from '@shared/static-data';
import { RenderStructuredTable } from '@/plugins/RenderStructuredTable';


interface RehypeResolveEntitiesAndEmbedsOptions {
    tableClass?: string;
    id: string;
}

type PropsWithEntityData = {
    dataEntityType?: string;
    dataEntityValue?: string;
    dataTableSlug?: string;
    href?: string;
    className?: string | string[];
    [key: string]: any;
};

const entityTypes = {
    spell: SPELL_NAME_MAP,
    class: CLASS_NAME_MAP,
};

export function RehypeResolveEntitiesAndEmbeds(options: RehypeResolveEntitiesAndEmbedsOptions) {
    const { tableClass = 'md-table', id } = options;
    return async function transformer(tree: Root) {
        const entityLinks: Element[] = [];
        const tablePlaceholders: Element[] = [];
        visit(tree, 'element', (node: Element) => {
            const props = node.properties as PropsWithEntityData;
            if (node.tagName === 'a' && props.dataEntityType) {
                entityLinks.push(node);
            }

            if (node.tagName === 'div' && props.dataTableSlug) {
                console.log(`[RehypeResolveEntitiesAndEmbeds] tablePlaceholders - ${id}`, node);
                tablePlaceholders.push(node);
            }
        });

        // Apply resolved entity IDs to link elements
        for (const node of entityLinks) {
            const props = node.properties as PropsWithEntityData;
            const { dataEntityType: type, dataEntityValue: name } = props;

            if (type && name) {
                const id = entityTypes[type]?.[name];
                console.log(`type: ${type}, name: ${name}, id: ${id}`);
                if (id) {
                    props.href = `/${type}s/${id}`;
                    props.className = props.className
                        ? `${props.className} entity-link`
                        : 'entity-link';
                }
                delete props.dataEntityType;
                delete props.dataEntityValue;
            }
        }

        console.log(`[RehypeResolveEntitiesAndEmbeds] tablePlaceholders - 2 - ${id}`, tablePlaceholders);
        const resolvedTables = await flushTableResolutionQueue(id);
        console.log(`[RehypeResolveEntitiesAndEmbeds] resolvedTables - ${id}`, resolvedTables);
        // Replace table placeholders with rendered tables
        for (const node of tablePlaceholders) {
            const props = node.properties as PropsWithEntityData;
            const slug = props.dataTableSlug;
            console.log(`[RehypeResolveEntitiesAndEmbeds] slug - ${id}`, slug);
            if (slug) {
                const tableData = resolvedTables[slug];

                if (tableData) {
                    const tableElement: HastElement = await RenderStructuredTable(tableData, tableClass);

                    Object.assign(node, tableElement);
                } else {
                    node.tagName = 'div';
                    node.properties = { className: 'reference-table-error' };
                    node.children = [{ type: 'text', value: `[Missing table: ${slug}]` }];
                }

                delete props.dataTableSlug;
            }
        }
    }
} 