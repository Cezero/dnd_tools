import React, { useEffect, useMemo, useState } from 'react';

import { MonsterSearchInput } from '@/components/forms';
import { CharacterEditStateUpdateType, type TabComponentProps } from '@/features/character/types';
import { createStableDraftRowId } from '@/features/character/utils/draftKeyUtils';
import { TrickPurposeQueryHooks } from '@/features/trick-purpose/TrickPurposeQueryHooks';
import { CacheQueryHooks } from '@/services/query/CacheQueryHooks';
import { TrickQueryHooks } from '@/services/query/TrickQueryHooks';
import type { CharacterCompanionDraft, ResolvedCharacterCompanionDraft } from '@shared/schema';
import { MonsterTypeId } from '@shared/static-data';

import { CompanionEditorCard } from './CompanionEditorCard';
import { createPetDraft, mergeClassCompanionsFromChoices } from './companionDraftUtils';
import type { CompanionEditorLookups } from './types';
import { WildShapeSection } from './WildShapeSection';

/**
 * Character editor tab for class companions, pets, and selected wild-shape forms.
 * All edits write into the character draft session and persist on Save.
 */
export function AnimalsPetsTab({
    state,
    updateState,
    resolvedData,
}: TabComponentProps): React.JSX.Element {
    const characterId = state.characterId;
    const hasCharacterId = characterId !== null && characterId !== 0;
    const [pendingPetMonsterId, setPendingPetMonsterId] = useState<number | null>(null);

    const purposesQuery = TrickPurposeQueryHooks.useGetTrickPurposes(undefined, { enabled: hasCharacterId });
    const tricksQuery = TrickQueryHooks.useGetTricks(undefined, { enabled: hasCharacterId });
    const skillsQuery = CacheQueryHooks.useSkillsCache(undefined, { enabled: hasCharacterId });
    const featsQuery = CacheQueryHooks.useFeatsCache(undefined, { enabled: hasCharacterId });
    const companionsCacheQuery = CacheQueryHooks.useCompanionsCache(undefined, { enabled: hasCharacterId });
    const monstersQuery = CacheQueryHooks.useMonstersCache(undefined, { enabled: hasCharacterId });

    const lookups: CompanionEditorLookups = useMemo(() => {
        const companionTypeById = new Map<number, number>();
        for (const template of companionsCacheQuery.data?.results ?? []) {
            companionTypeById.set(template.id, template.type);
        }
        const monsterNameById = new Map<number, string>();
        for (const monster of monstersQuery.data?.results ?? []) {
            monsterNameById.set(monster.id, monster.name);
        }
        for (const template of companionsCacheQuery.data?.results ?? []) {
            if (template.name) {
                monsterNameById.set(template.monsterId, template.name);
            }
        }
        return {
            purposes: purposesQuery.data?.results ?? [],
            tricks: tricksQuery.data?.results ?? [],
            skills: skillsQuery.data?.results ?? [],
            feats: featsQuery.data?.results ?? [],
            companionTypeById,
            monsterNameById,
        };
    }, [
        companionsCacheQuery.data?.results,
        featsQuery.data?.results,
        monstersQuery.data?.results,
        purposesQuery.data?.results,
        skillsQuery.data?.results,
        tricksQuery.data?.results,
    ]);

    const resolvedRows = resolvedData.resolvedCompanions;

    const findResolved = (companion: CharacterCompanionDraft): ResolvedCharacterCompanionDraft | undefined => {
        return resolvedRows.find((row) => row.id === companion.id)
            ?? resolvedRows.find((row) => (
                companion.companionId !== null
                && companion.companionId !== undefined
                && row.companionId === companion.companionId
            ))
            ?? resolvedRows.find((row) => (
                (companion.companionId === null || companion.companionId === undefined)
                && row.companionId == null
                && row.monsterId === companion.monsterId
            ));
    };

    useEffect(() => {
        if (!hasCharacterId || characterId === null) {
            return;
        }
        const merged = mergeClassCompanionsFromChoices({
            characterId,
            companions: state.companions,
            featureChoices: state.featureChoices,
            features: resolvedData.features,
            companionTemplates: companionsCacheQuery.data?.results ?? [],
        });
        if (merged) {
            updateState({
                type: CharacterEditStateUpdateType.SET_COMPANIONS,
                payload: { companions: merged },
            });
        }
    }, [
        characterId,
        companionsCacheQuery.data?.results,
        hasCharacterId,
        resolvedData.features,
        state.companions,
        state.featureChoices,
        updateState,
    ]);

    const classCompanions = state.companions.filter((row) => row.companionId !== null && row.companionId !== undefined);
    const pets = state.companions.filter((row) => row.companionId === null || row.companionId === undefined);

    const replaceCompanion = (next: CharacterCompanionDraft) => {
        updateState({
            type: CharacterEditStateUpdateType.SET_COMPANIONS,
            payload: {
                companions: state.companions.map((row) => (row.id === next.id ? next : row)),
            },
        });
    };

    const handleAddPet = (monsterId: number | null) => {
        setPendingPetMonsterId(monsterId);
        if (!monsterId || characterId === null) {
            return;
        }
        updateState({
            type: CharacterEditStateUpdateType.SET_COMPANIONS,
            payload: {
                companions: [...state.companions, createPetDraft(characterId, monsterId)],
            },
        });
        setPendingPetMonsterId(null);
    };

    const handleDeletePet = (id: number) => {
        if (!window.confirm('Remove this pet?')) {
            return;
        }
        updateState({
            type: CharacterEditStateUpdateType.SET_COMPANIONS,
            payload: {
                companions: state.companions.filter((row) => row.id !== id),
            },
        });
    };

    const handleAddForm = (featureId: number, monsterId: number) => {
        if (characterId === null) {
            return;
        }
        updateState({
            type: CharacterEditStateUpdateType.SET_SELECTED_FORMS,
            payload: {
                selectedForms: [
                    ...state.selectedForms,
                    {
                        id: createStableDraftRowId(`form:${characterId}:${featureId}:${monsterId}`),
                        characterId,
                        featureId,
                        monsterId,
                        sortOrder: state.selectedForms.length,
                    },
                ],
            },
        });
    };

    const handleRemoveForm = (selectedFormId: number) => {
        updateState({
            type: CharacterEditStateUpdateType.SET_SELECTED_FORMS,
            payload: {
                selectedForms: state.selectedForms
                    .filter((form) => form.id !== selectedFormId)
                    .map((form, index) => ({ ...form, sortOrder: index })),
            },
        });
    };

    if (!hasCharacterId || characterId === null) {
        return (
            <div className="p-6">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    Start the character session to add pets, name companions, or select wild-shape forms.
                </p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8">
            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">Class Companions</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Animal companions and familiars come from the Choices tab. Name companions here. Handle Animal and bonus HD assignments apply to animal companions, not familiars.
                    </p>
                </div>
                {classCompanions.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No class companion or familiar selected.
                    </p>
                ) : (
                    classCompanions.map((companion) => (
                        <CompanionEditorCard
                            key={companion.id}
                            companion={companion}
                            resolved={findResolved(companion)}
                            lookups={lookups}
                            canDelete={false}
                            onChange={replaceCompanion}
                            onDelete={() => undefined}
                        />
                    ))
                )}
            </section>

            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">Pets</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Any Animal-type monster can be added as a pet. Pets use raw monster stats plus Handle Animal training.
                    </p>
                </div>
                <MonsterSearchInput
                    value={pendingPetMonsterId}
                    onValueChange={handleAddPet}
                    label="Add pet"
                    placeholder="Search animals..."
                    filter={(monster) => monster.typeIds?.includes(MonsterTypeId.Animal) ?? false}
                />
                {pets.map((companion) => (
                    <CompanionEditorCard
                        key={companion.id}
                        companion={companion}
                        resolved={findResolved(companion)}
                        lookups={lookups}
                        canDelete
                        onChange={replaceCompanion}
                        onDelete={() => handleDeletePet(companion.id)}
                    />
                ))}
            </section>

            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">Wild Shape Forms</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Select a few eligible forms. Computed Alternate Form sheets appear on the character view.
                    </p>
                </div>
                <WildShapeSection
                    characterId={characterId}
                    features={resolvedData.features}
                    selectedForms={state.selectedForms}
                    onAdd={handleAddForm}
                    onRemove={handleRemoveForm}
                />
            </section>
        </div>
    );
}
