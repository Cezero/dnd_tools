import { ColumnDef } from '@tanstack/react-table';

import { TrickPurposeWithRelations } from '@shared/schema';
import { EDITION_MAP } from '@shared/static-data';

export const TRICK_PURPOSE_COLUMNS: ColumnDef<TrickPurposeWithRelations, unknown>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => row.original.name,
    },
    {
        accessorKey: 'dc',
        header: 'DC',
        cell: ({ row }) => row.original.dc,
    },
    {
        accessorKey: 'trainingWeeks',
        header: 'Weeks',
        cell: ({ row }) => row.original.trainingWeeks,
    },
    {
        accessorKey: 'editionId',
        header: 'Edition',
        cell: ({ row }) => EDITION_MAP[row.original.editionId]?.abbreviation || '',
    },
];
