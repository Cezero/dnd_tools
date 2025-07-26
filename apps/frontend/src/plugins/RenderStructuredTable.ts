import { h } from 'hastscript';
import type { Properties, Element as HastElement } from 'hast';

import { ReferenceTableColumn, ReferenceTableDataResponse, ReferenceTableRow } from '@shared/schema';
import { compileMarkdownToHastNoTables } from './compileMarkdownToHastNoTables';
import { MarkdownComponentProps } from './types';

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

export function RenderStructuredTable(tableData: ReferenceTableDataResponse, props: MarkdownComponentProps): HastElement {
    const { columns, rows } = tableData;
    const occupiedCells = new Set<string>(); // Stores 'rowIndex-colIndex' strings

    const columnsWithPreferredWidths = EstimatePreferredWidthsFromRows(columns, rows);
    const colgroup = h('colgroup', columnsWithPreferredWidths.map(col =>
        h('col', { key: col.index, style: { width: col.preferredWidth || 'auto' } })
    ));
    const theadRows = [
        h('tr', columns.map((hdr) => {
            const hdrHast = compileMarkdownToHastNoTables({markdown: hdr.header ?? '', id: `table-${hdr.tableSlug}-${hdr.index}`});
            return h(
                'th',
                {
                    key: hdr.index,
                    style: { 'text-align': hdr.alignment || 'left' }
                },
                h('div', { style: { display: 'inline-block', maxWidth: '100%' } }, hdrHast.children)
            );
        })),
    ];

    const tbodyRows = rows.map((row, rowIndex) => {
        const currentRowCells: HastElement[] = [];

        for (let colIndex = 0; colIndex < columns.length; colIndex++) {
            const colId = columns[colIndex].index;
            if (occupiedCells.has(`${rowIndex}-${colId}`)) {
                continue;
            }

            const cellData = row.cells.find(cell => cell.columnIndex === colId);

            const value = cellData ? (cellData.value ?? '') : '';
            const colSpan = cellData ? (cellData.colSpan || 1) : 1;
            const rowSpan = cellData ? (cellData.rowSpan || 1) : 1;

            for (let r = 0; r < rowSpan; r++) {
                for (let c = 0; c < colSpan; c++) {
                    occupiedCells.add(`${rowIndex + r}-${colId + c}`);
                }
            }

            // eslint-disable-next-line no-useless-escape
            const cell_len = value.replace(/[*_\[\]\(\)`~^]/g, '').length;

            const hast = compileMarkdownToHastNoTables({markdown: value, id: `table-${row.tableSlug}-${rowIndex}-${colId}`});

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
    });

    return h('table', { className: props.tableClass }, [
        colgroup,
        h('thead', theadRows),
        h('tbody', tbodyRows),
    ]);
}
