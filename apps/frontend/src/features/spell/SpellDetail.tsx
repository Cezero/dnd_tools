import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { DetailPage } from '@/components/common/DetailPage';
import { SpellQueryHooks } from '@/services/query/SpellQueryHooks';

import { SpellDisplayContent } from './SpellDisplayContent';
import { GetClassLevelAbbr } from './spellUtil';

export function SpellDetail(): React.JSX.Element {
    const { id } = useParams();
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';
    const [classLevelDisplay, setClassLevelDisplay] = useState<string>('');

    // Use TanStack Query hook
    const { data: spell, isLoading, error } = SpellQueryHooks.useGetSpellById(
        { pathParams: { id: parseInt(id!) } },
        { enabled: !!id }
    );

    // Handle class level display
    useEffect(() => {
        if (spell?.levelMapping && spell.levelMapping.length > 0) {
            const display = GetClassLevelAbbr(spell.levelMapping);
            setClassLevelDisplay(display);
        } else {
            setClassLevelDisplay('');
        }
    }, [spell?.levelMapping]);

    const handleBack = () => {
        navigate(`/spells${fromListParams ? `?${fromListParams}` : ''}`);
    };

    const handleEdit = () => {
        navigate(`/spells/${id}/edit`, { state: { fromListParams: fromListParams } });
    };

    if (error) {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">Error</h1>
                <p>Failed to load spell: {error.message}</p>
            </div>
        );
    }

    return (
        <DetailPage
            isLoading={isLoading}
            item={spell}
            itemName="Spell"
            isAdmin={isAdmin}
            onBack={handleBack}
            onEdit={handleEdit}
        >
            <SpellDisplayContent spell={spell} showHeader={true} classLevelDisplay={classLevelDisplay} />
        </DetailPage>
    );
} 
