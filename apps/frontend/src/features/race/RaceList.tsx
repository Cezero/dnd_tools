import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { createIdDeleteServiceFunction, createSlugDeleteServiceFunction } from '@/components/generic-list/types';
import { RACE_COLUMNS } from './RaceColumns';
import { FEATURE_COLUMNS } from '../class/FeatureColumns';
import { RaceService } from './RaceService';
import { FeatureSystemService } from '@/services/FeatureSystemService';
import { RaceInQueryResponse, FeatureSchema } from '@shared/schema';
import { routes } from './RaceConfig';
import { FeatureDetail, FeatureEdit } from '@/components/feature-system';


export function RaceList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading, isAdmin } = useAuthAuto();

    const HandleNewRaceClick = (): void => {
        navigate('/races/new/edit', { state: { fromListParams: location.search } });
    };

    const HandleNewFeatureClick = (): void => {
        navigate('/features/new/edit', {
            state: {
                fromListParams: location.search,
                fromPage: 'races'
            }
        });
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
                    <h2 className="text-xl font-bold mb-4 mt-8">Feature Definitions</h2>
                    <div className="mb-4 flex justify-end">
                        <button
                            onClick={HandleNewFeatureClick}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2"
                        >
                            New Feature
                        </button>
                    </div>
                    <div id="features-list-container">
                        <GenericList<z.infer<typeof FeatureSchema>>
                            storageKey="features-list"
                            columns={FEATURE_COLUMNS}
                            serviceFunction={() => FeatureSystemService.getFeatures({ sourceType: 0 })}
                            itemDesc="feature"
                            routes={[
                                { path: 'features/:slug', component: FeatureDetail, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
                                { path: 'features/:slug/edit', component: FeatureEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
                            ]}
                            deleteServiceFunction={createSlugDeleteServiceFunction(FeatureSystemService.deleteFeature)}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

