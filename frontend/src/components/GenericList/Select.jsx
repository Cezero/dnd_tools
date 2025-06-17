import React from 'react';

const Select = ({ children, onChange, ...props }) => {
    const handleChange = (event) => {
        if (onChange) {
            onChange(event.target.value);
        }
    };

    return (
        <select onChange={handleChange} {...props}>
            {children}
        </select>
    );
};

export default Select; 