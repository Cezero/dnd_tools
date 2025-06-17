const api = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    let defaultHeaders = {
        // Default headers can be added here if common to all requests
    };

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Automatically set Content-Type for JSON bodies if method is PUT or POST and no custom Content-Type is provided
    if ((options.method === 'POST' || options.method === 'PUT') && options.body && (!options.headers || !options.headers['Content-Type'])) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...(options.headers || {}),
        },
    };

    try {
        const response = await fetch(`/api${endpoint}`, config);

        if (response.status === 401) {
            // Handle unauthorized requests, e.g., redirect to login
            // For now, we'll just log out the user. In a real app, you might want
            // to use a more sophisticated approach like refreshing the token silently
            // if it's expired but still valid for refresh.
            localStorage.removeItem('token');
            window.location.href = '/login'; // Redirect to login page
            return Promise.reject('Unauthorized');
        }

        if (!response.ok) {
            const error = await response.json();
            return Promise.reject(error.message || 'Something went wrong');
        }

        return response.json();
    } catch (error) {
        console.error('API call error:', error);
        return Promise.reject('Network error or unexpected issue');
    }
};

export default api; 