import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiTrashCan, mdiPlaylistEdit } from '@mdi/js';
import GenericList from '@/components/GenericList/GenericList';
import Input from '@/components/GenericList/Input';
import { COLUMN_DEFINITIONS, DEFAULT_COLUMNS } from '@/features/admin/features/raceMgmt/config/raceConfig';
import { fetchRaces, deleteRace } from '@/features/admin/features/raceMgmt/services/raceService';
import MultiSelect from '@/components/GenericList/MultiSelect';
import BooleanInput from '@/components/GenericList/BooleanInput';
import LookupService from '@/services/LookupService';
import { useAuth } from '@/auth/authProvider';
import { SIZE_MAP } from 'shared-data/src/commonData';

const RaceList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [lookupsInitialized, setLookupsInitialized] = useState(false);
    const [classes, setClasses] = useState([]);

    const raceFilterOptions = React.useMemo(() => ({
        race_name: { component: Input, props: { type: 'text', placeholder: 'Filter by name...' } },
        edition_id: {
            component: MultiSelect,
            props: {
                options: lookupsInitialized ? LookupService.getAll('editions') : [],
                displayKey: 'edition_abbrev',
                valueKey: 'edition_id',
                className: 'w-32'
            }
        },
        display: { component: BooleanInput },
        size_id: {
            component: MultiSelect,
            props: {
                options: lookupsInitialized ? Object.values(SIZE_MAP) : [],
                displayKey: 'name',
                valueKey: 'id',
                className: 'w-32'
            }
        },
        race_speed: { component: Input, props: { type: 'number', placeholder: 'Filter by speed...' } },
        favored_class_id: {
            component: MultiSelect,
            props: {
                options: lookupsInitialized ? classes : [],
                displayKey: 'class_name',
                valueKey: 'class_id',
                className: 'w-32'
            }
        }
    }), [lookupsInitialized, user, classes]);

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

    const handleNewRaceClick = () => {
        navigate('/admin/races/new/edit', { state: { fromListParams: location.search } });
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

    const renderCell = (item, columnId, isLastVisibleColumn) => {
        const column = COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        if (isLastVisibleColumn) {
            return (
                <div className="flex justify-between items-center w-full">
                    <span>{item[columnId]}</span>
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate(`/admin/races/${item.id}/edit`)}
                            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 mr-2"
                            title="Edit Race"
                        >
                            <Icon path={mdiPlaylistEdit} size={0.7} />
                        </button>
                        <button
                            onClick={() => handleDeleteRace(item.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600"
                            title="Delete Race"
                        >
                            <Icon path={mdiTrashCan} size={0.7} />
                        </button>
                    </div>
                </div>
            );
        }

        if (columnId === 'race_name') {
            return (
                <a
                    onClick={() => navigate(`/admin/races/${item.id}`)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {item[columnId]}
                </a>
            );
        }

        if (columnId === 'edition_id') {
            return LookupService.getById('editions', item[columnId]).edition_abbrev;
        }

        if (columnId === 'size_id') {
            return SIZE_MAP[item[columnId]].name;
        }

        if (columnId === 'favored_class_id') {
            const favoredClass = LookupService.getById('classes', item[columnId]);
            return favoredClass ? favoredClass.class_name : '';
        }

        return item[columnId];
    };

    if (!lookupsInitialized || isAuthLoading) {
        return <div className="p-4 bg-white text-black dark:bg-[#121212] dark:text-white">Loading...</div>;
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
                navigate={navigate}
                refreshTrigger={refreshTrigger}
                itemDesc="race"
                filterOptions={raceFilterOptions}
            />
        </div>
    );
};

export default RaceList;
