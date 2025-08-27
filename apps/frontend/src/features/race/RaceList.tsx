import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { FeatureDetail, FeatureEdit } from '@/components/feature-system';
import { FeatureSystemApi } from '@/components/feature-system/FeatureSystemApi';
import { GenericList } from '@/components/generic-list/GenericList';
import { createIdDeleteServiceFunction } from '@/components/generic-list/types';
import { RaceSummary, Feature } from '@shared/schema';

import { RaceApi } from './RaceApi';
import { RACE_COLUMNS } from './RaceColumns';
import { routes } from './RaceConfig';
import { FEATURE_COLUMNS } from '../class/FeatureColumns';

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
            <GenericList<RaceSummary>
                storageKey="races-list"
                columns={RACE_COLUMNS}
                serviceFunction={() => RaceApi.getRaces({})}
                itemDesc="race"
                routes={routes}
                deleteServiceFunction={createIdDeleteServiceFunction(RaceApi.deleteRace)}
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
                        <GenericList<Feature>
                            storageKey="features-list"
                            columns={FEATURE_COLUMNS}
                            serviceFunction={() => FeatureSystemApi.getFeatures({ sourceType: 0 })}
                            itemDesc="feature"
                            routes={[
                                { path: 'features/:id', component: FeatureDetail, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
                                { path: 'features/:id/edit', component: FeatureEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
                            ]}
                            functions={{
                                edit: (feature) => {
                                    navigate(`/features/${feature.id}/edit`, {
                                        state: {
                                            fromListParams: location.search,
                                            fromPage: 'races'
                                        }
                                    });
                                }
                            }}
                            deleteServiceFunction={createIdDeleteServiceFunction(FeatureSystemApi.deleteFeature)}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

