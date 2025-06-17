import React, { useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    INSERT_TABLE_COMMAND,
    TableNode,
    TableCellNode,
    TableRowNode,
    $mergeCells,
    $unmergeCell,
    $deleteTableRowAtSelection,
    $deleteTableColumnAtSelection,
    $insertTableRowAtSelection,
    $insertTableColumnAtSelection,
    $createTableNodeWithDimensions,
} from '@lexical/table';
import { $insertNodes, $getSelection, $isRangeSelection, $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { createReferenceTable } from '@/services/referenceTableService';
import { useNavigate } from 'react-router-dom';

const editorConfig = {
    namespace: 'ReferenceTableEditor',
    theme: {
        text: {
            bold: 'font-bold',
            italic: 'italic',
        },
        table: 'w-full border-collapse border border-gray-700 dark:border-gray-700',
        tableCell: 'border border-gray-700 p-2 dark:bg-gray-800 dark:border-gray-700',
        tableRow: 'bg-gray-50',
    },
    onError(error) {
        console.error(error);
    },
    nodes: [TableNode, TableCellNode, TableRowNode],
};

function TableToolbarPlugin() {
    const [editor] = useLexicalComposerContext();

    const insertRow = (dir) => {
        editor.update(() => {
            $insertTableRowAtSelection(dir === 'below');
        });
    };

    const deleteRow = () => {
        editor.update(() => {
            $deleteTableRowAtSelection();
        });
    };

    const insertColumn = (dir) => {
        editor.update(() => {
            $insertTableColumnAtSelection(dir === 'right');
        });
    };

    const deleteColumn = () => {
        editor.update(() => {
            $deleteTableColumnAtSelection();
        });
    };

    const mergeSelectedCells = () => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $mergeCells(selection.getNodes());
            }
        });
    };

    const unmergeCell = () => {
        editor.update(() => {
            $unmergeCell();
        });
    };

    return (
        <div className="toolbar flex flex-wrap gap-2 mb-4">
            <button
                onClick={() => insertRow('above')}
                type="button"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                Insert Row Above
            </button>
            <button
                onClick={() => insertRow('below')}
                type="button"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                Insert Row Below
            </button>
            <button
                onClick={deleteRow}
                type="button"
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
                Delete Row
            </button>
            <button
                onClick={() => insertColumn('left')}
                type="button"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                Insert Column Left
            </button>
            <button
                onClick={() => insertColumn('right')}
                type="button"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                Insert Column Right
            </button>
            <button
                onClick={deleteColumn}
                type="button"
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
                Delete Column
            </button>
            <button
                onClick={mergeSelectedCells}
                type="button"
                className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            >
                Merge Cells
            </button>
            <button
                onClick={unmergeCell}
                type="button"
                className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
            >
                Unmerge Cell
            </button>
        </div>
    );
}

function NewReferenceTablePage() {
    const navigate = useNavigate();
    const [tableName, setTableName] = useState('');
    const [tableDescription, setTableDescription] = useState('');
    const [editorInstance, setEditorInstance] = useState(null);
    const [tableHtml, setTableHtml] = useState('');

    const handleEditorChange = (editorState, editor) => {
        setEditorInstance(editor);
        editorState.read(() => {
            const html = $generateHtmlFromNodes(editor, null);
            setTableHtml(html);
        });
    };

    const parseHtmlTableToJson = (htmlString) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const tableElement = doc.querySelector('table');

        if (!tableElement) {
            return [];
        }

        const rows = [];
        const domRows = Array.from(tableElement.querySelectorAll('tr'));

        domRows.forEach((domRow, rowIndex) => {
            const cells = [];
            const domCells = Array.from(domRow.querySelectorAll('th, td'));

            let currentColumnIndex = 0;
            domCells.forEach((domCell) => {
                const colSpan = parseInt(domCell.getAttribute('colspan') || '1', 10);
                const rowSpan = parseInt(domCell.getAttribute('rowspan') || '1', 10);

                while (rows[rowIndex] && rows[rowIndex][currentColumnIndex]) {
                    currentColumnIndex++;
                }

                cells.push({
                    column_index: currentColumnIndex,
                    content: domCell.innerHTML,
                    col_span: colSpan,
                    row_span: rowSpan,
                });
                currentColumnIndex += colSpan;
            });
            rows.push({ row_index: rowIndex, label: '', cells });
        });
        return rows;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const parsedTableData = parseHtmlTableToJson(tableHtml);

        const newTable = {
            name: tableName,
            description: tableDescription,
            rows: parsedTableData,
        };

        console.log('Submitting new table:', newTable);

        try {
            const response = await createReferenceTable(newTable);
            console.log('Table created successfully:', response);
            navigate('/admin/reference-tables');
        } catch (error) {
            console.error('Error creating reference table:', error);
            alert('Failed to create reference table. Check console for details.');
        }
    };

    const initialEditorState = (editor) => {
        editor.update(() => {
            const root = $getRoot();
            root.clear();
            const tableNode = $createTableNodeWithDimensions(3, 3, true);
            root.append(tableNode);
        });
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Create New Reference Table</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="tableName" className="block text-lg font-medium text-gray-700 dark:text-gray-200">Table Name:</label>
                    <input
                        type="text"
                        id="tableName"
                        value={tableName}
                        onChange={(e) => setTableName(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="tableDescription" className="block text-lg font-medium text-gray-700 dark:text-gray-200">Description:</label>
                    <textarea
                        id="tableDescription"
                        value={tableDescription}
                        onChange={(e) => setTableDescription(e.target.value)}
                        rows="3"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    ></textarea>
                </div>

                <div className="border border-gray-300 rounded-md p-4 dark:border-gray-600 dark:bg-gray-700">
                    <h2 className="text-xl font-semibold mb-2">Table Content (WYSIWYG Editor)</h2>
                    <LexicalComposer initialConfig={{ ...editorConfig, editorState: initialEditorState }}>
                        <TableToolbarPlugin />
                        <div className="editor-container relative border border-gray-400 rounded p-2 min-h-[200px] dark:border-gray-600 dark:bg-gray-900">
                            <RichTextPlugin
                                contentEditable={<ContentEditable className="editor-content outline-none" />}
                                placeholder={<div className="editor-placeholder absolute top-6 left-6 text-gray-500 pointer-events-none">Enter table content...</div>}
                            />
                            <HistoryPlugin />
                            <AutoFocusPlugin />
                            <TablePlugin />
                            <OnChangePlugin onChange={handleEditorChange} />
                        </div>
                    </LexicalComposer>
                </div>

                <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                    Create Table
                </button>
            </form>
        </div>
    );
}

export default NewReferenceTablePage;