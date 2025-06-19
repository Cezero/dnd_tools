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
                    tableLayout: 'auto',
                    borderCollapse: 'collapse',
                    marginTop: '1em',
                    marginBottom: '1em',
                    border: '1px solid #4a5568',
                    'thead': {
                        'tr': {
                            backgroundColor: '#1a202c',
                            color: '#ffffff',
                        },
                    },
                    'th': {
                        backgroundColor: '#1a202c',
                        padding: '8px',
                        border: '1px solid #4a5568',
                        whiteSpace: 'nowrap'
                    },
                    'td': {
                        padding: '8px',
                        border: '1px dotted #4a5568'
                    },
                    'td:not([colspan])': {
                        whiteSpace: 'nowrap',
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