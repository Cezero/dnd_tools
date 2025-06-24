import { visit } from 'unist-util-visit';
import { flushEntityResolutionQueue } from '@/services/entityResolver';
import { h } from 'hastscript';
import { renderMarkdownToHast } from '@/plugins/renderMarkdownToHast';

export default function rehypeResolveEntitiesAndEmbeds(options = {}) {
    const { tableClass = 'md-table' } = options;
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
        const resolvedData = await flushEntityResolutionQueue();

        // Apply resolved entity IDs to link elements
        for (const node of entityLinks) {
            const { dataEntityType: type, dataEntityValue: name } = node.properties;
            const id = resolvedData[type]?.[name];
            if (id) {
                node.properties.href = `/${type}s/${id}`;
                node.properties.className = node.properties.className
                    ? `${node.properties.className} entity-link`
                    : 'entity-link';
            }
            delete node.properties.dataEntityType;
            delete node.properties.dataEntityValue;
        }

        // Replace table placeholders with rendered tables
        for (const node of tablePlaceholders) {
            const slug = node.properties.dataTableSlug;
            const tableData = resolvedData.referencetable?.[slug];

            if (tableData) {
                const tableElement = await renderStructuredTable(tableData, tableClass);

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

function estimatePreferredWidthsFromRows(headers, rows) {
    return headers.map(header => {
      const colId = header.id;
  
      // Extract content lengths for this column across all rows
      const cellLengths = rows.map(row => {
        const cell = row.cells.find(c => c.column_id === colId);
        if (!cell || !cell.value || cell.col_span > 1) return 0;
        const plain = cell.value.replace(/[*_\[\]\(\)`~^]/g, ''); // Strip basic markdown
        return plain.length;
      });
  
      const maxLength = Math.min(Math.max(...cellLengths), 80);
  
      return {
        ...header,
        preferredWidth: `${maxLength}ch`,
      };
    });
  }
  

// Example render function for structured table data
export async function renderStructuredTable(tableData, tableClass) {
    const { headers, rows } = tableData;
    const occupiedCells = new Set(); // Stores 'rowIndex-colIndex' strings

    const headersWithPreferredWidths = estimatePreferredWidthsFromRows(headers, rows);
    const colgroup = h('colgroup', headersWithPreferredWidths.map(hdr =>
        h('col', { key: hdr.column_index, style: { width: hdr.preferredWidth || 'auto' } })
    ));
    return h('table', { className: tableClass }, [
        colgroup,
        h('thead', [
            h('tr', await Promise.all(headers.map(async (hdr) => {
                const hdrHast = await renderMarkdownToHast(hdr.header ?? '', { allowRawHtml: true });
                return h(
                    'th',
                    {
                        key: hdr.column_index,
                        style: { 'text-align': hdr.alignment || 'left' }
                    },
                    h('div', { style: { display: 'inline-block', maxWidth: '100%' } }, hdrHast.children)
                );
            })))
        ]),
        
        h('tbody', await Promise.all(rows.map(async (row, rowIndex) => {
            const currentRowCells = [];
            // Assuming `headers` defines the total number of conceptual columns
            // We iterate based on the expected column count to handle spanned cells correctly
            for (let colIndex = 0; colIndex < headers.length; colIndex++) {
                const colId = headers[colIndex].id;
                if (occupiedCells.has(`${rowIndex}-${colId}`)) {
                    continue; // Skip rendering this cell as it's part of a span
                }

                // Find the cell data for the current logical column index
                // This assumes `row.cells` might not be perfectly ordered or complete
                const cellData = row.cells.find(cell => cell.column_id === colId);

                const value = cellData ? (cellData.value ?? '') : '';
                const colSpan = cellData ? (cellData.col_span || 1) : 1;
                const rowSpan = cellData ? (cellData.row_span || 1) : 1;

                // Mark all cells covered by this span as occupied for future iterations
                for (let r = 0; r < rowSpan; r++) {
                    for (let c = 0; c < colSpan; c++) {
                        occupiedCells.add(`${rowIndex + r}-${colId + c}`);
                    }
                }

                const cell_len = value.replace(/[*_\[\]\(\)`~^]/g, '').length;

                const hast = await renderMarkdownToHast(value, { allowRawHtml: true });

                currentRowCells.push(
                    h('td', {
                        key: `${rowIndex}-${colId}`,
                        style: {
                            'text-align': headers[colIndex]?.alignment || 'left',
                            'white-space': cell_len > 80 ? 'normal' : 'nowrap'
                        },
                        ...(colSpan > 1 && { colSpan: colSpan }),
                        ...(rowSpan > 1 && { rowSpan: rowSpan })
                    }, hast.children)
                );
            }
            return h('tr', { key: rowIndex }, currentRowCells);
        })))
    ]);
}
