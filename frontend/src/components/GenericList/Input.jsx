import React from 'react';

const Input = ({ onChange, ...props }) => {
    const handleChange = (event) => {
        if (onChange) {
            onChange(event.target.value);
        }
    };

    return <input onChange={handleChange} {...props} />;
};

export default Input; 