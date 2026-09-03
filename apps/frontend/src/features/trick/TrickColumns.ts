import { ColumnDef } from '@tanstack/react-table';

import { Trick } from '@shared/schema';
import { EDITION_MAP } from '@shared/static-data';

export const TRICK_COLUMNS: ColumnDef<Trick, unknown>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => row.original.name,
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => row.original.description || '',
    },
    {
        accessorKey: 'dc',
        header: 'DC',
        cell: ({ row }) => row.original.dc,
    },
    {
        accessorKey: 'maxTimesTrainable',
        header: 'Max Times',
        cell: ({ row }) => row.original.maxTimesTrainable,
    },
    {
        accessorKey: 'editionId',
        header: 'Edition',
        cell: ({ row }) => EDITION_MAP[row.original.editionId]?.abbreviation || '',
    },
];

