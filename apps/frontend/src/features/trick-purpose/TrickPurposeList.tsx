import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list';
import { TrickPurposeWithRelations } from '@shared/schema';

import { TRICK_PURPOSE_COLUMNS } from './TrickPurposeColumns';
import { routes } from './TrickPurposeConfig';
import { TrickPurposeQueryHooks } from './TrickPurposeQueryHooks';

/**
 * Admin list of Handle Animal purpose packages.
 */
export function TrickPurposeList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading, isAdmin } = useAuthAuto();

    const handleNewClick = (): void => {
        navigate('/trick-purposes/new/edit', { state: { fromListParams: location.search } });
    };

    const dataFetcher = useCallback(async () => {
        return await TrickPurposeQueryHooks.getTrickPurposes();
    }, []);

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Trick Purposes</h1>
            {isAdmin && (
                <div className="mb-4 flex justify-end">
                    <button
                        onClick={handleNewClick}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        New Purpose
                    </button>
                </div>
            )}
            <GenericList<TrickPurposeWithRelations>
                storageKey="trick-purposes-list"
                columns={TRICK_PURPOSE_COLUMNS}
                dataFetcher={dataFetcher}
                itemDesc="trick purpose"
                routes={routes}
                deleteServiceFunction={(id) => TrickPurposeQueryHooks.deleteTrickPurpose(Number(id))}
            />
        </div>
    );
}
