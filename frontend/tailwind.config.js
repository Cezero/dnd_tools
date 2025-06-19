import typographyConfig from './src/config/typographyConfig.js';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './index.html',
        './src/**/*.{js,jsx,ts,tsx}'
    ],
    theme: {
        extend: {
            colors: {
                'text-dark': '#d1d5db'
            },
            gridAutoRows: {
                auto: 'auto'
            },
            typography: typographyConfig
        }
    },
    plugins: [
        require('@tailwindcss/typography'),
        require('@tailwindcss/forms')
    ]
};
