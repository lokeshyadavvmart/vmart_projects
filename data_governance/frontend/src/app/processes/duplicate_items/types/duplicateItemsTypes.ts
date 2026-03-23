import { z } from 'zod';

export const duplicateItemRowSchema = z.record(z.string(), z.any());
export const duplicateItemsResponseSchema = z.object({
    columns: z.array(z.string()),
    data: z.array(z.array(z.any())),
    count: z.number(),
    next_cursor: z.string().nullable(),
    distinct_values: z.record(z.string(), z.array(z.union([z.string(), z.number()]))),
});

export type DuplicateItemRow = z.infer<typeof duplicateItemRowSchema>;
export type DuplicateItemsResponse = z.infer<typeof duplicateItemsResponseSchema>;
export type DistinctValues = Record<string, (string | number)[]>;

export interface DateRange {
    from_date?: string;
    to_date?: string;
}

// Filter values are now always arrays (empty array means no filter)
export type FilterValue = string[] | undefined;

export interface Filters {
    site_code?: FilterValue;
    icode?: FilterValue;
    po_number?: FilterValue;
    vendor?: FilterValue;
    division?: FilterValue;
    section?: FilterValue;
    department?: FilterValue;
    cat1?: FilterValue;
    cat2?: FilterValue;
    cat3?: FilterValue;
    cat4?: FilterValue;
    cat5?: FilterValue;
    cat6?: FilterValue;
}

export interface QueryPayload {
    date_range?: DateRange;
    filters?: Filters;
    cursor?: string | null;
    limit: number;
}