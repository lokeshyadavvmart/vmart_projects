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

const ALLOWED_FILTER_KEYS = new Set([
    'group_id', 'site_code', 'order_code', 'po_number', 'icode',
    'po_count', 'order_date', 'last_delivery_date', 'vendor',
    'division', 'section', 'department', 'cat1', 'cat2', 'cat3',
    'cat4', 'cat5', 'cat6', 'fabric', 'option',
    'udfstring01', 'udfstring02', 'udfstring03', 'udfstring04', 'udfstring05',
    'udfstring06', 'udfstring07', 'udfstring08', 'udfstring09', 'udfstring10'
]);

/**
 * ✅ NEW UTILITY: Flattens AG Grid filterModel into a simple string array.
 * This prevents the 422 error by ensuring the backend receives what it expects.
 */
function flattenFilters(rawFilters: Record<string, any>): Record<string, string[]> {
    const flattened: Record<string, string[]> = {};

    for (const [key, value] of Object.entries(rawFilters)) {
        if (!ALLOWED_FILTER_KEYS.has(key)) continue;

        // Case 1: Already a simple array (from your sidebar/props)
        if (Array.isArray(value)) {
            if (value.length > 0) flattened[key] = value.map(String);
            continue;
        }

        // Case 2: AG Grid Advanced/Multi-Filter (with conditions)
        if (value && typeof value === 'object' && 'conditions' in value) {
            const vals = value.conditions
                .map((c: any) => c.filter)
                .filter((v: any) => v !== undefined && v !== null && v !== '');
            if (vals.length > 0) flattened[key] = vals.map(String);
            continue;
        }

        // Case 3: Simple AG Grid Text/Number Filter
        if (value && typeof value === 'object' && 'filter' in value) {
            flattened[key] = [String(value.filter)];
            continue;
        }
        
        // Case 4: AG Grid Set Filter
        if (value && typeof value === 'object' && 'values' in value) {
            flattened[key] = value.values.map(String);
            continue;
        }
    }

    return flattened;
}

function buildPayload(raw: QueryPayload): Record<string, any> {
    const payload: Record<string, any> = {};

    payload.date_range = {
        from_date: raw.date_range?.from_date ?? '',
        to_date: raw.date_range?.to_date ?? '',
    };

    if (raw.filters) {
        // Flatten the filters to satisfy backend strictness
        const processedFilters = flattenFilters(raw.filters);
        if (Object.keys(processedFilters).length > 0) {
            payload.filters = processedFilters;
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