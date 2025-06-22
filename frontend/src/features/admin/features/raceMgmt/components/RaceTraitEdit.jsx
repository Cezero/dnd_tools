import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MarkdownEditor from '@/components/markdown/MarkdownEditor';
import { createRaceTrait, updateRaceTrait, fetchRaceTraitById } from '@/features/admin/features/raceMgmt/services/raceTraitService';

export default function RaceTraitEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [trait, setTrait] = useState({
        trait_slug: null,
        trait_name: '',
        trait_description: '',
        value_flag: false,
        trait_value: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTrait = async () => {
            try {
                if (id === 'new') {
                    setTrait({
                        trait_name: '',
                        trait_description: '',
                        value_flag: false,
                        trait_value: '',
                    });
                } else {
                    const data = await fetchRaceTraitById(id);
                    setTrait({
                        trait_slug: data.trait_slug,
                        trait_name: data.trait_name,
                        trait_description: data.trait_description,
                        value_flag: data.value_flag === 1,
                        trait_value: data.trait_value || '',
                    });
                }
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTrait();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setTrait(prevTrait => ({
            ...prevTrait,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleMarkdownChange = (content) => {
        setTrait(prevTrait => ({
            ...prevTrait,
            trait_description: content
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        try {
            const payload = {
                trait_name: trait.trait_name,
                trait_description: trait.trait_description,
                value_flag: trait.value_flag ? 1 : 0,
            };
            if (id === 'new') {
                payload.trait_slug = trait.trait_slug;
            }
            if (trait.value_flag) {
                payload.trait_value = trait.trait_value;
            }

            if (id === 'new') {
                const newTrait = await createRaceTrait(payload);
                setMessage('Race trait created successfully!');
                if (location.state?.from === 'RaceTraitAssoc' && location.state?.raceId) {
                    navigate(`/admin/races/${location.state.raceId}/edit`, { state: { newTrait: newTrait } });
                } else {
                    navigate('/admin/races');
                }
            } else {
                await updateRaceTrait(id, payload);
                setMessage('Race trait updated successfully!');
                navigate('/admin/races');
            }

        } catch (err) {
            setError(err);
            setMessage(`Error: ${err.message || err}`);
        }
    };

    if (isLoading) return <div className="p-4 bg-white dark:bg-[#121212]">Loading race trait for editing...</div>;
    if (error) return <div className="p-4 bg-white dark:bg-[#121212] dark:text-red-500">Error: {error.message}</div>;
    if (!trait && id !== 'new') return <div className="p-4 bg-white dark:bg-[#121212]">Race trait not found.</div>;

    return (
        <div className="p-4 bg-white dark:bg-[#121212] scrollbar-track-gray-300 scrollbar-thumb-gray-400 dark:scrollbar-track-gray-700 dark:scrollbar-thumb-gray-500">
            <h1 className="text-2xl font-bold mb-4">{id === 'new' ? 'Create New Race Trait' : `Edit Race Trait: ${trait.trait_name}`}</h1>
            {message && <div className="mb-4 p-2 rounded text-green-700 bg-green-100 dark:bg-green-800 dark:text-green-200">{message}</div>}
            {error && <div className="mb-4 p-2 rounded text-red-700 bg-red-100 dark:bg-red-800 dark:text-red-200">Error: {error.message || String(error)}</div>}

            <form onSubmit={handleSubmit} className="mt-4">
                <div className="mb-4">
                    <label htmlFor="trait_slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Trait Slug:</label>
                    <input
                        type="text"
                        id="trait_slug"
                        name="trait_slug"
                        value={trait.trait_slug || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        required
                        disabled={id !== 'new'}
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="trait_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Trait Name:</label>
                    <input
                        type="text"
                        id="trait_name"
                        name="trait_name"
                        value={trait.trait_name || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    />
                </div>
                <div className="mb-4">
                    <MarkdownEditor
                        id="trait_description"
                        name="trait_description"
                        label="Trait Description:"
                        value={trait.trait_description || ''}
                        onChange={handleMarkdownChange}
                        userVars={{ traitname: trait.trait_name }}
                    />
                </div>
                <div className="mb-4 flex items-center">
                    <input
                        type="checkbox"
                        id="value_flag"
                        name="value_flag"
                        checked={trait.value_flag}
                        onChange={handleChange}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="value_flag" className="text-sm font-medium text-gray-700 dark:text-gray-300">Has Associated Value</label>
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
                        {id === 'new' ? 'Create Trait' : 'Update Trait'}
                    </button>
                </div>
            </form>
        </div>
    );
}
