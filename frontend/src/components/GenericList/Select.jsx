import React from 'react';

const Select = ({ children, ...props }) => {
    return (
        <div className="absolute mt-2 p-1 bg-opacity-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg" onClick={(e) => e.stopPropagation()}>
            <select className="w-full px-2 py-1 text-left border rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" {...props}>
                {children}
            </select>
        </div>
    );
};

export default Select; 