import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { COLUMN_DEFINITIONS } from '@/features/admin/features/race-management/RaceConfig';
import { RaceService } from '@/features/admin/features/race-management/RaceService';
import { COLUMN_DEFINITIONS as TRAIT_COLUMN_DEFINITIONS } from '@/features/admin/features/race-management/RaceTraitConfig';
import { RaceTraitService } from '@/features/admin/features/race-management/RaceTraitService';
import { RaceInQueryResponse, RaceQuerySchema, RaceTraitQuerySchema, RaceTraitSchema } from '@shared/schema';
import { SIZE_MAP, EDITION_MAP, CLASS_MAP } from '@shared/static-data';


export function RaceList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading } = useAuthAuto();

    const HandleNewRaceClick = (): void => {
        navigate('/admin/races/new/edit', { state: { fromListParams: location.search } });
    };

    const HandleNewRaceTraitClick = (): void => {
        navigate('/admin/races/traits/new/edit', { state: { fromListParams: location.search } });
    };

    const HandleDeleteRace = async (id: number): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this race?')) {
            try {
                await RaceService.deleteRace(undefined, { id });
            } catch (error) {
                console.error('Failed to delete race:', error);
                alert('Failed to delete race.');
            }
        }
    };

    const HandleDeleteRaceTrait = async (slug: string): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this race trait?')) {
            try {
                await RaceTraitService.deleteRaceTrait(undefined, { slug });
            } catch (error) {
                console.error('Failed to delete race trait:', error);
                alert('Failed to delete race trait.');
            }
        }
    };

    const RenderCell = (item: RaceInQueryResponse, columnId: string): React.ReactNode => {
        const column = COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        let cellContent: React.ReactNode = String(item[columnId as keyof RaceInQueryResponse] || '');

        if (columnId === 'name') {
            cellContent = (
                <a
                    onClick={() => navigate(`/admin/races/${item.id}`)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {item.name}
                </a>
            );
        } else if (columnId === 'editionId') {
            cellContent = EDITION_MAP[item.editionId]?.abbreviation;
        } else if (columnId === 'isVisible') {
            cellContent = item.isVisible ? 'Yes' : 'No';
        } else if (columnId === 'sizeId') {
            cellContent = SIZE_MAP[item.sizeId]?.name;
        } else if (columnId === 'favoredClassId') {
            if (item.favoredClassId === -1) {
                cellContent = 'Any';
            } else {
                cellContent = CLASS_MAP[item.favoredClassId]?.name || '';
            }
        } else if (columnId === 'description') {
            cellContent = (<ProcessMarkdown id={`race-${item.id}-description`} markdown={String(item.description || '')} />);
        }

        return cellContent;
    };

    const RenderTraitCell = (item: z.infer<typeof RaceTraitSchema>, columnId: string): React.ReactNode => {
        const column = TRAIT_COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        let cellContent: React.ReactNode = String(item[columnId as keyof z.infer<typeof RaceTraitSchema>] || '');

        if (columnId === 'slug') {
            cellContent = (
                <a
                    onClick={() => navigate(`/admin/races/traits/${item.slug}`)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {item.slug}
                </a>
            );
        } else if (columnId === 'description') {
            cellContent = (<ProcessMarkdown id={`race-trait-${item.slug}-description`} markdown={item.description || ''} />);
        } else if (columnId === 'hasValue') {
            cellContent = item.hasValue ? 'Yes' : 'No';
        }

        return cellContent;
    };

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Races</h1>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={HandleNewRaceClick}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    New Race
                </button>
            </div>
            <GenericList<RaceInQueryResponse>
                storageKey="races-list"
                columnDefinitions={COLUMN_DEFINITIONS}
                querySchema={RaceQuerySchema}
                serviceFunction={RaceService.getRaces}
                renderCell={RenderCell}
                detailPagePath="/admin/races/:id"
                itemDesc="race"
                editHandler={(item: RaceInQueryResponse) => navigate(`/admin/races/${item.id}/edit`)}
                deleteHandler={(item: RaceInQueryResponse) => HandleDeleteRace(item.id)}
            />

            <h2 className="text-xl font-bold mb-4 mt-8">Race Trait Definitions</h2>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={HandleNewRaceTraitClick}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2"
                >
                    New Race Trait Definition
                </button>
            </div>
            <GenericList<z.infer<typeof RaceTraitSchema>>
                storageKey="race-traits-list"
                columnDefinitions={TRAIT_COLUMN_DEFINITIONS}
                querySchema={RaceTraitQuerySchema}
                serviceFunction={RaceTraitService.getRaceTraits}
                renderCell={RenderTraitCell}
                detailPagePath="/admin/races/traits/:slug"
                itemDesc="race trait"
                editHandler={(item: z.infer<typeof RaceTraitSchema>) => navigate(`/admin/races/traits/${item.slug}/edit`)}
                deleteHandler={(item: z.infer<typeof RaceTraitSchema>) => HandleDeleteRaceTrait(item.slug)}
            />
        </div>
    );
}

