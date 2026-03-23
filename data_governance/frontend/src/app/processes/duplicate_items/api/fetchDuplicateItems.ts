import { api } from '@/app/api/base';
import {
    QueryPayload,
    DuplicateItemsResponse,
    duplicateItemsResponseSchema,
    DuplicateItemRow,
} from '../types/duplicateItemsTypes';
import { ZodError } from 'zod';

interface FetchResult {
    data: DuplicateItemRow[];
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
]);

/**
 * Prepare payload exactly as the API expects:
 * - date_range: always include both fields (empty string if not provided)
 * - filters: only include allowed keys; keep empty arrays (they signal "no filter")
 * - cursor: include if truthy, otherwise omit
 * - limit: always include
 */
function buildPayload(raw: QueryPayload): Record<string, any> {
    const payload: Record<string, any> = {};

    // 1. date_range – always send both fields, default to empty string
    payload.date_range = {
        from_date: raw.date_range?.from_date ?? '',
        to_date: raw.date_range?.to_date ?? '',
    };

    // 2. filters – include only allowed keys, keep empty arrays
    if (raw.filters) {
        const filters: Record<string, string[]> = {};
        for (const [key, value] of Object.entries(raw.filters)) {
            if (!ALLOWED_FILTER_KEYS.has(key)) continue;
            // value should already be an array; if undefined, skip
            if (value === undefined) continue;
            filters[key] = value; // keep as is (could be empty array)
        }
        if (Object.keys(filters).length > 0) {
            payload.filters = filters;
        }
    }

    // 3. cursor – only if truthy (non-empty string)
    if (raw.cursor) {
        payload.cursor = raw.cursor;
    }

    // 4. limit – always include (backend has default)
    if (raw.limit !== undefined) {
        payload.limit = raw.limit;
    }

    return payload;
}

export async function fetchDuplicateItems(
    params: QueryPayload,
    signal?: AbortSignal
): Promise<FetchResult> {
    try {
        const payload = buildPayload(params);
        console.log('📦 Sending payload:', JSON.stringify(payload, null, 2)); // helpful for debugging

        const response = await api.post<DuplicateItemsResponse>(
            '/api/duplicate-items/',
            payload,
            { signal }
        );

        const parsed = duplicateItemsResponseSchema.parse(response);

        // Convert array rows to objects for AG Grid
        const data: DuplicateItemRow[] = parsed.data.map((row) =>
            parsed.columns.reduce((acc, col, idx) => {
                acc[col] = row[idx];
                return acc;
            }, {} as DuplicateItemRow)
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
        console.error('fetchDuplicateItems error:', error);
        throw new Error('Failed to fetch duplicate items. Please try again.');
    }
}