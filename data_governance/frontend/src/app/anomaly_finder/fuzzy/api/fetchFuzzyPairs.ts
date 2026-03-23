// app/anomaly_finder/fuzzy/api/fetchFuzzyPairs.ts
import { api } from '@/app/api/base';
import { FuzzyResponse, fuzzyResponseSchema } from '../types/fuzzyTypes';
import { ZodError } from 'zod';

interface FuzzyParams {
    column: string;
    threshold?: number;
    division?: string[];
    section?: string[];
    department?: string[];
}

export async function fetchFuzzyPairs(
    { column, threshold = 90, division, section, department }: FuzzyParams,
    signal?: AbortSignal
): Promise<FuzzyResponse> {
    try {
        const params = new URLSearchParams({
            column,
            threshold: threshold.toString(),
        });

        if (division) {
            division.forEach(val => params.append('division', val));
        }
        if (section) {
            section.forEach(val => params.append('section', val));
        }
        if (department) {
            department.forEach(val => params.append('department', val));
        }

        const response = await api.get<FuzzyResponse>(
            `/api/anomalies/fuzzy?${params.toString()}`,
            { signal }
        );

        const parsed = fuzzyResponseSchema.parse(response);
        return parsed;
    } catch (error) {
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
        console.error('fetchFuzzyPairs error:', error);
        throw new Error('Failed to fetch fuzzy pairs. Please try again.');
    }
}