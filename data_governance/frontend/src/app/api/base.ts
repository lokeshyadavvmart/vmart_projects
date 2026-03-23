// src/app/api/base.ts

export const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://10.100.3.94:8000';
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_HEADERS: HeadersInit = { 'Content-Type': 'application/json' };

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
    params?: Record<string, string | number | boolean | null | undefined>;
    timeout?: number;
    raw?: boolean;
}

export interface ApiError extends Error {
    status: number;
    statusText: string;
    data?: any;
}

function buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, BASE_API_URL);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        });
    }
    return url.toString();
}

export async function request<T = any>(
    method: HttpMethod,
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
): Promise<T> {
    const { params, timeout = DEFAULT_TIMEOUT, headers: customHeaders, raw = false, ...fetchOptions } = options;
    const url = buildUrl(endpoint, method === 'GET' ? params : undefined);
    const headers = { ...DEFAULT_HEADERS, ...(customHeaders as Record<string, string>) };
    let body: BodyInit | null = null;
    if (method !== 'GET' && data !== undefined) {
        body = JSON.stringify(data);
    }
    const controller = new AbortController();
    const { signal } = controller;
    let timeoutId: NodeJS.Timeout | undefined;
    if (timeout > 0) {
        timeoutId = setTimeout(() => controller.abort(), timeout);
    }
    try {
        const response = await fetch(url, { method, headers, body, signal, ...fetchOptions });
        if (timeoutId) clearTimeout(timeoutId);
        if (!response.ok) {
            let errorData: any;
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                errorData = await response.json();
            } else {
                errorData = await response.text();
            }
            const error: ApiError = new Error(`API request failed: ${response.status} ${response.statusText}`) as ApiError;
            error.status = response.status;
            error.statusText = response.statusText;
            error.data = errorData;
            throw error;
        }
        if (raw) return response as unknown as T;
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            return await response.json();
        }
        return (await response.text()) as unknown as T;
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeout}ms`);
        }
        throw error;
    }
}

export const api = {
    get: <T = any>(endpoint: string, params?: Record<string, any>, options?: RequestOptions) =>
        request<T>('GET', endpoint, undefined, { ...options, params }),
    post: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
        request<T>('POST', endpoint, data, options),
    put: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
        request<T>('PUT', endpoint, data, options),
    patch: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
        request<T>('PATCH', endpoint, data, options),
    delete: <T = any>(endpoint: string, options?: RequestOptions) =>
        request<T>('DELETE', endpoint, undefined, options),
};

export default api;