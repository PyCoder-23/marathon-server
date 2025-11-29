/**
 * API Client Utilities
 * Centralized fetch wrapper with error handling for API calls
 */

export class APIError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = "APIError";
    }
}

export async function apiClient<T = any>(
    url: string,
    options?: RequestInit
): Promise<T> {
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Request failed" }));
        throw new APIError(res.status, error.error || `HTTP ${res.status}`);
    }

    return res.json();
}

// Convenience methods
export const api = {
    get: <T = any>(url: string) => apiClient<T>(url, { method: "GET" }),

    post: <T = any>(url: string, data?: any) =>
        apiClient<T>(url, {
            method: "POST",
            body: data ? JSON.stringify(data) : undefined,
        }),

    put: <T = any>(url: string, data?: any) =>
        apiClient<T>(url, {
            method: "PUT",
            body: data ? JSON.stringify(data) : undefined,
        }),

    delete: <T = any>(url: string) =>
        apiClient<T>(url, { method: "DELETE" }),
};
