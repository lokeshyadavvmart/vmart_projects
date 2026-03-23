// app/anomaly_finder/fuzzy/api/fetchColumns.ts
import { api } from '@/app/api/base';
import { ColumnsResponse, columnsResponseSchema } from '../types/columnTypes';
import { ZodError } from 'zod';

// Fallback columns for development (matching the example response)
const FALLBACK_COLUMNS = [
    "site_code", "icode", "po_number", "vendor", "division", "section",
    "department", "cat1", "cat2", "cat3", "cat4", "cat5", "itemdesc1",
    "itemdesc3", "udfstring01", "udfstring02", "udfstring03", "udfstring04",
    "udfstring05", "udfstring06"
];

export async function fetchColumns(
    table: string = 'governance.v_item_master',
    signal?: AbortSignal
): Promise<ColumnsResponse> {
    try {
        const params = new URLSearchParams({ table });
        const response = await api.get<ColumnsResponse>(
            `/api/anomalies/columns?${params.toString()}`,
            { signal }
        );
        const parsed = columnsResponseSchema.parse(response);
        return parsed;
    } catch (error) {
        // If the endpoint is not implemented, return fallback data for development
        if (error instanceof Error && error.message.includes('404')) {
            console.warn('Columns endpoint not available, using fallback list.');
            return {
                table,
                columns_count: FALLBACK_COLUMNS.length,
                columns: FALLBACK_COLUMNS,
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
        console.error('fetchColumns error:', error);
        throw new Error('Failed to fetch columns. Please try again.');
    }
}