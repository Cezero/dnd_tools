import React, { useCallback, Fragment, useMemo, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Api } from '@/services/Api';
import { GenericList } from '@/components/GenericList/GenericList';
import { TextInput } from '@/components/GenericList/TextInput';
import { useNavigate } from 'react-router-dom';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';

/**
 * Component for associating a race trait with a race. This dialog allows selecting an existing trait
 * from a list to associate it with a race. When a trait is selected, the dialog closes and the
 * selected trait's information is passed to the `onSave` handler.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Whether the dialog is open.
 * @param {function} props.onClose - Function to call when the dialog is closed.
 * @param {function} props.onSave - Function to call with the selected trait data when a trait is chosen.
 * @param {Array<number>} props.initialSelectedTraitIds - Array of trait_slugs already associated with the race.
 * @param {string|number} [props.raceId] - The ID of the race currently being edited, used for returning to the correct RaceEdit page.
 * @returns {JSX.Element|null} The RaceTraitAssoc component or null if not open.
 */
export function RaceTraitAssoc({ isOpen, onClose, onSave, initialSelectedTraitIds = [], raceId }) {
    const navigate = useNavigate();
    const [currentSelectedTraitIds, setCurrentSelectedTraitIds] = useState(initialSelectedTraitIds);
    const [availableTraits, setAvailableTraits] = useState([]); // To store all traits fetched by GenericList

    const memoizedNavigate = useCallback(() => { /* no-op for internal list */ }, []);
    const memoizedDefaultColumns = useMemo(() => ['trait_slug', 'trait_name', 'trait_description'], []);

    useEffect(() => {
        setCurrentSelectedTraitIds(initialSelectedTraitIds);
    }, [initialSelectedTraitIds]);

    const columnDefinitions = useMemo(() => ({
        trait_slug: {
            id: 'trait_slug',
            label: 'Trait Slug',
            sortable: true,
            filterable: true,
            filterType: 'input',
            filterLabel: 'Search Traits',
            multiColumn: ['trait_slug', 'trait_name', 'trait_description'],
            alwaysVisible: true,
        },
        trait_name: {
            id: 'trait_name',
            label: 'Trait Name',
            sortable: true,
            filterable: false
        },
        trait_description: {
            id: 'trait_description',
            label: 'Description',
            sortable: false,
            filterable: false
        },
    }), []);

    const filterOptions = useMemo(() => ({
        trait_slug: { component: TextInput, props: { type: 'text', placeholder: 'Filter ...' } },
    }), []);

    const fetchTraitsForList = useCallback(async (searchParams) => {
        try {
            const response = await Api(`/races/traits?${searchParams.toString()}`);
            const data = Array.isArray(response.results) ? response.results : [];
            setAvailableTraits(data); // Store fetched traits
            return { data: data, total: response.total };
        } catch (error) {
            console.error('Error fetching traits for GenericList:', error);
            throw error;
        }
    }, []);

    const renderTraitCell = useCallback((item, columnId) => {
        if (columnId === 'trait_name') {
            return item.trait_name;
        } else if (columnId === 'trait_description') {
            return <ProcessMarkdown markdown={item[columnId]} userVars={{ traitname: item.trait_name }} />;
        } else if (columnId === 'trait_slug') {
            return item.trait_slug;
        }
        return null;
    }, []);

    const handleSelectedIdsChange = useCallback((selectedIdsFromGenericList) => {
        setCurrentSelectedTraitIds(selectedIdsFromGenericList);
    }, []);

    const handleAddSelectedTraits = useCallback(async () => {
        const response = await Api('/races/traits/all');
        const allTraits = Array.isArray(response) ? response : [];
        const selectedTraitObjects = currentSelectedTraitIds
            .map(id => allTraits.find(trait => trait.trait_slug === id))
            .filter(Boolean)
            .map(trait => ({
                trait_slug: trait.trait_slug,
                trait_name: trait.trait_name,
                trait_description: trait.trait_description,
                has_value: trait.has_value,
                trait_value: trait.has_value ? '' : '',
            }));
        console.log('[RaceTraitAssoc] selectedTraitObjects', selectedTraitObjects);
        onSave(selectedTraitObjects);
        onClose();
    }, [currentSelectedTraitIds, availableTraits, onSave, onClose]);


    if (!isOpen) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                                >
                                    Select Race Trait(s)
                                </Dialog.Title>
                                <form className="mt-4" onSubmit={(e) => e.preventDefault()}>
                                    <div className="mb-4">
                                        <GenericList
                                            storageKey="raceTraitSelectionList"
                                            isColumnConfigurable={false}
                                            isOptionSelector={true}
                                            selectedIds={currentSelectedTraitIds}
                                            onSelectedIdsChange={handleSelectedIdsChange}
                                            defaultColumns={memoizedDefaultColumns}
                                            columnDefinitions={columnDefinitions}
                                            requiredColumnId="trait_slug"
                                            fetchData={fetchTraitsForList}
                                            renderCell={renderTraitCell}
                                            filterOptions={filterOptions}
                                            navigate={memoizedNavigate}
                                            detailPagePath={null}
                                            idKey="trait_slug"
                                            refreshTrigger={isOpen}
                                            itemDesc="trait"
                                            initialLimit={10}
                                        />
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 mr-2"
                                            onClick={onClose}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 mr-2"
                                            onClick={handleAddSelectedTraits}
                                        >
                                            Apply Changes
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600"
                                            onClick={() => {
                                                onClose();
                                                navigate('/admin/races/traits/new/edit', { state: { from: 'RaceTraitAssoc', raceId: raceId } });
                                            }}
                                        >
                                            Create New Trait
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}