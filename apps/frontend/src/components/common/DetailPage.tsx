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
    lockStatus?: { locked: boolean; lockedBy?: number };
    currentUserId?: number;
}

export function DetailPage({
    isLoading,
    item,
    itemName,
    isAdmin,
    onBack,
    onEdit,
    children,
    lockStatus,
    currentUserId
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
                            <>
                                <button
                                    type="button"
                                    onClick={onEdit}
                                    disabled={lockStatus?.locked && lockStatus.lockedBy !== currentUserId}
                                    className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    title={lockStatus?.locked && lockStatus.lockedBy !== currentUserId
                                        ? `Currently locked by User ${lockStatus.lockedBy}`
                                        : `Edit ${itemName}`}
                                >
                                    Edit {itemName}
                                </button>
                                {lockStatus?.locked && lockStatus.lockedBy !== currentUserId && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-4">
                                        Currently locked by User {lockStatus.lockedBy}
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
