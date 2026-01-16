import React, { useEffect, useState } from 'react';

import { useCacheFunctions } from '@/services/cache';
import { SpellLevelMapping } from '@shared/schema';

interface AsyncClassDisplayProps {
    mappings: SpellLevelMapping[];
    baseLevel: number;
}

export function AsyncClassDisplay({ mappings, baseLevel }: AsyncClassDisplayProps): React.JSX.Element {
    const { getClassSummaryById } = useCacheFunctions();
    const [display, setDisplay] = useState<string>('');

    useEffect(() => {
        if (!mappings || mappings.length === 0) {
            setDisplay('');
            return;
        }

        const loadClassDisplay = async () => {
            try {
                const formattedClasses = await Promise.all(mappings.map(async cls => {
                    const classItem = getClassSummaryById(cls.classId);
                    if (classItem) {
                        if (cls.level !== baseLevel) {
                            return `${classItem.abbreviation} ${cls.level}`;
                        } else {
                            return classItem.abbreviation;
                        }
                    }
                    return 'Unknown Class';
                }));

                setDisplay(formattedClasses.join(', '));
            } catch (error) {
                setDisplay('Error loading classes');
            }
        };

        loadClassDisplay();
    }, [mappings, baseLevel, getClassSummaryById]);

    return <span>{display}</span>;
}
