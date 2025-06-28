import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { CreateRaceTrait, UpdateRaceTrait, FetchRaceTraitBySlug } from '@/features/admin/features/raceMgmt/services/RaceTraitService';

export function RaceTraitEdit() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [trait, setTrait] = useState({
        slug: null,
        name: '',
        desc: '',
        has_value: false
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const FetchTrait = async () => {
            try {
                if (slug === 'new') {
                    setTrait({
                        name: '',
                        desc: '',
                        has_value: false,
                        trait_value: '',
                    });
                } else {
                    const data = await FetchRaceTraitBySlug(slug);
                    setTrait({
                        slug: data.slug,
                        name: data.name,
                        desc: data.desc,
                        has_value: data.has_value === 1
                    });
                }
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };
        FetchTrait();
    }, [slug]);

    const HandleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setTrait(prevTrait => ({
            ...prevTrait,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const HandleMarkdownChange = (content) => {
        setTrait(prevTrait => ({
            ...prevTrait,
            desc: content
        }));
    };

    const HandleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        try {
            const payload = {
                name: trait.name,
                desc: trait.desc,
                has_value: trait.has_value ? 1 : 0,
            };
            if (slug === 'new') {
                payload.slug = trait.slug;
            }
            if (trait.has_value) {
                payload.trait_value = trait.trait_value;
            }

            if (slug === 'new') {
                const newTrait = await CreateRaceTrait(payload);
                setMessage('Race trait created successfully!');
                if (location.state?.from === 'RaceTraitAssoc' && location.state?.raceId) {
                    navigate(`/admin/races/${location.state.raceId}/edit`, { state: { newTrait: newTrait } });
                } else {
                    navigate('/admin/races');
                }
            } else {
                await UpdateRaceTrait(slug, payload);
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
    if (!trait && slug !== 'new') return <div className="p-4 bg-white dark:bg-[#121212]">Race trait not found.</div>;

    return (
        <div className="p-4 bg-white dark:bg-[#121212] scrollbar-track-gray-300 scrollbar-thumb-gray-400 dark:scrollbar-track-gray-700 dark:scrollbar-thumb-gray-500">
            <h1 className="text-2xl font-bold mb-4">{slug === 'new' ? 'Create New Race Trait' : `Edit Race Trait: ${trait.name}`}</h1>
            {message && <div className="mb-4 p-2 rounded text-green-700 bg-green-100 dark:bg-green-800 dark:text-green-200">{message}</div>}
            {error && <div className="mb-4 p-2 rounded text-red-700 bg-red-100 dark:bg-red-800 dark:text-red-200">Error: {error.message || String(error)}</div>}

            <form onSubmit={HandleSubmit} className="mt-4">
                <div className="mb-4">
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Trait Slug:</label>
                    <input
                        type="text"
                        id="slug"
                        name="slug"
                        value={trait.slug || ''}
                        onChange={HandleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        required
                        disabled={slug !== 'new'}
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Trait Name:</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={trait.name || ''}
                        onChange={HandleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    />
                </div>
                <div className="mb-4">
                    <MarkdownEditor
                        id="desc"
                        name="desc"
                        label="Trait Description:"
                        value={trait.desc || ''}
                        onChange={HandleMarkdownChange}
                        userVars={{ traitname: trait.name }}
                    />
                </div>
                <div className="mb-4 flex items-center">
                    <input
                        type="checkbox"
                        id="has_value"
                        name="has_value"
                        checked={trait.has_value}
                        onChange={HandleChange}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="has_value" className="text-sm font-medium text-gray-700 dark:text-gray-300">Has Associated Value</label>
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
                        {slug === 'new' ? 'Create Trait' : 'Update Trait'}
                    </button>
                </div>
            </form>
        </div>
    );
}
