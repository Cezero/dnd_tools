const typographyConfig = {
    DEFAULT: {
        css: {
            'p': {
                textIndent: '0',
                marginTop: '0',
                lineHeight: '18px',
                fontSize: '14px'
            },
            'p + p': {
                textIndent: '1rem',
                lineHeight: '18px',
                fontSize: '14px'
            },
            'a': {
                '&.entity-link': {
                    fontStyle: 'italic',
                    textDecoration: 'none',
                    fontWeight: 'normal',
                    color: '#7091D8',
                    '&:hover': {
                        textDecoration: 'underline',
                    }
                }
            },
            'table': {
                '&.md-table': {
                    width: 'max-content',
                    fontSize: '14px',
                    tableLayout: 'fixed',
                    borderCollapse: 'collapse',
                    marginTop: '1em',
                    marginBottom: '1em',
                    border: '1px solid #4a5568',
                    'th': {
                        backgroundColor: '#2A3344',
                        padding: '8px',
                        border: '1px solid #4a5568',
                        whiteSpace: 'normal',
                        overflowWrap: 'break-word',
                    },
                    'td': {
                        padding: '8px',
                        border: '1px dotted #4a5568'
                    },
                    'td:not([colspan])': {
                        whiteSpace: 'nowrap',
                    },
                    'p': {
                        margin: '0',
                        fontSize: 'inherit',
                    },
                    'tbody': {
                        'tr': {
                            '&:nth-child(even)': {
                                backgroundColor: '#141e2d',
                            },
                            '&:nth-child(odd)': {
                                backgroundColor: '#121212',
                            },
                            '&:hover': {
                                backgroundColor: '#1f2a3a',
                            },
                        },
                    },
                }
            }
        }
    }
};

export default typographyConfig; 