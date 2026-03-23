// app/anomaly_finder/fuzzy/api/fetchFilters.ts
import { api } from '@/app/api/base';
import { FilterValuesResponse, filterValuesResponseSchema } from '../types/filtersTypes';
import { ZodError } from 'zod';

// Fallback filter values for development (matching example)
const FALLBACK_FILTER_VALUES = {
    division: ["Textile", "Garments", "Footwear", "Accessories"],
    section: ["Mens", "Womens", "Kids", "Unisex"],
    department: ["Shirts", "Pants", "Shoes", "Bags"],
};

export async function fetchFilters(signal?: AbortSignal): Promise<FilterValuesResponse> {
    try {
        const response = await api.get<FilterValuesResponse>(
            '/api/anomalies/filters',
            { signal }
        );
        const parsed = filterValuesResponseSchema.parse(response);
        return parsed;
    } catch (error) {
        // If the endpoint is not implemented, return fallback data for development
        if (error instanceof Error && error.message.includes('404')) {
            console.warn('Filters endpoint not available, using fallback values.');
            return {
                filters: FALLBACK_FILTER_VALUES,
            };
        }
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw error;
        }
        if (error instanceof ZodError) {
            console.error('Data validation error:', error.issues);
            throw new Error('Invalid data format received from server');
        }
        if (error instanceof Error) {
            throw error;
        }
        console.error('fetchFilters error:', error);
        throw new Error('Failed to fetch filter values. Please try again.');
    }
}