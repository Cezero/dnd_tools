import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { RACE_COLUMNS } from '@/features/admin/features/race-management/RaceColumns';
import { RACE_TRAIT_COLUMNS } from '@/features/admin/features/race-management/RaceTraitColumns';
import { RaceService } from '@/features/admin/features/race-management/RaceService';
import { RaceTraitService } from '@/features/admin/features/race-management/RaceTraitService';
import { RaceInQueryResponse, RaceTraitSchema } from '@shared/schema';
import { routes } from './RaceConfig';


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
                columns={RACE_COLUMNS}
                serviceFunction={() => RaceService.getRaces({})}
                itemDesc="race"
                routes={routes}
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
                columns={RACE_TRAIT_COLUMNS}
                serviceFunction={() => RaceTraitService.getRaceTraits({})}
                itemDesc="race trait"
                routes={routes}
            />
        </div>
    );
}

