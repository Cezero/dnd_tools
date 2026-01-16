import { ColumnDef } from '@tanstack/react-table';
import React, { useEffect, useState } from 'react';

import { createContainsFilter, createEqualsFilter, createArrayIdFilter } from '@/components/generic-list/filterFunctions';
import { useCacheFunctions, getSourceDisplay, getSourceBooksByType } from '@/services/cache';
import { RaceSummary } from '@shared/schema';
import {
    EDITION_LIST,
    SIZE_LIST,
    EDITION_MAP,
    SIZE_MAP,
    FilterType,
    SourceType,
    EditionId,
    BOOLEAN_FILTER_LIST,
    BooleanFilter
} from '@shared/static-data';

interface AsyncClassNameProps {
    classId: number;
}

function AsyncClassName({ classId }: AsyncClassNameProps): React.JSX.Element {
    const { getClassSummaryById } = useCacheFunctions();
    const [display, setDisplay] = useState<string>(`Class ${classId}`);

    useEffect(() => {
        const loadClassName = async () => {
            try {
                const classItem = getClassSummaryById(classId);
                if (classItem) {
                    setDisplay(classItem.name);
                } else {
                    setDisplay(`Class ${classId}`);
                }
            } catch {
                setDisplay(`Class ${classId}`);
            }
        };

        loadClassName();
    }, [classId, getClassSummaryById]);

    return React.createElement('span', null, display);
}


export const useRaceColumns = (): ColumnDef<RaceSummary, unknown>[] => {
    const { getBaseClassSelectByEdition } = useCacheFunctions();
    return [
        {
            accessorKey: 'name',
            header: 'Name',
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 150,
            filterFn: createContainsFilter<RaceSummary>(),
            meta: {
                required: true,
                filterType: FilterType.TEXT_INPUT,
                placeholder: 'Filter by name...'
            },
        },
        {
            accessorKey: 'editionId',
            header: 'Edition',
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 100,
            filterFn: createArrayIdFilter<RaceSummary>('editionId'),
            cell: info => {
                const editionId = info.getValue() as number;
                return EDITION_MAP[editionId]?.abbreviation || '';
            },
            meta: {
                filterType: FilterType.MULTI_SELECT,
                options: EDITION_LIST,
            },
        },
        {
            accessorKey: 'sourceBookInfo',
            header: 'Source',
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 150,
            filterFn: createArrayIdFilter<RaceSummary>('sourceBookId'),
            cell: info => {
                const sourceBookInfo = info.getValue() as { sourceBookId: number; pageNumber: number }[];
                if (sourceBookInfo && sourceBookInfo.length > 0) {
                    return getSourceDisplay(sourceBookInfo, true);
                }
                return '';
            },
            meta: {
                filterType: FilterType.MULTI_SELECT,
                options: (currentFilters: Array<{ id: string; value: unknown }>) => {
                    const editionFilter = currentFilters.find(f => f.id === 'editionId');
                    const editionId = editionFilter?.value as EditionId;
                    return getSourceBooksByType(SourceType.Races, editionId);
                },
            },
        },
        {
            accessorKey: 'isVisible',
            header: 'Display',
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 100,
            filterFn: (row, columnId, filterValue) => {
                const isVisible = row.getValue(columnId) as boolean;
                if (filterValue === BooleanFilter.TRUE) {
                    return isVisible;
                } else if (filterValue === BooleanFilter.FALSE) {
                    return !isVisible;
                }
                return true;
            },
            cell: info => {
                const isVisible = info.getValue() as boolean;
                return isVisible ? 'Yes' : 'No';
            },
            meta: {
                filterType: FilterType.SINGLE_SELECT,
                options: BOOLEAN_FILTER_LIST
            },
        },
        {
            accessorKey: 'description',
            header: 'Description',
            enableResizing: true,
            size: 200,
            meta: {
                truncate: 200,
                isMarkdown: true,
            },
        },
        {
            accessorKey: 'sizeId',
            header: 'Size',
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 100,
            filterFn: createEqualsFilter<RaceSummary>(),
            cell: info => {
                const sizeId = info.getValue() as number;
                return SIZE_MAP[sizeId]?.name || '';
            },
            meta: {
                filterType: FilterType.SINGLE_SELECT,
                options: SIZE_LIST,
            },
        },
        {
            accessorKey: 'speed',
            header: 'Speed',
            enableSorting: true,
            enableResizing: true,
            size: 100,
        },
        {
            accessorKey: 'favoredClassId',
            header: 'Favored Class',
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 120,
            filterFn: createEqualsFilter<RaceSummary>(),
            cell: info => {
                const favoredClassId = info.getValue() as number;
                if (favoredClassId === -1) {
                    return 'Any';
                }
                return React.createElement(AsyncClassName, { classId: favoredClassId });
            },
            meta: {
                filterType: FilterType.SINGLE_SELECT,
                options: async (currentFilters: Array<{ id: string; value: unknown }>) => {
                    const editionFilter = currentFilters.find(f => f.id === 'editionId');
                    const editionId = editionFilter?.value as EditionId || EditionId.DND_3x;

                    const classes = await getBaseClassSelectByEdition(editionId);
                    return [
                        { id: -1, name: 'Any' },
                        ...classes
                    ];
                },
            },
        }
    ];
};

// Note: RACE_COLUMNS should be used as a hook: useRaceColumns()
