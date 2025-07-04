import type { Root, Element, Properties } from 'hast';
import { h } from 'hastscript';
import { visit } from 'unist-util-visit';

import { flushTableResolutionQueue } from '@/lib/TableResolution';
import { RenderMarkdownToHast } from '@/plugins/RenderMarkdownToHast';
import { ReferenceTableColumn, ReferenceTableDataResponse, ReferenceTableRowsWithCells } from '@shared/schema';
import { SPELL_NAME_MAP, CLASS_NAME_MAP } from '@shared/static-data';

interface RehypeResolveEntitiesAndEmbedsOptions {
    tableClass?: string;
}

interface TableColumnWithPreferredWidth extends ReferenceTableColumn {
    preferredWidth?: string;
}

function EstimatePreferredWidthsFromRows(columns: ReferenceTableColumn[], rows: ReferenceTableRowsWithCells[]): TableColumnWithPreferredWidth[] {
    return columns.map(column => {
        const colId = column.id;

        // Extract content lengths for this column across all rows
        const cellLengths = rows.map(row => {
            const cell = row.cells.find(c => c.columnId === colId);
            if (!cell || !cell.value || (cell.colSpan && cell.colSpan > 1)) return 0;
            // eslint-disable-next-line no-useless-escape
            const plain = cell.value.replace(/[*_\[\]\(\)`~^]/g, ''); // Strip basic markdown
            return plain.length;
        });

        const maxLength = Math.min(Math.max(...cellLengths), 80);

        return {
            ...column,
            preferredWidth: `${maxLength}ch`,
        };
    });
}

// Example render function for structured table data
export async function RenderStructuredTable(tableData: ReferenceTableDataResponse, tableClass: string): Promise<Element> {
    const { columns, rows } = tableData;
    const occupiedCells = new Set<string>(); // Stores 'rowIndex-colIndex' strings

    const columnsWithPreferredWidths = EstimatePreferredWidthsFromRows(columns, rows);
    const colgroup = h('colgroup', columnsWithPreferredWidths.map(col =>
        h('col', { key: col.columnIndex, style: { width: col.preferredWidth || 'auto' } })
    ));
    return h('table', { className: tableClass }, [
        colgroup,
        h('thead', [
            h('tr', await Promise.all(columns.map(async (hdr) => {
                const hdrHast = await RenderMarkdownToHast(hdr.header ?? '', { allowRawHtml: true });
                return h(
                    'th',
                    {
                        key: hdr.columnIndex,
                        style: { 'text-align': hdr.alignment || 'left' }
                    },
                    h('div', { style: { display: 'inline-block', maxWidth: '100%' } }, hdrHast.children)
                );
            })))
        ]),

        h('tbody', await Promise.all(rows.map(async (row, rowIndex) => {
            const currentRowCells: Element[] = [];
            // Assuming `headers` defines the total number of conceptual columns
            // We iterate based on the expected column count to handle spanned cells correctly
            for (let colIndex = 0; colIndex < columns.length; colIndex++) {
                const colId = columns[colIndex].id;
                if (occupiedCells.has(`${rowIndex}-${colId}`)) {
                    continue; // Skip rendering this cell as it's part of a span
                }

                // Find the cell data for the current logical column index
                // This assumes `row.cells` might not be perfectly ordered or complete
                const cellData = row.cells.find(cell => cell.columnId === colId);

                const value = cellData ? (cellData.value ?? '') : '';
                const colSpan = cellData ? (cellData.colSpan || 1) : 1;
                const rowSpan = cellData ? (cellData.rowSpan || 1) : 1;

                // Mark all cells covered by this span as occupied for future iterations
                for (let r = 0; r < rowSpan; r++) {
                    for (let c = 0; c < colSpan; c++) {
                        occupiedCells.add(`${rowIndex + r}-${colId + c}`);
                    }
                }

                // eslint-disable-next-line no-useless-escape
                const cell_len = value.replace(/[*_\[\]\(\)`~^]/g, '').length;

                const hast = await RenderMarkdownToHast(value, { allowRawHtml: true });

                const styleInfo = {
                    'text-align': columns[colIndex]?.alignment || 'left',
                    'white-space': cell_len > 80 ? 'normal' : 'nowrap'
                };

                const tdProperties: Properties = {
                    key: `${rowIndex}-${colId}`,
                    style: styleInfo as unknown as Properties['style'],
                    colSpan: colSpan > 1 ? colSpan : undefined,
                    rowSpan: rowSpan > 1 ? rowSpan : undefined,
                };

                currentRowCells.push(
                    h('td', tdProperties, hast.children)
                );
            }
            return h('tr', { key: rowIndex }, currentRowCells);
        })))
    ]);
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

export function RehypeResolveEntitiesAndEmbeds(options: RehypeResolveEntitiesAndEmbedsOptions = {}) {
    const { tableClass = 'md-table' } = options;
    return async function transformer(tree: Root) {
        const entityLinks: Element[] = [];
        const tablePlaceholders: Element[] = [];
        visit(tree, 'element', (node: Element) => {
            const props = node.properties as PropsWithEntityData;
            if (node.tagName === 'a' && props.dataEntityType) {
                entityLinks.push(node);
            }

            if (node.tagName === 'div' && props.dataTableSlug) {
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

        const resolvedTables = await flushTableResolutionQueue();
        // Replace table placeholders with rendered tables
        for (const node of tablePlaceholders) {
            const props = node.properties as PropsWithEntityData;
            const slug = props.dataTableSlug;
            if (slug) {
                const tableData = resolvedTables.referencetable?.[slug];

                if (tableData) {
                    const tableElement = await RenderStructuredTable(tableData, tableClass);

                    node.type = tableElement.type;
                    node.tagName = tableElement.tagName;
                    node.properties = tableElement.properties;
                    node.children = tableElement.children;
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