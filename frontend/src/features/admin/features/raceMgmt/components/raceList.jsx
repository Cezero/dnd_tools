import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GenericList from '@/components/GenericList/GenericList';
import { COLUMN_DEFINITIONS, DEFAULT_COLUMNS, raceFilterOptions } from '@/features/admin/features/raceMgmt/config/raceConfig';
import { fetchRaces, deleteRace } from '@/features/admin/features/raceMgmt/services/raceService';
import LookupService from '@/services/LookupService';
import { useAuth } from '@/auth/authProvider';
import { SIZE_MAP } from 'shared-data/src/commonData';
import { COLUMN_DEFINITIONS as TRAIT_COLUMN_DEFINITIONS, DEFAULT_COLUMNS as DEFAULT_TRAIT_COLUMNS, raceTraitFilterOptions } from '@/features/admin/features/raceMgmt/config/raceTraitConfig';
import { fetchRaceTraits, deleteRaceTrait } from '@/features/admin/features/raceMgmt/services/raceTraitService';
import ProcessMarkdown from '@/components/markdown/ProcessMarkdown';

const RaceList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [lookupsInitialized, setLookupsInitialized] = useState(false);
    const [classes, setClasses] = useState([]);
    const [raceTraitRefreshTrigger, setRaceTraitRefreshTrigger] = useState(0);

    const memoizedSizeMapOptions = useMemo(() => Object.values(SIZE_MAP), []);

    const memoizedRaceFilterOptions = useMemo(() => (
        raceFilterOptions(lookupsInitialized, classes, memoizedSizeMapOptions)
    ), [lookupsInitialized, classes, memoizedSizeMapOptions]);

    const memoizedRaceTraitFilterOptions = useMemo(() => (
        raceTraitFilterOptions()
    ), []);

    useEffect(() => {
        const initializeLookups = async () => {
            try {
                await LookupService.initialize();
                setLookupsInitialized(true);
                const allClasses = LookupService.getAll('classes');
                setClasses(allClasses);
            } catch (error) {
                console.error('Failed to initialize lookup service:', error);
            }
        };
        initializeLookups();
    }, []);

    const raceFetchData = useCallback(async (params) => {
        if (!lookupsInitialized) {
            return { data: [], total: 0 };
        }

        const { data, total } = await fetchRaces(params);
        const processedResults = data.map(race => ({
            race_name: race.race_name,
            edition_id: race.edition_id,
            display: race.display,
            race_description: race.race_description,
            size_id: race.size_id,
            race_speed: race.race_speed,
            favored_class_id: race.favored_class_id,
            id: race.race_id
        }));
        return { data: processedResults, total: total };
    }, [lookupsInitialized, user]);

    const raceTraitFetchData = useCallback(async (params) => {
        const { data, total } = await fetchRaceTraits(params);
        const processedResults = data.map(trait => ({
            trait_name: trait.trait_name,
            trait_description: trait.trait_description,
            value_flag: trait.value_flag,
            trait_slug: trait.trait_slug,
            id: trait.trait_slug
        }));
        return { data: processedResults, total: total };
    }, []);

    const handleNewRaceClick = () => {
        navigate('/admin/races/new/edit', { state: { fromListParams: location.search } });
    };

    const handleNewRaceTraitClick = () => {
        navigate('/admin/races/traits/new/edit', { state: { fromListParams: location.search } });
    };

    const handleDeleteRace = async (id) => {
        if (window.confirm('Are you sure you want to delete this race?')) {
            try {
                await deleteRace(id);
                setRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error('Failed to delete race:', error);
                alert('Failed to delete race.');
            }
        }
    };

    const handleDeleteRaceTrait = async (id) => {
        if (window.confirm('Are you sure you want to delete this race trait?')) {
            try {
                await deleteRaceTrait(id);
                setRaceTraitRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error('Failed to delete race trait:', error);
                alert('Failed to delete race trait.');
            }
        }
    };

    const renderCell = (item, columnId, isLastVisibleColumn) => {
        const column = COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        let cellContent = item[columnId];

        if (columnId === 'race_name') {
            cellContent = (
                <a
                    onClick={() => navigate(`/admin/races/${item.id}`)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {item[columnId]}
                </a>
            );
        } else if (columnId === 'edition_id') {
            cellContent = LookupService.getById('editions', item[columnId]).edition_abbrev;
        } else if (columnId === 'display') {
            cellContent = item[columnId] ? 'Yes' : 'No';
        } else if (columnId === 'size_id') {
            cellContent = SIZE_MAP[item[columnId]].name;
        } else if (columnId === 'favored_class_id') {
            if (item[columnId] === -1) {
                cellContent = 'Any';
            } else {
                const favoredClass = LookupService.getById('classes', item[columnId]);
                cellContent = favoredClass ? favoredClass.class_name : '';
            }
        }

        return cellContent;
    };

    const renderTraitCell = (item, columnId, isLastVisibleColumn) => {
        const column = TRAIT_COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        let cellContent = item[columnId];

        if (columnId === 'trait_slug') {
            cellContent = (
                <a
                    onClick={() => navigate(`/admin/races/traits/${item.id}`)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {item[columnId]}
                </a>
            );
        } else if (columnId === 'trait_description') {
            cellContent = (<ProcessMarkdown markdown={item[columnId]} userVars={{ traitname: item.trait_name }} />);
        } else if (columnId === 'value_flag') {
            cellContent = item[columnId] ? 'Yes' : 'No';
        }

        return cellContent;
    };

    if (!lookupsInitialized || isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Races</h1>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={handleNewRaceClick}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    New Race
                </button>
            </div>
            <GenericList
                storageKey="races-list"
                defaultColumns={DEFAULT_COLUMNS}
                requiredColumnId="race_name"
                columnDefinitions={COLUMN_DEFINITIONS}
                fetchData={raceFetchData}
                renderCell={renderCell}
                detailPagePath="/admin/races/:id"
                idKey="id"
                refreshTrigger={refreshTrigger}
                itemDesc="race"
                editHandler={(item) => navigate(`/admin/races/${item.id}/edit`)}
                deleteHandler={(item) => handleDeleteRace(item.id)}
                filterOptions={memoizedRaceFilterOptions}
            />

            <h2 className="text-xl font-bold mb-4 mt-8">Race Trait Definitions</h2>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={handleNewRaceTraitClick}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2"
                >
                    New Race Trait Definition
                </button>
            </div>
            <GenericList
                storageKey="race-traits-list"
                defaultColumns={DEFAULT_TRAIT_COLUMNS}
                requiredColumnId="trait_slug"
                columnDefinitions={TRAIT_COLUMN_DEFINITIONS}
                fetchData={raceTraitFetchData}
                renderCell={renderTraitCell}
                detailPagePath="/admin/races/traits/:id"
                idKey="id"
                refreshTrigger={raceTraitRefreshTrigger}
                itemDesc="race trait"
                editHandler={(item) => navigate(`/admin/races/traits/${item.id}/edit`)}
                deleteHandler={(item) => handleDeleteRaceTrait(item.id)}
                filterOptions={memoizedRaceTraitFilterOptions}
            />
        </div>
    );
};

export default RaceList;
