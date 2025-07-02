import { useParams, Link, useLocation } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { Api } from '@/services/Api';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { UseAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { GetClassLevelAbbr } from './spellUtil';
import { SpellSchoolNameList, SpellDescriptorNameList, SpellComponentAbbrList, GetSourceDisplay } from '@shared/static-data';
import type { Spell } from '@shared/prisma-client/client';
import { z } from 'zod';

// Zod validation schema for spell ID parameter
const SpellIdParamSchema = z.object({
    id: z.string().transform((val) => parseInt(val)),
});

type SpellIdParam = z.infer<typeof SpellIdParamSchema>;

// Extended spell type with relations
type SpellWithRelations = Spell & {
    levelMapping: Array<{
        classId: number;
        level: number;
    }>;
    schools: Array<{ schoolId: number }>;
    subschools: Array<{ subschoolId: number }>;
    descriptors: Array<{ descriptorId: number }>;
    sources: Array<{ bookId: number; pageNumber: number | null }>;
    components?: number[];
};

export function SpellDetail(): React.JSX.Element {
    const { id } = useParams();
    const [spell, setSpell] = useState<SpellWithRelations | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { user } = UseAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async () => {
            try {
                // Validate the ID parameter
                const validatedParams = SpellIdParamSchema.parse({ id });

                const data = await Api<SpellWithRelations>(`/spells/${validatedParams.id}`);
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
                        {SpellSchoolNameList(spell.schools.map(s => s.schoolId))}
                        {(() => {
                            const subSchoolNames = SpellSchoolNameList(spell.subschools.map(s => s.subschoolId));
                            return subSchoolNames.length > 0 ? ` (${subSchoolNames})` : '';
                        })()}
                        {(() => {
                            const descriptorNames = SpellDescriptorNameList(spell.descriptors.map(d => d.descriptorId));
                            return descriptorNames.length > 0 ? ` [${descriptorNames}]` : '';
                        })()}
                    </p>
                    <p><strong>Level:</strong> {GetClassLevelAbbr(spell.levelMapping)}</p>
                    {spell.components && <p><strong>Components:</strong> {SpellComponentAbbrList(spell.components)}</p>}
                    {spell.castingTime && <p><strong>Casting Time:</strong> {spell.castingTime}</p>}
                    {spell.effect && <p><strong>Effect:</strong> {spell.effect}</p>}
                    {spell.area && <p><strong>Area:</strong> {spell.area}</p>}
                    {spell.range && <p><strong>Range:</strong> {spell.range}</p>}
                    {spell.target && <p><strong>Target:</strong> {spell.target}</p>}
                    {spell.duration && <p><strong>Duration:</strong> {spell.duration}</p>}
                    {spell.savingThrow && <p><strong>Saving Throw:</strong> {spell.savingThrow}</p>}
                    {spell.spellResistance && <p><strong>Spell Resistance:</strong> {spell.spellResistance}</p>}
                    {spell.sources && spell.sources.length > 0 && <p><strong>Source:</strong> {GetSourceDisplay(spell.sources.map(s => ({ book_id: s.bookId, page_number: s.pageNumber })))}</p>}
                    <div className="mt-3 p-2 rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                        <ProcessMarkdown markdown={spell.description || ''} />
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
