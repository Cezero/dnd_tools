import { ColumnDef } from '@tanstack/react-table';
import { Trick } from '@shared/schema';

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
        accessorKey: 'editionId',
        header: 'Edition',
        cell: ({ row }) => row.original.editionId,
    },
];

