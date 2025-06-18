import { visit } from 'unist-util-visit';
import { queueEntityResolution, flushEntityResolutionQueue } from '@/services/entityResolver';
import { queueTableResolution, flushTableResolutionQueue } from '@/services/tableResolver';
import { h } from 'hastscript';

export default function rehypeResolveEntitiesAndEmbeds() {
    return async function transformer(tree) {
        const entityLinks = [];
        const tablePlaceholders = [];
        visit(tree, 'element', (node) => {
            if (!node || typeof node !== 'object') return;
            const props = node.properties || {};
            if (node.tagName === 'a' && props.dataEntityType) {
                entityLinks.push(node);
            }

            if (node.tagName === 'div' && props.dataTableSlug) {
                tablePlaceholders.push(node);
            }
        });

        // Resolve all queued entities and tables
        const resolvedEntities = await flushEntityResolutionQueue();
        const resolvedTables = await flushTableResolutionQueue();

        // Apply resolved entity IDs to link elements
        for (const node of entityLinks) {
            const { dataEntityType: type, dataEntityValue: name } = node.properties;
            const id = resolvedEntities[type]?.[name];
            if (id) {
                node.properties.href = `/${type}s/${id}`;
            }
            delete node.properties.dataEntityType;
            delete node.properties.dataEntityValue;
        }

        // Replace table placeholders with rendered tables
        for (const node of tablePlaceholders) {
            const slug = node.properties.dataTableSlug;
            const tableData = resolvedTables[slug];

            if (tableData) {
                const tableElement = renderStructuredTable(tableData);

                node.type = tableElement.type;
                node.tagName = tableElement.tagName;
                node.properties = tableElement.properties;
                node.children = tableElement.children;
            } else {
                node.tagName = 'div';
                node.properties = { className: 'reference-table-error' };
                node.children = [{ type: 'text', value: `[Missing table: ${slug}]` }];
            }

            delete node.properties.dataTableSlug;
        }
    }
}

// Example render function for structured table data
function renderStructuredTable(tableData) {
    const { headers, rows } = tableData;

    return h('table', { className: 'reference-table' }, [
        h('thead', [
            h('tr', headers.map(hdr =>
                h('th', hdr.header)
            ))
        ]),
        h('tbody', rows.map(row =>
            h('tr', row.cells.map(cell =>
                h('td', {
                    colSpan: cell.col_span || 1,
                    rowSpan: cell.row_span || 1
                }, cell.value)
            ))
        ))
    ]);
}
