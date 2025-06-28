import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GenericList } from '@/components/GenericList/GenericList';
import { COLUMN_DEFINITIONS, DEFAULT_COLUMNS, RaceFilterOptions } from '@/features/admin/features/raceMgmt/config/RaceConfig';
import { FetchRaces, DeleteRace } from '@/features/admin/features/raceMgmt/services/RaceService';
import { UseAuth } from '@/auth/AuthProvider';
import { SIZE_MAP, EDITION_MAP } from '@shared/static-data/CommonData';
import { CLASS_MAP } from '@shared/static-data/ClassData';
import { COLUMN_DEFINITIONS as TRAIT_COLUMN_DEFINITIONS, DEFAULT_COLUMNS as DEFAULT_TRAIT_COLUMNS, RaceTraitFilterOptions } from '@/features/admin/features/raceMgmt/config/RaceTraitConfig';
import { FetchRaceTraits, DeleteRaceTrait } from '@/features/admin/features/raceMgmt/services/RaceTraitService';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';

export const RaceList = (): React.JSX.Element => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isLoading: isAuthLoading } = UseAuth();
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

    const [raceTraitRefreshTrigger, setRaceTraitRefreshTrigger] = useState<number>(0);

    const memoizedRaceTraitFilterOptions = useMemo(() => (
        RaceTraitFilterOptions()
    ), []);

    const memoizedRaceFilterOptions = useMemo(() => (
        RaceFilterOptions()
    ), []);

    const RaceFetchData = useCallback(async (params: URLSearchParams) => {
        const { data, total } = await FetchRaces(params);
        return { data, total };
    }, [user]);

    const RaceTraitFetchData = useCallback(async (params: URLSearchParams) => {
        const { data, total } = await FetchRaceTraits(params);
        return { data, total };
    }, []);

    const HandleNewRaceClick = (): void => {
        navigate('/admin/races/new/edit', { state: { fromListParams: location.search } });
    };

    const HandleNewRaceTraitClick = (): void => {
        navigate('/admin/races/traits/new/edit', { state: { fromListParams: location.search } });
    };

    const HandleDeleteRace = async (id: number): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this race?')) {
            try {
                await DeleteRace(id);
                setRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error('Failed to delete race:', error);
                alert('Failed to delete race.');
            }
        }
    };

    const HandleDeleteRaceTrait = async (slug: string): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this race trait?')) {
            try {
                await DeleteRaceTrait(slug);
                setRaceTraitRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error('Failed to delete race trait:', error);
                alert('Failed to delete race trait.');
            }
        }
    };

    const RenderCell = (item: any, columnId: string): React.ReactNode => {
        const column = COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        let cellContent: React.ReactNode = item[columnId];

        if (columnId === 'name') {
            cellContent = (
                <a
                    onClick={() => navigate(`/admin/races/${item.id}`)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {item[columnId]}
                </a>
            );
        } else if (columnId === 'edition_id') {
            cellContent = EDITION_MAP[item[columnId]].abbr;
        } else if (columnId === 'display') {
            cellContent = item[columnId] ? 'Yes' : 'No';
        } else if (columnId === 'size_id') {
            cellContent = SIZE_MAP[item[columnId]].name;
        } else if (columnId === 'favored_class_id') {
            if (item[columnId] === -1) {
                cellContent = 'Any';
            } else {
                cellContent = CLASS_MAP[item[columnId]]?.name || '';
            }
        }

        return cellContent;
    };

    const RenderTraitCell = (item: any, columnId: string): React.ReactNode => {
        const column = TRAIT_COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        let cellContent: React.ReactNode = item[columnId];

        if (columnId === 'slug') {
            cellContent = (
                <a
                    onClick={() => navigate(`/admin/races/traits/${item.id}`)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {item[columnId]}
                </a>
            );
        } else if (columnId === 'desc') {
            cellContent = (<ProcessMarkdown markdown={item[columnId]} userVars={{ traitname: item.trait_name }} />);
        } else if (columnId === 'has_value') {
            cellContent = item[columnId] ? 'Yes' : 'No';
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
            <GenericList
                storageKey="races-list"
                defaultColumns={DEFAULT_COLUMNS}
                requiredColumnId="name"
                columnDefinitions={COLUMN_DEFINITIONS}
                fetchData={RaceFetchData}
                renderCell={RenderCell}
                detailPagePath="/admin/races/:id"
                idKey="id"
                refreshTrigger={refreshTrigger}
                itemDesc="race"
                editHandler={(item: any) => navigate(`/admin/races/${item.id}/edit`)}
                deleteHandler={(item: any) => HandleDeleteRace(item.id)}
                filterOptions={memoizedRaceFilterOptions}
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
            <GenericList
                storageKey="race-traits-list"
                defaultColumns={DEFAULT_TRAIT_COLUMNS}
                requiredColumnId="slug"
                columnDefinitions={TRAIT_COLUMN_DEFINITIONS}
                fetchData={RaceTraitFetchData}
                renderCell={RenderTraitCell}
                detailPagePath="/admin/races/traits/:id"
                idKey="slug"
                refreshTrigger={raceTraitRefreshTrigger}
                itemDesc="race trait"
                editHandler={(item: any) => navigate(`/admin/races/traits/${item.slug}/edit`)}
                deleteHandler={(item: any) => HandleDeleteRaceTrait(item.slug)}
                filterOptions={memoizedRaceTraitFilterOptions}
            />
        </div>
    );
};

