import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { createIdDeleteServiceFunction, createSlugDeleteServiceFunction } from '@/components/generic-list/types';
import { RACE_COLUMNS } from './RaceColumns';
import { RACE_TRAIT_COLUMNS } from './RaceTraitColumns';
import { RaceService } from './RaceService';
import { RaceTraitService } from './RaceTraitService';
import { RaceInQueryResponse, RaceTraitSchema } from '@shared/schema';
import { routes, raceTraitRoutes } from './RaceConfig';


export function RaceList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading, isAdmin } = useAuthAuto();

    const HandleNewRaceClick = (): void => {
        navigate('/races/new/edit', { state: { fromListParams: location.search } });
    };

    const HandleNewRaceTraitClick = (): void => {
        navigate('/races/traits/new/edit', { state: { fromListParams: location.search } });
    };



    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Races</h1>
            {isAdmin && (
                <div className="mb-4 flex justify-end">
                    <button
                        onClick={HandleNewRaceClick}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        New Race
                    </button>
                </div>
            )}
            <GenericList<RaceInQueryResponse>
                storageKey="races-list"
                columns={RACE_COLUMNS}
                serviceFunction={() => RaceService.getRaces({})}
                itemDesc="race"
                routes={routes}
                deleteServiceFunction={createIdDeleteServiceFunction(RaceService.deleteRace)}
            />

            {isAdmin && (
                <>
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
                        routes={raceTraitRoutes}
                        deleteServiceFunction={createSlugDeleteServiceFunction(RaceTraitService.deleteRaceTrait)}
                    />
                </>
            )}
        </div>
    );
}

