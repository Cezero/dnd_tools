import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { CreateFeat, UpdateFeat, FetchFeatById } from '@/features/admin/features/feat-management/FeatService';
import { FeatPrereqAssoc } from '@/features/admin/features/featMgmt/components/FeatPrereqAssoc';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/24/solid';
import { FEAT_TYPE_BY_ID, FEAT_PREREQUISITE_TYPES, FEAT_TYPE_LIST, FEAT_BENEFIT_TYPE_BY_ID } from '@shared/static-data';
import { FeatBenefitEdit } from '@/features/admin/features/featMgmt/components/FeatBenefitEdit';
import { FeatOptions } from '@/lib/FeatUtil';

export function FeatEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [feat, setFeat] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [isAddBenefitModalOpen, setIsAddBenefitModalOpen] = useState(false);
    const [isAddPrereqModalOpen, setIsAddPrereqModalOpen] = useState(false);
    const [editingBenefit, setEditingBenefit] = useState(null);

    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async () => {
            try {
                await FeatOptions.initialize();
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize:', error);
                setIsLoading(false);
            }
        };
        Initialize();
    }, []);

    useEffect(() => {
        const FetchFeatData = async () => {
            try {
                if (id === 'new') {
                    setFeat({
                        feat_name: '',
                        feat_type: null,
                        feat_description: '',
                        feat_benefit: '',
                        feat_normal: '',
                        feat_special: '',
                        feat_prereq: '',
                        feat_multi_times: false,
                        feat_fighter_bonus: false,
                        benefits: [],
                        prereqs: []
                    });
                } else {
                    const data = await FetchFeatById(id);
                    setFeat({
                        feat_name: data.feat_name,
                        feat_type: data.feat_type,
                        feat_description: data.feat_description || '',
                        feat_benefit: data.feat_benefit || '',
                        feat_normal: data.feat_normal || '',
                        feat_special: data.feat_special || '',
                        feat_prereq: data.feat_prereq || '',
                        feat_multi_times: data.feat_multi_times === 1,
                        feat_fighter_bonus: data.feat_fighter_bonus === 1,
                        benefits: data.benefits || [],
                        prereqs: data.prereqs || []
                    });
                }
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        FetchFeatData();
    }, [id]);

    const HandleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFeat(prevFeat => ({
            ...prevFeat,
            [name]: type === 'checkbox' ? checked : (name === 'feat_type' ? parseInt(value) : value)
        }));
    };

    const HandleMarkdownChange = (name) => (content) => {
        setFeat(prevFeat => ({
            ...prevFeat,
            [name]: content
        }));
    };

    const HandleAddBenefitClick = useCallback(() => {
        setEditingBenefit({ benefit_index: feat.benefits.length, feat_id: id, benefit_type: null, benefit_type_id: '', benefit_amount: '' });
        setIsAddBenefitModalOpen(true);
    }, [feat]);

    const HandleEditBenefitClick = useCallback((benefit) => {
        setEditingBenefit(benefit);
        setIsAddBenefitModalOpen(true);
    }, []);

    const HandleSaveBenefit = useCallback((savedBenefit) => {
        setFeat(prevFeat => {
            const updatedBenefits = prevFeat.benefits;
            updatedBenefits[savedBenefit.benefit_index] = savedBenefit;
            return { ...prevFeat, benefits: updatedBenefits };
        });
        setIsAddBenefitModalOpen(false);
        setEditingBenefit(null);
    }, []);

    const HandleDeleteBenefit = useCallback(async (benefitIndex) => {
        if (window.confirm('Are you sure you want to remove this benefit from the feat?')) {
            setFeat(prevFeat => ({
                ...prevFeat,
                benefits: prevFeat.benefits.toSpliced(benefitIndex, 1)
            }));
            setMessage('Benefit removed successfully from feat!');
        }
    }, []);

    const HandleAddOrUpdatePrereq = useCallback((selectedPrereqObjects) => {
        setFeat(prevFeat => {
            const existingPrereqsMap = new Map(prevFeat.prereqs.map(p => [p.prereq_id, p]));

            const updatedPrereqs = selectedPrereqObjects.map(selectedPrereq => {
                const existingPrereq = existingPrereqsMap.get(selectedPrereq.prereq_id);
                return {
                    ...selectedPrereq,
                    prereq_amount: existingPrereq ? existingPrereq.prereq_amount : '',
                    prereq_type_id: existingPrereq ? existingPrereq.prereq_type_id : '',
                };
            });
            return { ...prevFeat, prereqs: updatedPrereqs };
        });
        setIsAddPrereqModalOpen(false);
    }, []);

    const HandleDeletePrereq = useCallback(async (prereqId) => {
        if (window.confirm('Are you sure you want to remove this prerequisite from the feat?')) {
            setFeat(prevFeat => ({
                ...prevFeat,
                prereqs: prevFeat.prereqs.filter(prereq => prereq.prereq_id !== prereqId)
            }));
            setMessage('Prerequisite removed successfully from feat!');
        }
    }, []);

    const HandleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        try {
            const payload = {
                feat_name: feat.feat_name,
                feat_type: feat.feat_type ? parseInt(feat.feat_type) : null,
                feat_description: feat.feat_description,
                feat_benefit: feat.feat_benefit,
                feat_normal: feat.feat_normal,
                feat_special: feat.feat_special,
                feat_prereq: feat.feat_prereq,
                feat_multi_times: feat.feat_multi_times ? 1 : 0,
                feat_fighter_bonus: feat.feat_fighter_bonus ? 1 : 0,
            };

            if (feat.benefits && feat.benefits.length > 0) {
                payload.benefits = feat.benefits.map(benefit => ({
                    benefit_type: benefit.benefit_type,
                    benefit_type_id: benefit.benefit_type_id,
                    benefit_amount: benefit.benefit_amount,
                }));
            }
            if (feat.prereqs && feat.prereqs.length > 0) {
                payload.prereqs = feat.prereqs.map(prereq => ({
                    prereq_type: prereq.prereq_type,
                    prereq_type_id: prereq.prereq_type_id,
                    prereq_amount: prereq.prereq_amount,
                }));
            }

            if (id === 'new') {
                const response = await CreateFeat(payload);
                setMessage('Feat created successfully!');
                navigate(`/admin/feats/${response}`, { state: { fromListParams: fromListParams, refresh: true } });
            } else {
                await UpdateFeat(id, payload);
                setMessage('Feat updated successfully!');
                navigate(`/admin/feats/${id}`, { state: { fromListParams: fromListParams, refresh: true } });
            }
        } catch (err) {
            setError(err);
            setMessage(`Error updating feat: ${err.message || err}`);
        }
    };

    if (isLoading) return <div className="p-4 bg-white dark:bg-[#121212]">Loading feat for editing...</div>;
    if (error) return <div className="p-4 bg-white dark:bg-[#121212] dark:text-red-500">Error: {error.message}</div>;
    if (!feat && id !== 'new') return <div className="p-4 bg-white dark:bg-[#121212]">Feat not found.</div>;

    return (
        <div className="p-4 bg-white dark:bg-[#121212] scrollbar-track-gray-300 scrollbar-thumb-gray-400 dark:scrollbar-track-gray-700 dark:scrollbar-thumb-gray-500">
            <h1 className="text-2xl font-bold mb-4">{id === 'new' ? 'Create New Feat' : `Edit Feat: ${feat.feat_name}`}</h1>
            {message && <div className="mb-4 p-2 rounded text-green-700 bg-green-100 dark:bg-green-800 dark:text-green-200">{message}</div>}
            {error && <div className="mb-4 p-2 rounded text-red-700 bg-red-100 dark:bg-red-800 dark:text-red-200">Error: {error.message || String(error)}</div>}
            <form onSubmit={HandleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                        <label htmlFor="feat_name" className="block text-lg font-medium w-30">Feat Name:</label>
                        <input type="text" id="feat_name" name="feat_name" value={feat.feat_name || ''} onChange={HandleChange} className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                        <div className="flex items-center gap-2 pr-2">
                            <label htmlFor="feat_type" className="block text-lg font-medium">Feat Type:</label>
                            <Listbox
                                value={feat.feat_type || ''}
                                onChange={(selectedId) => HandleChange({ target: { name: 'feat_type', value: selectedId } })}
                            >
                                <div className="relative mt-1">
                                    <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                        <span className="block truncate">{FEAT_TYPE_BY_ID[feat.feat_type]?.name || 'Select a feat type'}</span>
                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        </span>
                                    </ListboxButton>
                                    <Transition
                                        leave="transition ease-in duration-100"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto scrollbar-thin rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:text-gray-100">
                                            <ListboxOption
                                                className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 dark:text-gray-100 hover:bg-blue-600 hover:text-white"
                                                value={null}
                                            >
                                                <span className="block truncate">
                                                    Select a feat type
                                                </span>
                                            </ListboxOption>
                                            {FEAT_TYPE_LIST.map(type => (
                                                <ListboxOption
                                                    key={type.id}
                                                    className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 dark:text-gray-100 hover:bg-blue-600 hover:text-white"
                                                    value={type.id}
                                                >
                                                    <span className="block truncate">
                                                        {type.name}
                                                    </span>
                                                </ListboxOption>
                                            ))}
                                        </ListboxOptions>
                                    </Transition>
                                </div>
                            </Listbox>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <label htmlFor="feat_multi_times" className="ml-2 text-lg font-medium">Multiple Times:</label>
                                <input type="checkbox" id="feat_multi_times" name="feat_multi_times" checked={feat.feat_multi_times} onChange={HandleChange} className="form-checkbox h-5 w-5 text-blue-600 rounded dark:bg-gray-700 dark:border-gray-600 accent-blue-600 checked:bg-blue-600 dark:checked:bg-blue-600" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label htmlFor="feat_fighter_bonus" className="ml-2 text-lg font-medium">Fighter Bonus Feat:</label>
                                <input type="checkbox" id="feat_fighter_bonus" name="feat_fighter_bonus" checked={feat.feat_multi_times} onChange={HandleChange} className="form-checkbox h-5 w-5 text-blue-600 rounded dark:bg-gray-700 dark:border-gray-600 accent-blue-600 checked:bg-blue-600 dark:checked:bg-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="md:col-span-2 mb-0">
                        <MarkdownEditor
                            id="feat_description"
                            name="feat_description"
                            label="Description"
                            value={feat.feat_description || ''}
                            onChange={HandleMarkdownChange('feat_description')}
                        />
                    </div>
                </div>
                <div className="md:col-span-2 mb-0">
                    <MarkdownEditor
                        id="feat_benefit"
                        name="feat_benefit"
                        label="Benefit"
                        value={feat.feat_benefit || ''}
                        onChange={HandleMarkdownChange('feat_benefit')}
                    />
                </div>
                <div className="md:col-span-2">
                    <h3 className="text-lg font-bold mb-2">Benefits</h3>
                    {feat.benefits && feat.benefits.length > 0 ? (
                        <div className="space-y-2 border p-3 rounded dark:border-gray-600 mb-2">
                            {feat.benefits.map(benefit => (
                                <div key={benefit.benefit_index} className="rounded border p-2 dark:border-gray-700 grid grid-cols-[2fr_0.1fr] gap-2 items-center">
                                    <div className="flex items-center gap-2">
                                        <div>
                                            {FEAT_BENEFIT_TYPE_BY_ID[benefit.benefit_type]?.name}:
                                        </div>
                                        <div>
                                            {FeatOptions.get(benefit.benefit_type)[benefit.benefit_type_id].name || ''}
                                        </div>
                                        <div>
                                            {(benefit.benefit_amount > 0 ? `+${benefit.benefit_amount}` : `${benefit.benefit_amount}`) || ''}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => HandleDeleteBenefit(benefit.benefit_index)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                        <button type="button" onClick={() => HandleEditBenefitClick(benefit)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-600">
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-500 dark:text-gray-400 mb-2">No benefits added yet.</div>
                    )}

                    <button
                        type="button"
                        onClick={HandleAddBenefitClick}
                        className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 text-white"
                    >
                        Add Benefit
                    </button>
                </div>
                <div className="md:col-span-2 mb-0">
                    <MarkdownEditor
                        id="feat_normal"
                        name="feat_normal"
                        label="Normal"
                        value={feat.feat_normal || ''}
                        onChange={HandleMarkdownChange('feat_normal')}
                    />
                </div>
                <div className="md:col-span-2 mb-0">
                    <MarkdownEditor
                        id="feat_special"
                        name="feat_special"
                        label="Special"
                        value={feat.feat_special || ''}
                        onChange={HandleMarkdownChange('feat_special')}
                    />
                </div>
                <div className="md:col-span-2 mb-0">
                    <MarkdownEditor
                        id="feat_prereq"
                        name="feat_prereq"
                        label="Prerequisite"
                        value={feat.feat_prereq || ''}
                        onChange={HandleMarkdownChange('feat_prereq')}
                    />
                </div>
                <div className="md:col-span-2">
                    <h3 className="text-lg font-bold mb-2">Prerequisites</h3>
                    {feat.prereqs && feat.prereqs.length > 0 ? (
                        <div className="space-y-2 border p-3 rounded dark:border-gray-600 mb-2">
                            {feat.prereqs.map(prereq => (
                                <div key={prereq.prereq_id} className="rounded border p-2 dark:border-gray-700 grid grid-cols-[2fr_0.1fr] gap-2 items-center">
                                    <div className="w-full">
                                        <p><strong>Type:</strong> {FEAT_PREREQUISITE_TYPES[prereq.prereq_type]?.name || prereq.prereq_type}</p>
                                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                                            <span>Prerequisite Type ID:</span>
                                            <input
                                                type="text"
                                                value={prereq.prereq_type_id || ''}
                                                onChange={(e) => {
                                                    const newValue = e.target.value;
                                                    setFeat(prevFeat => ({
                                                        ...prevFeat,
                                                        prereqs: prevFeat.prereqs.map(p =>
                                                            p.prereq_id === prereq.prereq_id ? { ...p, prereq_type_id: newValue } : p
                                                        )
                                                    }));
                                                }}
                                                className="w-20 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                                            <span>Prerequisite Amount:</span>
                                            <input
                                                type="text"
                                                value={prereq.prereq_amount || ''}
                                                onChange={(e) => {
                                                    const newValue = e.target.value;
                                                    setFeat(prevFeat => ({
                                                        ...prevFeat,
                                                        prereqs: prevFeat.prereqs.map(p =>
                                                            p.prereq_id === prereq.prereq_id ? { ...p, prereq_amount: newValue } : p
                                                        )
                                                    }));
                                                }}
                                                className="w-20 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => HandleDeletePrereq(prereq.prereq_id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-500 dark:text-gray-400 mb-2">No prerequisites added yet.</div>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsAddPrereqModalOpen(true)}
                        className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 text-white"
                    >
                        Add Prerequisite
                    </button>
                </div>
                <div className="flex mt-4 gap-2 justify-end">
                    <button type="submit" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-white">Save</button>
                    <button type="button" onClick={() => {
                        navigate(-1);
                    }} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200">Cancel</button>
                </div>
            </form>
            {editingBenefit && (
                <FeatBenefitEdit
                    isOpen={isAddBenefitModalOpen}
                    onClose={() => {
                        setIsAddBenefitModalOpen(false);
                        setEditingBenefit(null);
                    }}
                    onSave={HandleSaveBenefit}
                    initialBenefitData={editingBenefit}
                />
            )}

            <FeatPrereqAssoc
                isOpen={isAddPrereqModalOpen}
                onClose={() => {
                    setIsAddPrereqModalOpen(false);
                }}
                onSave={HandleAddOrUpdatePrereq}
                initialSelectedPrereqIds={feat.prereqs?.map(p => p.prereq_id) || []}
                featId={id}
            />
        </div>
    );
}