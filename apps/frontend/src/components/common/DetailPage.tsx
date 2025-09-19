import pluralize from 'pluralize';
import React from 'react';

interface DetailPageProps {
    isLoading: boolean;
    item: unknown | null;
    itemName: string;
    isAdmin: boolean;
    onBack: () => void;
    onEdit: () => void;
    children: React.ReactNode;
}

export function DetailPage({
    isLoading,
    item,
    itemName,
    isAdmin,
    onBack,
    onEdit,
    children
}: DetailPageProps) {
    const innerCellContentClasses = "p-3 bg-content border-content rounded-lg border w-full";
    const outerContainerClasses = "w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1";

    if (isLoading) return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    Loading...
                </div>
            </div>
        </div>
    );

    if (!item) return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    {itemName} not found
                </div>
            </div>
        </div>
    );

    return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    {children}
                    <div className="mt-4 text-right">
                        <button
                            type="button"
                            onClick={onBack}
                            className="inline-block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 border dark:border-gray-500"
                        >
                            Back to {pluralize(itemName)}
                        </button>
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={onEdit}
                                className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500"
                            >
                                Edit {itemName}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
