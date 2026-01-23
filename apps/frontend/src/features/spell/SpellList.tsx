import React, { useCallback } from 'react';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list';
import { useSpellColumns } from '@/features/spell/SpellColumns';
import { Spell } from '@shared/schema';

import { routes } from './SpellConfig';
import { SpellQueryHooks } from './SpellQueryHooks';

export function SpellList(): React.JSX.Element {
    const { isLoading: isAuthLoading } = useAuthAuto();
    const columns = useSpellColumns();

    const dataFetcher = useCallback(async () => {
        return await SpellQueryHooks.getAllSpells();
    }, []);

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Spells</h1>
            <GenericList<Spell>
                storageKey="spells-list"
                columns={columns}
                dataFetcher={dataFetcher}
                itemDesc="spell"
                routes={routes}
            />
        </div>
    );
}
