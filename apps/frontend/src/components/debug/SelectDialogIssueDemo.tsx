import { Dialog } from '@base-ui-components/react/dialog';
import { Select } from '@base-ui-components/react/select';
import React, { useState } from 'react';

const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
    { value: 'option4', label: 'Option 4' },
    { value: 'option5', label: 'Option 5' },
    { value: 'option6', label: 'Option 6' },
    { value: 'option7', label: 'Option 7' },
    { value: 'option8', label: 'Option 8' },
    { value: 'option9', label: 'Option 9' },
    { value: 'option10', label: 'Option 10' },
];

export function SelectDialogIssueDemo(): React.JSX.Element {
    const [selectedValue, setSelectedValue] = useState<string>('');
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-100 p-8 relative">
            {/* Standalone indicator */}
            <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-center py-2 text-sm font-semibold">
                🧪 STANDALONE TEST PAGE - No Layout Wrapper
            </div>
            <div className="max-w-4xl mx-auto pt-12">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Base-UI Select.Popup Z-Index Issue Demo
                    </h1>

                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h2 className="text-lg font-semibold text-blue-900 mb-2">Issue Description</h2>
                            <p className="text-blue-800">
                                This page demonstrates the issue where base-ui Select.Popup appears beneath Dialog components
                                instead of above them. The Select dropdown should appear on top of the Dialog, but it currently
                                renders behind it.
                            </p>
                            <p className="text-blue-700 text-sm mt-2">
                                <strong>Note:</strong> This is a standalone test page that bypasses the main application layout
                                to ensure the issue occurs in the minimal case without any interference from navbar, sidebar, or other components.
                            </p>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h2 className="text-lg font-semibold text-yellow-900 mb-2">Steps to Reproduce</h2>
                            <ol className="text-yellow-800 list-decimal list-inside space-y-1">
                                <li>Click the "Open Dialog" button below</li>
                                <li>Click on the Select component inside the dialog</li>
                                <li>Notice that the dropdown appears behind the dialog instead of above it</li>
                            </ol>
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={() => setIsOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                            >
                                Open Dialog with Select
                            </button>

                            <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
                                <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
                                <Dialog.Portal>
                                    <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                        <div className="w-full max-w-md transform overflow-visible rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                                Select Component Test
                                            </Dialog.Title>

                                            <div className="space-y-4">
                                                <p className="text-gray-600">
                                                    This dialog contains a Select component. When you click on the select,
                                                    the dropdown should appear above the dialog, but it currently appears behind it.
                                                </p>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">
                                                        Choose an option:
                                                    </label>
                                                    <Select.Root value={selectedValue} onValueChange={setSelectedValue}>
                                                        <Select.Trigger className="w-full flex items-center justify-between gap-1 pl-2 pr-1 py-2 cursor-default rounded-md bg-white shadow-sm ring-1 ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:ring-gray-600">
                                                            <Select.Value>
                                                                {selectedValue ? options.find(opt => opt.value === selectedValue)?.label : "Select an option..."}
                                                            </Select.Value>
                                                            <Select.Icon>
                                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </Select.Icon>
                                                        </Select.Trigger>
                                                        
                                                            <Select.Positioner>
                                                                <Select.Popup className="absolute z-60 pt-1 pb-1 pr-1 max-h-60 overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800">
                                                                    {options.map((option) => (
                                                                        <Select.Item
                                                                            key={option.value}
                                                                            value={option.value}
                                                                            className="relative flex cursor-default select-none items-center py-2 pl-8 pr-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                        >
                                                                            <Select.ItemIndicator className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                                                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                                </svg>
                                                                            </Select.ItemIndicator>
                                                                            <Select.ItemText>
                                                                                {option.label}
                                                                            </Select.ItemText>
                                                                        </Select.Item>
                                                                    ))}
                                                                </Select.Popup>
                                                            </Select.Positioner>
                                                        
                                                    </Select.Root>
                                                </div>

                                                {selectedValue && (
                                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                        <p className="text-green-800">
                                                            <strong>Selected:</strong> {options.find(opt => opt.value === selectedValue)?.label}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex justify-end space-x-2 mt-6">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsOpen(false)}
                                                    className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </div>
                                    </Dialog.Popup>
                                </Dialog.Portal>
                            </Dialog.Root>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">Expected Behavior</h2>
                            <p className="text-gray-700">
                                The Select.Popup should have a higher z-index than the Dialog and appear above it when opened.
                                This is a common pattern in UI libraries where dropdowns and popups should always appear on top
                                of modal dialogs.
                            </p>
                            <div className="mt-3 p-3 bg-gray-100 rounded border">
                                <h3 className="text-sm font-semibold text-gray-800 mb-2">Current Z-Index Values:</h3>
                                <ul className="text-sm text-gray-700 space-y-1">
                                    <li><code>Dialog.Backdrop</code>: <span className="font-mono">z-40</span></li>
                                    <li><code>Dialog.Popup</code>: <span className="font-mono">z-50</span></li>
                                    <li><code>Select.Popup</code>: <span className="font-mono">z-60</span> (should be above dialog)</li>
                                </ul>
                                <p className="text-xs text-gray-600 mt-2">
                                    Despite Select.Popup having a higher z-index (z-60), it still appears behind the Dialog due to stacking context issues.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
