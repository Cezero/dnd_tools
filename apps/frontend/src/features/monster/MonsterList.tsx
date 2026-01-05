import React, { useCallback } from 'react';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list';
import { useMonsterColumns } from '@/features/monster/MonsterColumns';
import { MonsterQueryHooks } from '@/services/query/MonsterQueryHooks';
import { Monster } from '@shared/schema';

import { routes } from './MonsterConfig';

export function MonsterList(): React.JSX.Element {
    const { isLoading: isAuthLoading } = useAuthAuto();
    const columns = useMonsterColumns();

    const dataFetcher = useCallback(async () => {
        return await MonsterQueryHooks.getAllMonsters({ requestData: { includeStatblockOnly: true } });
    }, []);

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Monsters</h1>
            <GenericList<Monster>
                storageKey="monsters-list"
                columns={columns}
                dataFetcher={dataFetcher}
                itemDesc="monster"
                routes={routes}
            />
        </div>
    );
}

