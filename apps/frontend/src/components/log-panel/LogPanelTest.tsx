import React from 'react';
import { useLogPanel } from './LogPanelProvider';

export function LogPanelTest(): React.JSX.Element {
    const logPanel = useLogPanel();

    const addTestLog = () => {
        logPanel.addLogEntry({
            message: 'This is a test log entry',
            type: 'info',
            source: 'test'
        });
    };

    const addSuccessLog = () => {
        logPanel.addLogEntry({
            message: 'This is a success log entry',
            type: 'success',
            source: 'test'
        });
    };

    const addWarningLog = () => {
        logPanel.addLogEntry({
            message: 'This is a warning log entry',
            type: 'warning',
            source: 'test'
        });
    };

    const addErrorLog = () => {
        logPanel.addLogEntry({
            message: 'This is an error log entry',
            type: 'error',
            source: 'test'
        });
    };

    const togglePanel = () => {
        logPanel.setIsOpen(!logPanel.isOpen);
    };

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold">Log Panel Test</h2>
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={addTestLog}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Add Info Log
                </button>
                <button
                    onClick={addSuccessLog}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    Add Success Log
                </button>
                <button
                    onClick={addWarningLog}
                    className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                    Add Warning Log
                </button>
                <button
                    onClick={addErrorLog}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Add Error Log
                </button>
                <button
                    onClick={togglePanel}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                    {logPanel.isOpen ? 'Close' : 'Open'} Log Panel
                </button>
                <button
                    onClick={logPanel.clearLog}
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                    Clear Log
                </button>
            </div>
            <div className="text-sm text-gray-600">
                Current entries: {logPanel.entries.length}
            </div>
        </div>
    );
} 
