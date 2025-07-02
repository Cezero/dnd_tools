import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CreateFeatPrereq, UpdateFeatPrereq, FetchFeatPrereqById } from '@/features/admin/features/feat-management/FeatPrereqService';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/24/solid';
import { FEAT_PREREQUISITE_TYPES, FEAT_PREREQUISITE_TYPE_LIST } from '@shared/static-data';

export function FeatPrereqEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [prereq, setPrereq] = useState({
        prereq_id: '',
        feat_id: '',
        prereq_type: null,
        prereq_type_id: '',
        prereq_amount: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const FetchPrereq = async () => {
            try {
                if (id === 'new') {
                    setPrereq({
                        prereq_id: '',
                        feat_id: location.state?.featId || '',
                        prereq_type: null,
                        prereq_type_id: '',
                        prereq_amount: '',
                    });
                } else {
                    const data = await FetchFeatPrereqById(id);
                    setPrereq({
                        prereq_id: data.prereq_id || '',
                        feat_id: data.feat_id,
                        prereq_type: data.prereq_type,
                        prereq_type_id: data.prereq_type_id || '',
                        prereq_amount: data.prereq_amount || '',
                    });
                }
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };
        FetchPrereq();
    }, [id, location.state]);

    const HandleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPrereq(prevPrereq => ({
            ...prevPrereq,
            [name]: type === 'checkbox' ? checked : (name === 'prereq_type' ? parseInt(value) : value)
        }));
    };

    const HandleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        try {
            const payload = {
                feat_id: parseInt(prereq.feat_id),
                prereq_type: prereq.prereq_type ? parseInt(prereq.prereq_type) : null,
                prereq_type_id: prereq.prereq_type_id,
                prereq_amount: prereq.prereq_amount,
            };

            if (id === 'new') {
                const newPrereq = await CreateFeatPrereq(payload);
                setMessage('Feat prerequisite created successfully!');
                if (location.state?.from === 'FeatPrereqAssoc' && location.state?.featId) {
                    navigate(`/admin/feats/${location.state.featId}/edit`, { state: { newPrereq: newPrereq } });
                } else {
                    navigate('/admin/feats');
                }
            } else {
                await UpdateFeatPrereq(id, payload);
                setMessage('Feat prerequisite updated successfully!');
                navigate('/admin/feats');
            }

        } catch (err) {
            setError(err);
            setMessage(`Error: ${err.message || err}`);
        }
    };

    if (isLoading) return <div className="p-4 bg-white dark:bg-[#121212]">Loading feat prerequisite for editing...</div>;
    if (error) return <div className="p-4 bg-white dark:bg-[#121212] dark:text-red-500">Error: {error.message}</div>;
    if (!prereq && id !== 'new') return <div className="p-4 bg-white dark:bg-[#121212]">Feat prerequisite not found.</div>;

    return (
        <div className="p-4 bg-white dark:bg-[#121212] scrollbar-track-gray-300 scrollbar-thumb-gray-400 dark:scrollbar-track-gray-700 dark:scrollbar-thumb-gray-500">
            <h1 className="text-2xl font-bold mb-4">{id === 'new' ? 'Create New Feat Prerequisite' : `Edit Feat Prerequisite: ${prereq.prereq_id}`}</h1>
            {message && <div className="mb-4 p-2 rounded text-green-700 bg-green-100 dark:bg-green-800 dark:text-green-200">{message}</div>}
            {error && <div className="mb-4 p-2 rounded text-red-700 bg-red-100 dark:bg-red-800 dark:text-red-200">Error: {error.message || String(error)}</div>}

            <form onSubmit={HandleSubmit} className="mt-4">
                <div className="mb-4">
                    <label htmlFor="feat_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Feat ID:</label>
                    <input
                        type="number"
                        id="feat_id"
                        name="feat_id"
                        value={prereq.feat_id || ''}
                        onChange={HandleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="prereq_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prerequisite Type:</label>
                    <Listbox
                        value={prereq.prereq_type}
                        onChange={(selectedId) => HandleChange({ target: { name: 'prereq_type', value: selectedId } })}
                    >
                        <div className="relative mt-1">
                            <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                <span className="block truncate">{FEAT_PREREQUISITE_TYPES[prereq.prereq_type]?.name || 'Select a prerequisite type'}</span>
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
                                            Select a prerequisite type
                                        </span>
                                    </ListboxOption>
                                    {FEAT_PREREQUISITE_TYPE_LIST.map(type => (
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
                <div className="mb-4">
                    <label htmlFor="prereq_type_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prerequisite Type ID:</label>
                    <input
                        type="text"
                        id="prereq_type_id"
                        name="prereq_type_id"
                        value={prereq.prereq_type_id || ''}
                        onChange={HandleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="prereq_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prerequisite Amount:</label>
                    <input
                        type="number"
                        id="prereq_amount"
                        name="prereq_amount"
                        value={prereq.prereq_amount || ''}
                        onChange={HandleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    />
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 mr-2"
                        onClick={() => navigate(-1)}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                        {id === 'new' ? 'Create Prerequisite' : 'Update Prerequisite'}
                    </button>
                </div>
            </form>
        </div>
    );
} 