import React, { useMemo } from 'react';

import { CacheQueryHooks } from '@/services/query/CacheQueryHooks';
import { CharacterCompanionRole } from '@shared/static-data';

import {
    buildRevisedStatBlock,
    formatCompanionExtras,
    formatSelectedFormExtras,
    RevisedStatBlock,
} from '../stat-block';
import type { RevisedStatBlockLookups } from '../stat-block/types';

import type { AnimalsPetsTabProps, CompanionBlockProps } from './types';

/**
 * Character viewer tab for companions, pets, and selected wild-shape forms.
 * Renders Alexandrian short revised 3.5 stat blocks from resolved character state.
 */
export function AnimalsPetsTab({
    resolvedCompanions,
    resolvedSelectedForms,
}: AnimalsPetsTabProps): React.JSX.Element {
    const skillsQuery = CacheQueryHooks.useSkillsCache();
    const featsQuery = CacheQueryHooks.useFeatsCache();
    const monstersQuery = CacheQueryHooks.useMonstersCache();

    const lookups = useMemo<RevisedStatBlockLookups>(() => {
        const skillNameById = new Map<number, string>();
        for (const skill of skillsQuery.data?.results ?? []) {
            skillNameById.set(skill.id, skill.name);
        }
        const featNameById = new Map<number, string>();
        for (const feat of featsQuery.data?.results ?? []) {
            featNameById.set(feat.id, feat.name);
        }
        return { skillNameById, featNameById };
    }, [skillsQuery.data?.results, featsQuery.data?.results]);

    const monsterNameById = useMemo(() => {
        const names = new Map<number, string>();
        for (const monster of monstersQuery.data?.results ?? []) {
            names.set(monster.id, monster.name);
        }
        return names;
    }, [monstersQuery.data?.results]);

    const classCompanions = resolvedCompanions.filter((row) => row.role !== CharacterCompanionRole.Pet);
    const pets = resolvedCompanions.filter((row) => row.role === CharacterCompanionRole.Pet);

    return (
        <div className="space-y-8">
            {classCompanions.length > 0 && (
                <section className="space-y-4">
                    {classCompanions.map((companion) => (
                        <CompanionBlock
                            key={companion.id}
                            companion={companion}
                            lookups={lookups}
                            monsterName={monsterNameById.get(companion.monsterId)}
                        />
                    ))}
                </section>
            )}

            {pets.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pets</h2>
                    {pets.map((companion) => (
                        <CompanionBlock
                            key={companion.id}
                            companion={companion}
                            lookups={lookups}
                            monsterName={monsterNameById.get(companion.monsterId)}
                        />
                    ))}
                </section>
            )}

            {resolvedSelectedForms.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Wild Shape Forms</h2>
                    {resolvedSelectedForms.map((form) => (
                        <RevisedStatBlock
                            key={form.id}
                            model={buildRevisedStatBlock({ block: form.computedStatBlock, lookups })}
                            extras={formatSelectedFormExtras(form)}
                        />
                    ))}
                </section>
            )}
        </div>
    );
}

/**
 * One companion or pet card. Skips the Alexandrian block when resolution produced no sheet.
 */
function CompanionBlock({ companion, lookups, monsterName }: CompanionBlockProps): React.JSX.Element {
    if (!companion.computedStatBlock) {
        return (
            <p className="text-sm text-gray-500">
                {companion.name ?? monsterName ?? `Companion ${companion.id}`} has no computed stat block.
            </p>
        );
    }
    return (
        <RevisedStatBlock
            model={buildRevisedStatBlock({ block: companion.computedStatBlock, lookups })}
            extras={formatCompanionExtras(companion, monsterName)}
        />
    );
}
