import React from 'react';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { SPELL_COLUMNS } from '@/features/spell/SpellColumns';
import { SpellService } from '@/features/spell/SpellService';
import { SpellInQueryResponse } from '@shared/schema';
import { routes } from './SpellConfig';

export function SpellList(): React.JSX.Element {
    const { isLoading: isAuthLoading } = useAuthAuto();

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Spells</h1>
            <GenericList<SpellInQueryResponse>
                storageKey="spells-list"
                columns={SPELL_COLUMNS}
                serviceFunction={() => SpellService.getAllSpells({})}
                itemDesc="spell"
                routes={routes}
            />
        </div>
    );
} 
