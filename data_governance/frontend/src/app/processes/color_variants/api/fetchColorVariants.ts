// src/app/processes/color_variants/api/fetchColorVariants.ts
import { api } from '@/app/api/base';
import {
    QueryPayload,
    ColorVariantsResponse,
    colorVariantsResponseSchema,
    ColorVariantRow,
} from '../types/colorVariantsTypes';
import { ZodError } from 'zod';

interface FetchResult {
    data: ColorVariantRow[];
    count: number;
    nextCursor: string | null;
    columns: string[];
    distinct_values: Record<string, (string | number)[]>;
}

// Allowed filter keys (must match the API)
const ALLOWED_FILTER_KEYS = new Set([
    'site_code',
    'icode',
    'po_number',
    'order_code',
    'vendor',
    'division',
    'section',
    'department',
    'cat1',
    'cat2',
    'cat3',
    'cat4',
    'cat5',
    'cat6',
    'fabric',
]);

function buildPayload(raw: QueryPayload): Record<string, any> {
    const payload: Record<string, any> = {};

    payload.date_range = {
        from_date: raw.date_range?.from_date ?? '',
        to_date: raw.date_range?.to_date ?? '',
    };

    if (raw.filters) {
        const filters: Record<string, string[]> = {};
        for (const [key, value] of Object.entries(raw.filters)) {
            if (!ALLOWED_FILTER_KEYS.has(key)) continue;
            if (value === undefined) continue;
            filters[key] = value;
        }
        if (Object.keys(filters).length > 0) {
            payload.filters = filters;
        }
    }

    if (raw.cursor) {
        payload.cursor = raw.cursor;
    }

    if (raw.limit !== undefined) {
        payload.limit = raw.limit;
    }

    return payload;
}

export async function fetchColorVariants(
    params: QueryPayload,
    signal?: AbortSignal
): Promise<FetchResult> {
    try {
        const payload = buildPayload(params);
        console.log('📦 Sending payload:', JSON.stringify(payload, null, 2));

        const response = await api.post<ColorVariantsResponse>(
            '/api/color-variants/',
            payload,
            { signal }
        );

        const parsed = colorVariantsResponseSchema.parse(response);

        const data: ColorVariantRow[] = parsed.data.map((row) =>
            parsed.columns.reduce((acc, col, idx) => {
                acc[col] = row[idx];
                return acc;
            }, {} as ColorVariantRow)
        );

        return {
            data,
            count: parsed.count,
            nextCursor: parsed.next_cursor,
            columns: parsed.columns,
            distinct_values: parsed.distinct_values,
        };
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
        console.error('fetchColorVariants error:', error);
        throw new Error('Failed to fetch color variants. Please try again.');
    }
}