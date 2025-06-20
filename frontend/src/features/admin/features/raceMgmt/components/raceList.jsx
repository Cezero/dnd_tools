import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

const RaceList = () => {
    const navigate = useNavigate();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [lookupsInitialized, setLookupsInitialized] = useState(false);

    const raceFilterOptions = React.useMemo(() => ({
        name: { component: Input, props: { type: 'text', placeholder: 'Filter by name...' } },
        edition_id: {
            component: MultiSelect,
            props: {
                options: lookupsInitialized ? LookupService.getAll('editions') : [],
                displayKey: 'edition_abbrev',
                valueKey: 'edition_id',
                className: 'w-32'
            }
        },
        display: { component: BooleanInput, props: { placeholder: 'Select Display Status' } },
    }), [lookupsInitialized]);

    useEffect(() => {
        const initializeLookups = async () => {
            try {
                await LookupService.initialize();
                setLookupsInitialized(true);
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

        const data = await fetchRaces(params);
        return { data: data.results, total: data.total };
    }, [lookupsInitialized, user]);

    const handleNewRaceClick = () => {
        navigate('/admin/races/new/edit');
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

        if (columnId === 'name') {
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
            return LookupService.getEditionDisplay(item[columnId]);
        }

        return item[columnId];
    };

    if (!lookupsInitialized || isAuthLoading) {
        return <div className="p-4 bg-white text-black dark:bg-[#121212] dark:text-white min-h-screen">Loading...</div>;
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
                requiredColumnId="name"
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
