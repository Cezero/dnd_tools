import React, { useCallback, Fragment, useMemo, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import api from '@/services/api';
import GenericList from '@/components/GenericList/GenericList';
import Input from '@/components/GenericList/Input';
import { useNavigate } from 'react-router-dom';
import { fetchFeatPrereqs } from '@/features/admin/features/featMgmt/services/featPrereqService';
import { FEAT_PREREQUISITE_TYPES, FEAT_PREREQUISITE_TYPE_LIST } from 'shared-data/src/featData';

/**
 * Component for associating feat prerequisites with a feat. This dialog allows selecting existing prerequisites
 * from a list to associate them with a feat. When a prerequisite is selected, the dialog closes and the
 * selected prerequisite's information is passed to the `onSave` handler.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Whether the dialog is open.
 * @param {function} props.onClose - Function to call when the dialog is closed.
 * @param {function} props.onSave - Function to call with the selected prerequisite data when a prerequisite is chosen.
 * @param {Array<number>} props.initialSelectedPrereqIds - Array of prereq_ids already associated with the feat.
 * @param {string|number} [props.featId] - The ID of the feat currently being edited, used for returning to the correct FeatEdit page.
 * @returns {JSX.Element|null} The FeatPrereqAssoc component or null if not open.
 */
export default function FeatPrereqAssoc({ isOpen, onClose, onSave, initialSelectedPrereqIds = [], featId }) {
    const navigate = useNavigate();
    const [currentSelectedPrereqIds, setCurrentSelectedPrereqIds] = useState(initialSelectedPrereqIds);
    const [availablePrereqs, setAvailablePrereqs] = useState([]); // To store all prerequisites fetched by GenericList

    const memoizedNavigate = useCallback(() => { /* no-op for internal list */ }, []);
    const memoizedDefaultColumns = useMemo(() => ['prereq_id', 'feat_id', 'prereq_type', 'prereq_type_id', 'prereq_amount'], []);

    useEffect(() => {
        setCurrentSelectedPrereqIds(initialSelectedPrereqIds);
    }, [initialSelectedPrereqIds]);

    const columnDefinitions = useMemo(() => ({
        prereq_id: {
            id: 'prereq_id',
            label: 'Prerequisite ID',
            sortable: true,
            filterable: true,
            filterType: 'input',
            multiColumn: ['prereq_id', 'feat_id', 'prereq_type', 'prereq_type_id', 'prereq_amount'],
            alwaysVisible: true,
        },
        feat_id: {
            id: 'feat_id',
            label: 'Feat ID',
            sortable: true,
            filterable: false
        },
        prereq_type: {
            id: 'prereq_type',
            label: 'Prerequisite Type',
            sortable: true,
            filterable: true,
            filterType: 'single-select',
            options: FEAT_PREREQUISITE_TYPE_LIST,
            displayKey: 'name',
            valueKey: 'id',
        },
        prereq_type_id: {
            id: 'prereq_type_id',
            label: 'Prerequisite Type ID',
            sortable: true,
            filterable: false
        },
        prereq_amount: {
            id: 'prereq_amount',
            label: 'Prerequisite Amount',
            sortable: true,
            filterable: false
        },
    }), []);

    const filterOptions = useMemo(() => ({
        prereq_id: { component: Input, props: { type: 'text', placeholder: 'Filter by ID...' } },
        prereq_type: { component: Input, props: { type: 'text', placeholder: 'Filter by type...' } },
    }), []);

    const fetchPrereqsForList = useCallback(async (searchParams) => {
        try {
            const response = await fetchFeatPrereqs(searchParams);
            const data = Array.isArray(response.data) ? response.data : [];
            setAvailablePrereqs(data); // Store fetched prerequisites
            return { data: data, total: response.total };
        } catch (error) {
            console.error('Error fetching prerequisites for GenericList:', error);
            throw error;
        }
    }, []);

    const renderPrereqCell = useCallback((item, columnId) => {
        if (columnId === 'prereq_type') {
            return FEAT_PREREQUISITE_TYPES[item[columnId]]?.name || item[columnId];
        }
        return item[columnId];
    }, []);

    const handleSelectedIdsChange = useCallback((selectedIdsFromGenericList) => {
        setCurrentSelectedPrereqIds(selectedIdsFromGenericList);
    }, []);

    const handleAddSelectedPrereqs = useCallback(async () => {
        // Fetch all prerequisites again to ensure we have the full objects for selected IDs
        const response = await api('/feats/prereqs/all');
        const allPrereqs = Array.isArray(response) ? response : [];

        const selectedPrereqObjects = currentSelectedPrereqIds
            .map(id => allPrereqs.find(prereq => prereq.prereq_id === id))
            .filter(Boolean);

        console.log('[FeatPrereqAssoc] selectedPrereqObjects', selectedPrereqObjects);
        onSave(selectedPrereqObjects);
        onClose();
    }, [currentSelectedPrereqIds, onSave, onClose]);

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
                                    Select Feat Prerequisite(s)
                                </Dialog.Title>
                                <form className="mt-4" onSubmit={(e) => e.preventDefault()}>
                                    <div className="mb-4">
                                        <GenericList
                                            storageKey="featPrereqSelectionList"
                                            isColumnConfigurable={false}
                                            isOptionSelector={true}
                                            selectedIds={currentSelectedPrereqIds}
                                            onSelectedIdsChange={handleSelectedIdsChange}
                                            defaultColumns={memoizedDefaultColumns}
                                            columnDefinitions={columnDefinitions}
                                            requiredColumnId="prereq_id"
                                            fetchData={fetchPrereqsForList}
                                            renderCell={renderPrereqCell}
                                            filterOptions={filterOptions}
                                            navigate={memoizedNavigate}
                                            detailPagePath={null}
                                            idKey="prereq_id"
                                            refreshTrigger={isOpen}
                                            itemDesc="feat prerequisite"
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
                                            onClick={handleAddSelectedPrereqs}
                                        >
                                            Apply Changes
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600"
                                            onClick={() => {
                                                onClose();
                                                navigate('/admin/feats/prereqs/new/edit', { state: { from: 'FeatPrereqAssoc', featId: featId } });
                                            }}
                                        >
                                            Create New Prerequisite
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