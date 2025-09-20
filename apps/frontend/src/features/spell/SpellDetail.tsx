import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { DetailPage } from '@/components/common/DetailPage';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { SpellApi } from '@/features/spell/SpellApi';
import { GetSpellResponse } from '@shared/schema';
import { SpellSchoolNameList, SpellDescriptorNameList, SpellComponentAbbrList, GetSourceDisplay } from '@shared/static-data';

import { GetClassLevelAbbr } from './spellUtil';

export function SpellDetail(): React.JSX.Element {
    const { id } = useParams();
    const [spell, setSpell] = useState<GetSpellResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async (): Promise<void> => {
            try {
                const data = await SpellApi.getSpellById(undefined, { id: parseInt(id!) });
                setSpell(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize or fetch spell:', error);
                setIsLoading(false);
            }
        };
        Initialize();
    }, [id, location.state]);

    const handleBack = () => {
        navigate(`/spells${fromListParams ? `?${fromListParams}` : ''}`);
    };

    const handleEdit = () => {
        navigate(`/spells/${id}/edit`, { state: { fromListParams: fromListParams } });
    };

    return (
        <DetailPage
            isLoading={isLoading}
            item={spell}
            itemName="Spell"
            isAdmin={isAdmin}
            onBack={handleBack}
            onEdit={handleEdit}
        >
            <div className="flex justify-between items-start mb-2">
                <h1 className="text-2xl font-bold">{spell!.name}</h1>
                {spell!.sourceBookInfo && spell!.sourceBookInfo.length > 0 && (
                    <div className="text-right">
                        <p><strong>Source:</strong> {GetSourceDisplay(spell!.sourceBookInfo, true)}</p>
                    </div>
                )}
            </div>
            <p>
                {spell!.schoolIds && SpellSchoolNameList(spell!.schoolIds.map(s => s.schoolId))}
                {spell!.subSchoolIds && (() => {
                    const subSchoolNames = SpellSchoolNameList(spell!.subSchoolIds.map(s => s.subSchoolId));
                    return subSchoolNames.length > 0 ? ` (${subSchoolNames})` : '';
                })()}
                {spell!.descriptorIds && (() => {
                    const descriptorNames = SpellDescriptorNameList(spell!.descriptorIds.map(d => d.descriptorId));
                    return descriptorNames.length > 0 ? ` [${descriptorNames}]` : '';
                })()}
            </p>
            <p><strong>Level:</strong> {spell!.baseLevel}</p>
            {spell!.componentIds && <p><strong>Components:</strong> {SpellComponentAbbrList(spell!.componentIds.map(c => c.componentId))}</p>}
            {spell!.castingTime && <p><strong>Casting Time:</strong> {spell!.castingTime}</p>}
            {spell!.effect && <p><strong>Effect:</strong> {spell!.effect}</p>}
            {spell!.area && <p><strong>Area:</strong> {spell!.area}</p>}
            {spell!.range && <p><strong>Range:</strong> {spell!.range}</p>}
            {spell!.target && <p><strong>Target:</strong> {spell!.target}</p>}
            {spell!.duration && <p><strong>Duration:</strong> {spell!.duration}</p>}
            {spell!.savingThrow && <p><strong>Saving Throw:</strong> {spell!.savingThrow}</p>}
            {spell!.spellResistance && <p><strong>Spell Resistance:</strong> {spell!.spellResistance}</p>}

            {/* Class Level Mappings */}
            {spell!.levelMapping && spell!.levelMapping.length > 0 && (
                <div className="mt-3">
                    <p><strong>Class Levels:</strong></p>
                    <div className="ml-4">
                        {GetClassLevelAbbr(spell!.levelMapping)}
                    </div>
                </div>
            )}

            <div className="mt-3 p-2 w-full prose-custom">
                <ProcessMarkdown id='description' markdown={spell!.description || ''} />
            </div>
        </DetailPage>
    );
} 
