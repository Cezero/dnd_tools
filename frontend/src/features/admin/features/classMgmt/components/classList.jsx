import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GenericList from '@/components/GenericList/GenericList';
import { COLUMN_DEFINITIONS, DEFAULT_COLUMNS, classFilterOptions } from '@/features/admin/features/classMgmt/config/classConfig';
import { fetchClasses, deleteClass } from '@/features/admin/features/classMgmt/services/classService';
import LookupService from '@/services/LookupService';
import { useAuth } from '@/auth/authProvider';
import { RPG_DICE } from 'shared-data/src/commonData';

export default function ClassList() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [lookupsInitialized, setLookupsInitialized] = useState(false);

    const memoizedClassFilterOptions = useMemo(() => (
        classFilterOptions(lookupsInitialized)
    ), [lookupsInitialized]);

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

    const classFetchData = useCallback(async (params) => {
        if (!lookupsInitialized) {
            return { data: [], total: 0 };
        }

        const { data, total } = await fetchClasses(params);
        const processedResults = data.map(cls => ({
            class_name: cls.class_name,
            class_abbr: cls.class_abbr,
            edition_id: cls.edition_id,
            is_prestige_class: cls.is_prestige_class,
            display: cls.display,
            caster: cls.caster,
            hit_die: cls.hit_die,
            id: cls.class_id
        }));
        return { data: processedResults, total: total };
    }, [lookupsInitialized, user]);

    const handleNewClassClick = () => {
        navigate('/admin/classes/new/edit', { state: { fromListParams: location.search } });
    };

    const handleDeleteClass = async (id) => {
        if (window.confirm('Are you sure you want to delete this class?')) {
            try {
                await deleteClass(id);
                setRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error('Failed to delete class:', error);
                alert('Failed to delete class.');
            }
        }
    };

    const renderCell = (item, columnId) => {
        const column = COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        let cellContent = item[columnId];

        if (columnId === 'class_name') {
            cellContent = (
                <a
                    onClick={() => navigate(`/admin/classes/${item.id}`)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {item[columnId]}
                </a>
            );
        } else if (columnId === 'edition_id') {
            cellContent = LookupService.getById('editions', item[columnId])?.edition_abbrev;
        } else if (columnId === 'is_prestige_class' || columnId === 'display' || columnId === 'caster') {
            cellContent = item[columnId] ? 'Yes' : 'No';
        } else if (columnId === 'hit_die') {
            cellContent = `${RPG_DICE[item[columnId]].name}`;
        }

        return cellContent;
    };

    if (!lookupsInitialized || isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Classes</h1>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={handleNewClassClick}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    New Class
                </button>
            </div>
            <GenericList
                storageKey="classes-list"
                defaultColumns={DEFAULT_COLUMNS}
                requiredColumnId="class_name"
                columnDefinitions={COLUMN_DEFINITIONS}
                fetchData={classFetchData}
                renderCell={renderCell}
                detailPagePath="/admin/classes/:id"
                idKey="id"
                refreshTrigger={refreshTrigger}
                itemDesc="class"
                editHandler={(item) => navigate(`/admin/classes/${item.id}/edit`)}
                deleteHandler={(item) => handleDeleteClass(item.id)}
                filterOptions={memoizedClassFilterOptions}
            />
        </div>
    );
}