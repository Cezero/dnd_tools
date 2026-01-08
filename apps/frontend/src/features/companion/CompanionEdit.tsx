import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm,
} from '@/components/forms';
import { CustomSelect } from '@/components/forms/FormComponents';
import { MonsterSearchInput } from '@/components/forms/MonsterSearchInput';
import { CompanionQueryHooks } from '@/services/query/CompanionQueryHooks';
import { CacheQueryHooks } from '@/services/query/CacheQueryHooks';
import { CreateCompanionRequest, UpdateCompanionRequest, UpdateCompanionSchema, CreateCompanionSchema, CompanionWithRelations, CreateCompanionBenefitMapRequest } from '@shared/schema';
import { COMPANION_TYPE_LIST, CompanionType, COMPANION_BENEFIT_TYPE_BY_ID } from '@shared/static-data';
import { CompanionBenefitEdit } from './CompanionBenefitEdit';
import { CompanionBenefitOptions, formatCompanionBenefit } from './CompanionUtil';
import { CompanionBenefitType } from '@shared/static-data';

type CompanionFormData = CreateCompanionRequest | UpdateCompanionRequest;

export function CompanionEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';
    const isNew = id === 'new';

    const createMutation = CompanionQueryHooks.useCreateCompanion();
    const updateMutation = CompanionQueryHooks.useUpdateCompanion();

    const [companion, setCompanion] = useState<CompanionWithRelations | null>(null);
    const [isLoadingCompanion, setIsLoadingCompanion] = useState(false);
    const [companionError, setCompanionError] = useState<Error | null>(null);

    // Fetch monster cache to get monster names
    const { data: monstersCache } = CacheQueryHooks.useMonstersCache();

    const [formData, setFormData] = useState<CompanionFormData>({
        type: CompanionType.Familiar,
        monsterId: undefined,
        minLevel: undefined,
        benefits: [],
    });

    const [isAddBenefitModalOpen, setIsAddBenefitModalOpen] = useState(false);
    const [editingBenefit, setEditingBenefit] = useState<CreateCompanionBenefitMapRequest | null>(null);

    const form = useValidatedForm(
        isNew ? CreateCompanionSchema : UpdateCompanionSchema,
        formData,
        setFormData
    );

    // Load companion data only when editing (not creating new)
    useEffect(() => {
        const fetchCompanion = async () => {
            if (isNew || !id) {
                return;
            }

            const companionId = parseInt(id, 10);
            if (isNaN(companionId)) {
                return;
            }

            try {
                setIsLoadingCompanion(true);
                setCompanionError(null);
                const fetchedCompanion = await CompanionQueryHooks.getCompanionById(companionId);
                setCompanion(fetchedCompanion);

                if (fetchedCompanion) {
                    setFormData({
                        type: fetchedCompanion.type,
                        monsterId: fetchedCompanion.monsterId,
                        minLevel: fetchedCompanion.minLevel || undefined,
                        benefits: fetchedCompanion.benefits?.map(b => ({
                            typeId: b.typeId,
                            referenceId: b.referenceId,
                            amount: b.amount,
                            index: b.index,
                            conditions: b.conditions?.map(c => ({
                                conditionType: c.conditionType,
                                conditionValue: c.conditionValue,
                            })) || [],
                        })) || [],
                    });
                }
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Failed to fetch companion');
                setCompanionError(error);
                console.error('Error loading companion:', error);
            } finally {
                setIsLoadingCompanion(false);
            }
        };

        fetchCompanion();
    }, [id, isNew]);

    const HandleAddBenefitClick = useCallback(() => {
        setEditingBenefit({
            index: formData.benefits?.length || 0,
            typeId: null,
            referenceId: null,
            amount: null,
            conditions: [],
        });
        setIsAddBenefitModalOpen(true);
    }, [formData.benefits]);

    const HandleEditBenefitClick = useCallback((benefit: CreateCompanionBenefitMapRequest) => {
        setEditingBenefit(benefit);
        setIsAddBenefitModalOpen(true);
    }, []);

    const HandleSaveBenefit = useCallback((savedBenefit: CreateCompanionBenefitMapRequest) => {
        setFormData(prev => {
            const updatedBenefits = [...(prev.benefits || [])];
            updatedBenefits[savedBenefit.index] = savedBenefit;
            return { ...prev, benefits: updatedBenefits };
        });
        setIsAddBenefitModalOpen(false);
        setEditingBenefit(null);
    }, []);

    const HandleDeleteBenefit = useCallback(async (benefitIndex: number) => {
        if (window.confirm('Are you sure you want to remove this benefit from the companion?')) {
            setFormData(prev => {
                const filteredBenefits = prev.benefits?.filter((_, index) => index !== benefitIndex) || [];
                // Re-index the remaining benefits
                const reindexedBenefits = filteredBenefits.map((benefit, newIndex) => ({
                    ...benefit,
                    index: newIndex
                }));
                return {
                    ...prev,
                    benefits: reindexedBenefits
                };
            });
        }
    }, []);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate the entire form
        if (!form.validation.validateForm(formData)) {
            return;
        }

        try {
            if (isNew) {
                await createMutation.mutateAsync({ requestData: formData });
            } else if (id && id !== 'new') {
                const companionId = parseInt(id, 10);
                if (!isNaN(companionId)) {
                    await updateMutation.mutateAsync({
                        requestData: formData,
                        pathParams: { id: companionId }
                    });
                }
            }
            navigate(`/companions${fromListParams ? `?${fromListParams}` : ''}`);
        } catch (error) {
            console.error('Error saving companion:', error);
        }
    };

    if (isLoadingCompanion && !isNew) {
        return <div className="p-4">Loading...</div>;
    }

    if (companionError) {
        return <div className="p-4 text-red-500">Error loading companion: {companionError.message}</div>;
    }

    // Get monster name from companion relation (when editing) or from cache (when creating/editing)
    const monsterNameFromCompanion = companion?.monster?.name;
    const monsterNameFromCache = formData.monsterId
        ? monstersCache?.results?.find(m => m.id === formData.monsterId)?.name
        : undefined;
    const monsterName = monsterNameFromCompanion || monsterNameFromCache;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">
                {isNew ? 'New Companion' : `Edit Companion${monsterName ? `: ${monsterName}` : ''}`}
            </h1>
            <ValidatedForm
                onSubmit={onSubmit}
                validationState={form.validation.validationState}
                isLoading={createMutation.isPending || updateMutation.isPending}
                formData={formData}
                setFormData={setFormData}
                validation={form.validation}
            >
                <div className="w-[40%] space-y-4">
                    <CustomSelect
                        label="Type"
                        value={formData.type ?? CompanionType.Familiar}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                        options={COMPANION_TYPE_LIST}
                        componentExtraClassName="flex items-center gap-4"
                        labelExtraClassName="w-32 flex-shrink-0"
                    />
                    <MonsterSearchInput
                        label="Monster"
                        value={formData.monsterId ?? null}
                        onValueChange={(monsterId) => setFormData({ ...formData, monsterId: monsterId ?? undefined })}
                        placeholder="Search for a monster..."
                        componentExtraClassName="flex items-center gap-4 [&>div]:flex-1"
                        labelExtraClassName="w-32 flex-shrink-0"
                    />
                    <ValidatedInput
                        field="minLevel"
                        label="Minimum Level"
                        type="number"
                        placeholder="Enter minimum character level"
                        componentExtraClassName="flex items-center gap-4"
                        labelExtraClassName="w-32 flex-shrink-0"
                        inputExtraClassName="flex-1"
                    />
                    {formData.monsterId && (monsterName || formData.minLevel) && (
                        <div className="text-sm text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            {monsterName && (
                                <p><strong>Monster:</strong> {monsterName}</p>
                            )}
                            {formData.minLevel && (
                                <p><strong>Minimum Level:</strong> {formData.minLevel}</p>
                            )}
                        </div>
                    )}

                    {/* Benefits Section */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Benefits</h2>
                            <button
                                type="button"
                                onClick={HandleAddBenefitClick}
                                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Add Benefit
                            </button>
                        </div>
                        <div className="flex items-center gap-2 border p-3 rounded dark:border-gray-600">
                            {formData.benefits && formData.benefits.length > 0 ? (
                                <>
                                    {formData.benefits.map((benefit, index) => {
                                        // Format the entire benefit using the formatting system
                                        const formattedBenefit = formatCompanionBenefit(benefit);
                                        return (
                                            <div key={index} className="flex gap-2 items-center rounded border p-2 dark:border-gray-700">
                                                <button
                                                    type="button"
                                                    onClick={() => HandleEditBenefitClick(benefit)}
                                                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-600"
                                                >
                                                    {formattedBenefit}
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Delete Benefit"
                                                    onClick={() => HandleDeleteBenefit(index)}
                                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </>
                            ) : (
                                <p className="text-gray-500 text-sm">No benefits added</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-2">
                        <button
                            type="button"
                            onClick={() => navigate(`/companions${fromListParams ? `?${fromListParams}` : ''}`)}
                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                        >
                            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </ValidatedForm>

            {/* Benefit Edit Modal */}
            {editingBenefit && (
                <CompanionBenefitEdit
                    isOpen={isAddBenefitModalOpen}
                    onClose={() => {
                        setIsAddBenefitModalOpen(false);
                        setEditingBenefit(null);
                    }}
                    onSave={HandleSaveBenefit}
                    initialBenefitData={editingBenefit}
                    companionId={isNew ? 0 : (id ? parseInt(id, 10) : 0)}
                />
            )}
        </div>
    );
}

