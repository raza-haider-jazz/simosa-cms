const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://unleached-paulette-noctilucent.ngrok-free.dev";

// Default headers for all API requests (includes ngrok bypass header)
const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
};

// Wrapper around fetch that adds ngrok headers
export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
    
    return fetch(url, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    });
}

// GET request helper
export async function apiGet(endpoint: string): Promise<Response> {
    return apiFetch(endpoint, { method: 'GET' });
}

// POST request helper
export async function apiPost(endpoint: string, body?: any): Promise<Response> {
    return apiFetch(endpoint, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
    });
}

// PATCH request helper
export async function apiPatch(endpoint: string, body?: any): Promise<Response> {
    return apiFetch(endpoint, {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
    });
}

// DELETE request helper
export async function apiDelete(endpoint: string): Promise<Response> {
    return apiFetch(endpoint, { method: 'DELETE' });
}

export { API_URL };
