import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { createFeatBenefit, updateFeatBenefit, fetchFeatBenefitById } from '@/features/admin/features/featMgmt/services/featBenefitService';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/24/solid';
import { FEAT_BENEFIT_TYPE_LIST, FEAT_BENEFIT_TYPES } from 'shared-data/src/featData';

export default function FeatBenefitEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [benefit, setBenefit] = useState({
        feat_id: '',
        benefit_type: null,
        benefit_type_id: '',
        benefit_amount: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBenefit = async () => {
            try {
                if (id === 'new') {
                    setBenefit({
                        feat_id: location.state?.featId || '',
                        benefit_type: null,
                        benefit_type_id: '',
                        benefit_amount: '',
                    });
                } else {
                    const data = await fetchFeatBenefitById(id);
                    setBenefit({
                        feat_id: data.feat_id,
                        benefit_type: data.benefit_type,
                        benefit_type_id: data.benefit_type_id || '',
                        benefit_amount: data.benefit_amount || '',
                    });
                }
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBenefit();
    }, [id, location.state]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setBenefit(prevBenefit => ({
            ...prevBenefit,
            [name]: type === 'checkbox' ? checked : (name === 'benefit_type' ? parseInt(value) : value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        try {
            const payload = {
                feat_id: parseInt(benefit.feat_id),
                benefit_type: benefit.benefit_type ? parseInt(benefit.benefit_type) : null,
                benefit_type_id: benefit.benefit_type_id,
                benefit_amount: benefit.benefit_amount,
            };

            if (id === 'new') {
                const newBenefit = await createFeatBenefit(payload);
                setMessage('Feat benefit created successfully!');
                if (location.state?.from === 'FeatBenefitAssoc' && location.state?.featId) {
                    navigate(`/admin/feats/${location.state.featId}/edit`, { state: { newBenefit: newBenefit } });
                } else {
                    navigate('/admin/feats');
                }
            } else {
                await updateFeatBenefit(id, payload);
                setMessage('Feat benefit updated successfully!');
                navigate('/admin/feats');
            }

        } catch (err) {
            setError(err);
            setMessage(`Error: ${err.message || err}`);
        }
    };

    if (isLoading) return <div className="p-4 bg-white dark:bg-[#121212]">Loading feat benefit for editing...</div>;
    if (error) return <div className="p-4 bg-white dark:bg-[#121212] dark:text-red-500">Error: {error.message}</div>;
    if (!benefit && id !== 'new') return <div className="p-4 bg-white dark:bg-[#121212]">Feat benefit not found.</div>;

    return (
        <div className="p-4 bg-white dark:bg-[#121212] scrollbar-track-gray-300 scrollbar-thumb-gray-400 dark:scrollbar-track-gray-700 dark:scrollbar-thumb-gray-500">
            <h1 className="text-2xl font-bold mb-4">{id === 'new' ? 'Create New Feat Benefit' : `Edit Feat Benefit: ${benefit.benefit_id}`}</h1>
            {message && <div className="mb-4 p-2 rounded text-green-700 bg-green-100 dark:bg-green-800 dark:text-green-200">{message}</div>}
            {error && <div className="mb-4 p-2 rounded text-red-700 bg-red-100 dark:bg-red-800 dark:text-red-200">Error: {error.message || String(error)}</div>}

            <form onSubmit={handleSubmit} className="mt-4">
                <div className="mb-4">
                    <label htmlFor="feat_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Feat ID:</label>
                    <input
                        type="number"
                        id="feat_id"
                        name="feat_id"
                        value={benefit.feat_id || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="benefit_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Benefit Type:</label>
                    <Listbox
                        value={benefit.benefit_type}
                        onChange={(selectedId) => handleChange({ target: { name: 'benefit_type', value: selectedId } })}
                    >
                        {({ open }) => (
                            <div className="relative mt-1">
                                <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                    <span className="block truncate">{FEAT_BENEFIT_TYPES[benefit.benefit_type]?.name || 'Select a benefit type'}</span>
                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                    </span>
                                </ListboxButton>
                                <Transition
                                    show={open}
                                    leave="transition ease-in duration-100"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto scrollbar-thin rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:text-gray-100">
                                        <ListboxOption
                                            className={({ active }) =>
                                                `relative cursor-default select-none py-2 pl-3 pr-9 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                            }
                                            value={null}
                                        >
                                            {({ selected, active }) => (
                                                <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                    Select a benefit type
                                                </span>
                                            )}
                                        </ListboxOption>
                                        {FEAT_BENEFIT_TYPE_LIST.map(type => (
                                            <ListboxOption
                                                key={type.id}
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2 pl-3 pr-9 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                }
                                                value={type.id}
                                            >
                                                {({ selected, active }) => (
                                                    <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                        {type.name}
                                                    </span>
                                                )}
                                            </ListboxOption>
                                        ))}
                                    </ListboxOptions>
                                </Transition>
                            </div>
                        )}
                    </Listbox>
                </div>
                <div className="mb-4">
                    <label htmlFor="benefit_type_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Benefit Type ID:</label>
                    <input
                        type="text"
                        id="benefit_type_id"
                        name="benefit_type_id"
                        value={benefit.benefit_type_id || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="benefit_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Benefit Amount:</label>
                    <input
                        type="number"
                        id="benefit_amount"
                        name="benefit_amount"
                        value={benefit.benefit_amount || ''}
                        onChange={handleChange}
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
                        {id === 'new' ? 'Create Benefit' : 'Update Benefit'}
                    </button>
                </div>
            </form>
        </div>
    );
} 