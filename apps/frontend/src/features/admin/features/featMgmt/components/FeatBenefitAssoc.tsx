import React, { useCallback, Fragment, useMemo, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Api } from '@/services/Api';
import { GenericList } from '@/components/GenericList/GenericList';
import { TextInput } from '@/components/GenericList/TextInput';
import { useNavigate } from 'react-router-dom';
import { FetchFeatBenefits } from '@/features/admin/features/featMgmt/services/FeatBenefitService';
import { FEAT_BENEFIT_TYPES, FEAT_BENEFIT_TYPE_LIST } from '@shared/static-data';

/**
 * Component for associating feat benefits with a feat. This dialog allows selecting existing benefits
 * from a list to associate them with a feat. When a benefit is selected, the dialog closes and the
 * selected benefit's information is passed to the `onSave` handler.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Whether the dialog is open.
 * @param {function} props.onClose - Function to call when the dialog is closed.
 * @param {function} props.onSave - Function to call with the selected benefit data when a benefit is chosen.
 * @param {Array<number>} props.initialSelectedBenefitIds - Array of benefit_ids already associated with the feat.
 * @param {string|number} [props.featId] - The ID of the feat currently being edited, used for returning to the correct FeatEdit page.
 * @returns {JSX.Element|null} The FeatBenefitAssoc component or null if not open.
 */
export function FeatBenefitAssoc({ isOpen, onClose, onSave, initialSelectedBenefitIds = [], featId }) {
    const navigate = useNavigate();
    const [currentSelectedBenefitIds, setCurrentSelectedBenefitIds] = useState(initialSelectedBenefitIds);
    const [availableBenefits, setAvailableBenefits] = useState([]); // To store all benefits fetched by GenericList

    const memoizedNavigate = useCallback(() => { /* no-op for internal list */ }, []);
    const memoizedDefaultColumns = useMemo(() => ['benefit_id', 'feat_id', 'benefit_type', 'benefit_type_id', 'benefit_amount'], []);

    useEffect(() => {
        setCurrentSelectedBenefitIds(initialSelectedBenefitIds);
    }, [initialSelectedBenefitIds]);

    const columnDefinitions = useMemo(() => ({
        benefit_id: {
            id: 'benefit_id',
            label: 'Benefit ID',
            sortable: true,
            filterable: true,
            filterType: 'input',
            multiColumn: ['benefit_id', 'feat_id', 'benefit_type', 'benefit_type_id', 'benefit_amount'],
            alwaysVisible: true,
        },
        feat_id: {
            id: 'feat_id',
            label: 'Feat ID',
            sortable: true,
            filterable: false
        },
        benefit_type: {
            id: 'benefit_type',
            label: 'Benefit Type',
            sortable: true,
            filterable: true,
            filterType: 'single-select',
            options: FEAT_BENEFIT_TYPE_LIST,
            displayKey: 'name',
            valueKey: 'id',
        },
        benefit_type_id: {
            id: 'benefit_type_id',
            label: 'Benefit Type ID',
            sortable: true,
            filterable: false
        },
        benefit_amount: {
            id: 'benefit_amount',
            label: 'Benefit Amount',
            sortable: true,
            filterable: false
        },
    }), []);

    const filterOptions = useMemo(() => ({
        benefit_id: { component: TextInput, props: { type: 'text', placeholder: 'Filter by ID...' } },
        benefit_type: { component: TextInput, props: { type: 'text', placeholder: 'Filter by type...' } },
    }), []);

    const fetchBenefitsForList = useCallback(async (searchParams) => {
        try {
            const response = await FetchFeatBenefits(searchParams);
            const data = Array.isArray(response.data) ? response.data : [];
            setAvailableBenefits(data); // Store fetched benefits
            return { data: data, total: response.total };
        } catch (error) {
            console.error('Error fetching benefits for GenericList:', error);
            throw error;
        }
    }, []);

    const renderBenefitCell = useCallback((item, columnId) => {
        if (columnId === 'benefit_type') {
            return FEAT_BENEFIT_TYPES[item[columnId]]?.name || item[columnId];
        }
        return item[columnId];
    }, []);

    const handleSelectedIdsChange = useCallback((selectedIdsFromGenericList) => {
        setCurrentSelectedBenefitIds(selectedIdsFromGenericList);
    }, []);

    const handleAddSelectedBenefits = useCallback(async () => {
        // Fetch all benefits again to ensure we have the full objects for selected IDs
        const response = await Api('/feats/benefits/all');
        const allBenefits = Array.isArray(response) ? response : [];

        const selectedBenefitObjects = currentSelectedBenefitIds
            .map(id => allBenefits.find(benefit => benefit.benefit_id === id))
            .filter(Boolean);

        console.log('[FeatBenefitAssoc] selectedBenefitObjects', selectedBenefitObjects);
        onSave(selectedBenefitObjects);
        onClose();
    }, [currentSelectedBenefitIds, onSave, onClose]);

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
                                    Select Feat Benefit(s)
                                </Dialog.Title>
                                <form className="mt-4" onSubmit={(e) => e.preventDefault()}>
                                    <div className="mb-4">
                                        <GenericList
                                            storageKey="featBenefitSelectionList"
                                            isColumnConfigurable={false}
                                            isOptionSelector={true}
                                            selectedIds={currentSelectedBenefitIds}
                                            onSelectedIdsChange={handleSelectedIdsChange}
                                            defaultColumns={memoizedDefaultColumns}
                                            columnDefinitions={columnDefinitions}
                                            requiredColumnId="benefit_id"
                                            fetchData={fetchBenefitsForList}
                                            renderCell={renderBenefitCell}
                                            filterOptions={filterOptions}
                                            navigate={memoizedNavigate}
                                            detailPagePath={null}
                                            idKey="benefit_id"
                                            refreshTrigger={isOpen}
                                            itemDesc="feat benefit"
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
                                            onClick={handleAddSelectedBenefits}
                                        >
                                            Apply Changes
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600"
                                            onClick={() => {
                                                onClose();
                                                navigate('/admin/feats/benefits/new/edit', { state: { from: 'FeatBenefitAssoc', featId: featId } });
                                            }}
                                        >
                                            Create New Benefit
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