// src/app/processes/same_style_diff_design/api/fetchSameStyleDiffDesign.ts
import { api } from '@/app/api/base';
import {
    QueryPayload,
    SameStyleDiffDesignResponse,
    sameStyleDiffDesignResponseSchema,
    SameStyleDiffDesignRow,
} from '../types/sameStyleDiffDesignTypes';
import { ZodError } from 'zod';

interface FetchResult {
    data: SameStyleDiffDesignRow[];
    count: number;
    nextCursor: string | null;
    columns: string[];
    distinct_values: Record<string, (string | number)[]>;
}

/**
 * Updated to include 'option' so that filters sent to the backend 
 * don't get stripped out, and internal mapping remains consistent.
 */
const ALLOWED_FILTER_KEYS = new Set([
    'site_code',
    'icode',
    'po_number',
    'design_no',
    'color_or_style',
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
    'option', // Added to support the new VM Code column
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

export async function fetchSameStyleDiffDesign(
    params: QueryPayload,
    signal?: AbortSignal
): Promise<FetchResult> {
    try {
        const payload = buildPayload(params);
        console.log('📦 Sending payload:', JSON.stringify(payload, null, 2));

        const response = await api.post<SameStyleDiffDesignResponse>(
            '/api/same-style-diff-design/',
            payload,
            { signal }
        );

        const parsed = sameStyleDiffDesignResponseSchema.parse(response);

        /**
         * The backend MUST return 'columns' in the same order as the 'data' array elements.
         * If 'option' is showing 'ROUND NECK', the backend is likely sending 'option' 
         * in the column list but the 'udfstring01' value in that data index.
         */
        const data: SameStyleDiffDesignRow[] = parsed.data.map((row) =>
            parsed.columns.reduce((acc, col, idx) => {
                acc[col] = row[idx];
                return acc;
            }, {} as SameStyleDiffDesignRow)
        );

        // Debugging logs to verify alignment in the console
        if (data.length > 0) {
            console.log('✅ First Row Mapped:', {
                cat6: data[0].cat6,
                option: data[0].option,
                udf01: data[0].udfstring01
            });
        }

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
        console.error('fetchSameStyleDiffDesign error:', error);
        throw new Error('Failed to fetch same style diff design. Please try again.');
    }
}