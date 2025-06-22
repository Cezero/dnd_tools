import { useParams, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import lookupService from '@/services/LookupService';
import api from '@/services/api';
import ProcessMarkdown from '@/components/markdown/ProcessMarkdown';
import { useAuth } from '@/auth/authProvider';
import { useNavigate } from 'react-router-dom';
import { getClassLevelAbbr } from '../lib/spellUtil';
import { SCHOOL_NAME_LIST, SUBSCHOOL_NAME_LIST, DESCRIPTOR_NAME_LIST, COMPONENT_ABBREVIATION_LIST } from 'shared-data/src/spellData';

function SpellDetail() {
    const { id } = useParams();
    const [spell, setSpell] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const initialize = async () => {
            try {
                await lookupService.initialize();
                const data = await api(`/spells/${id}`);
                setSpell(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize or fetch spell:', error);
                setIsLoading(false);
            }
        };
        initialize();
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
                    <h1 className="text-2xl font-bold mb-2">{spell.spell_name}</h1>
                    <p>
                        {SCHOOL_NAME_LIST(spell.schools)}
                        {(() => {
                            const subSchoolNames = SUBSCHOOL_NAME_LIST(spell.subschools);
                            return subSchoolNames.length > 0 ? ` (${subSchoolNames})` : '';
                        })()}
                        {(() => {
                            const descriptorNames = DESCRIPTOR_NAME_LIST(spell.descriptors);
                            return descriptorNames.length > 0 ? ` [${descriptorNames}]` : '';
                        })()}
                    </p>
                    <p><strong>Level:</strong> {getClassLevelAbbr(spell.class_levels)}</p>
                    {spell.components && <p><strong>Components:</strong> {COMPONENT_ABBREVIATION_LIST(spell.components)}</p>}
                    {spell.cast_time && <p><strong>Casting Time:</strong> {spell.cast_time}</p>}
                    {spell.spell_effect && <p><strong>Effect:</strong> {spell.spell_effect}</p>}
                    {spell.spell_area && <p><strong>Area:</strong> {spell.spell_area}</p>}
                    {spell.spell_range && <p><strong>Range:</strong> {spell.spell_range}</p>}
                    {spell.spell_target && <p><strong>Target:</strong> {spell.spell_target}</p>}
                    {spell.spell_duration && <p><strong>Duration:</strong> {spell.spell_duration}</p>}
                    {spell.spell_save && <p><strong>Saving Throw:</strong> {spell.spell_save}</p>}
                    {spell.spell_resistance && <p><strong>Spell Resistance:</strong> {spell.spell_resistance}</p>}
                    {spell.sources && spell.sources.length > 0 && <p><strong>Source:</strong> {lookupService.getSourceDisplay(spell.sources)}</p>}
                    <div className="mt-3 p-2 rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                        <ProcessMarkdown markdown={spell.spell_description} />
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

export default SpellDetail;