import { h } from 'hastscript';
import type { Properties, Element as HastElement } from 'hast';

import { RenderMarkdownToHast } from '@/plugins/RenderMarkdownToHast';
import { ReferenceTableColumn, ReferenceTableDataResponse, ReferenceTableRow } from '@shared/schema';

interface TableColumnWithPreferredWidth extends ReferenceTableColumn {
    preferredWidth?: string;
}

function EstimatePreferredWidthsFromRows(columns: ReferenceTableColumn[], rows: ReferenceTableRow[]): TableColumnWithPreferredWidth[] {
    return columns.map(column => {
        const colId = column.index;

        // Extract content lengths for this column across all rows
        const cellLengths = rows.map(row => {
            const cell = row.cells.find(c => c.columnIndex === colId);
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

export async function RenderStructuredTable(tableData: ReferenceTableDataResponse, tableClass: string): Promise<HastElement> {
    const { columns, rows } = tableData;
    console.log('[RenderStructuredTable] tableData', tableData);
    const occupiedCells = new Set<string>(); // Stores 'rowIndex-colIndex' strings

    const columnsWithPreferredWidths = EstimatePreferredWidthsFromRows(columns, rows);
    const colgroup = h('colgroup', columnsWithPreferredWidths.map(col =>
        h('col', { key: col.index, style: { width: col.preferredWidth || 'auto' } })
    ));
    return h('table', { className: tableClass }, [
        colgroup,
        h('thead', [
            h('tr', await Promise.all(columns.map(async (hdr) => {
                const hdrHast = await RenderMarkdownToHast(hdr.header ?? '', { allowRawHtml: true });
                return h(
                    'th',
                    {
                        key: hdr.index,
                        style: { 'text-align': hdr.alignment || 'left' }
                    },
                    h('div', { style: { display: 'inline-block', maxWidth: '100%' } }, hdrHast.children)
                );
            })))
        ]),

        h('tbody', await Promise.all(rows.map(async (row, rowIndex) => {
            const currentRowCells: HastElement[] = [];
            // Assuming `headers` defines the total number of conceptual columns
            // We iterate based on the expected column count to handle spanned cells correctly
            for (let colIndex = 0; colIndex < columns.length; colIndex++) {
                const colId = columns[colIndex].index;
                if (occupiedCells.has(`${rowIndex}-${colId}`)) {
                    continue; // Skip rendering this cell as it's part of a span
                }

                // Find the cell data for the current logical column index
                // This assumes `row.cells` might not be perfectly ordered or complete
                const cellData = row.cells.find(cell => cell.columnIndex === colId);

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
            return h('tr', currentRowCells);
        })))
    ]);
}
