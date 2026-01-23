import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list';
import { createIdDeleteServiceFunction } from '@/components/generic-list/types';
import { CHARACTER_COLUMNS, routes } from '@/features/character';
import { CharacterWithRaceResponse } from '@shared/schema';

import { CharacterQueryHooks } from './CharacterQueryHooks';

export function CharacterList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading } = useAuthAuto();

    const HandleNewCharacterClick = (): void => {
        navigate('/characters/new/create', { state: { fromListParams: location.search } });
    };

    const dataFetcher = useCallback(async () => {
        return await CharacterQueryHooks.getCharacters();
    }, []);

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">My Characters</h1>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={HandleNewCharacterClick}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    New Character
                </button>
            </div>
            <GenericList<CharacterWithRaceResponse>
                storageKey="characters-list"
                columns={CHARACTER_COLUMNS}
                dataFetcher={dataFetcher}
                itemDesc="character"
                routes={routes}
                deleteServiceFunction={createIdDeleteServiceFunction((id: number) => CharacterQueryHooks.deleteCharacter(id))}
                basePath=""
            />
        </div>
    );
} 
