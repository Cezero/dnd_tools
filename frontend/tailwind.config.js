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
      typography: {
        DEFAULT: {
          css: {
            'p': {
              textIndent: '0',
              lineHeight: '18px',
              fontSize: '14px'
            },
            'p + p': {
              textIndent: '1rem',
              lineHeight: '18px',
              fontSize: '14px'
            }
          }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')
  ]
};
