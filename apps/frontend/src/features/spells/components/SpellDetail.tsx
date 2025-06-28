import { useParams, Link, useLocation } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { Api } from '@/services/Api';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { UseAuth } from '@/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { GetClassLevelAbbr } from '@/features/spells/lib/SpellUtil';
import { SpellSchoolNameList, SpellDescriptorNameList, SpellComponentAbbrList } from '@shared/static-data/src/SpellData';
import { GetSourceDisplay } from '@shared/static-data/src/SourceData';

export function SpellDetail(): React.JSX.Element {
    const { id } = useParams();
    const [spell, setSpell] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { user } = UseAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async () => {
            try {
                const data = await Api(`/spells/${id}`);
                setSpell(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize or fetch spell:', error);
                setIsLoading(false);
            }
        };
        Initialize();
    }, [id]);

    // Inner cell styling (the inner border, padding, background, text colors)
    const innerCellContentClasses = "p-3 bg-white dark:bg-gray-700 dark:border-gray-500 rounded-lg border";

    // Outer container styling (width, centering, outer border, shadow)
    const outerContainerClasses = "w-3/5 mx-auto border-2 border-gray-400 dark:border-gray-500 rounded-lg shadow-lg p-1";

    if (isLoading) return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    Loading...
                </div>
            </div>
        </div>
    );
    if (!spell) return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    Spell not found
                </div>
            </div>
        </div>
    );

    return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    <h1 className="text-2xl font-bold mb-2">{spell.name}</h1>
                    <p>
                        {SpellSchoolNameList(spell.schools)}
                        {(() => {
                            const subSchoolNames = SpellSchoolNameList(spell.subschools);
                            return subSchoolNames.length > 0 ? ` (${subSchoolNames})` : '';
                        })()}
                        {(() => {
                            const descriptorNames = SpellDescriptorNameList(spell.descriptors);
                            return descriptorNames.length > 0 ? ` [${descriptorNames}]` : '';
                        })()}
                    </p>
                    <p><strong>Level:</strong> {GetClassLevelAbbr(spell.class_levels)}</p>
                    {spell.components && <p><strong>Components:</strong> {SpellComponentAbbrList(spell.components)}</p>}
                    {spell.cast_time && <p><strong>Casting Time:</strong> {spell.cast_time}</p>}
                    {spell.effect_desc && <p><strong>Effect:</strong> {spell.effect_desc}</p>}
                    {spell.area_desc && <p><strong>Area:</strong> {spell.area_desc}</p>}
                    {spell.range_str && <p><strong>Range:</strong> {spell.range_str}</p>}
                    {spell.target_desc && <p><strong>Target:</strong> {spell.target_desc}</p>}
                    {spell.duration_desc && <p><strong>Duration:</strong> {spell.duration_desc}</p>}
                    {spell.save_desc && <p><strong>Saving Throw:</strong> {spell.save_desc}</p>}
                    {spell.sr_desc && <p><strong>Spell Resistance:</strong> {spell.sr_desc}</p>}
                    {spell.sources && spell.sources.length > 0 && <p><strong>Source:</strong> {GetSourceDisplay(spell.sources)}</p>}
                    <div className="mt-3 p-2 rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                        <ProcessMarkdown markdown={spell.desc} />
                    </div>
                    <div className="mt-4 text-right">
                        <button type="button" onClick={() => navigate(`/spells${fromListParams ? `?${fromListParams}` : ''}`)} className="inline-block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 border dark:border-gray-500">Back to List</button>
                        {user && user.is_admin && (
                            <Link to={`/spells/${id}/edit`} state={{ fromListParams: fromListParams }} onClick={() => console.log('Navigating from SpellDetail to EditSpell with params:', fromListParams)} className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500">Edit Spell</Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
