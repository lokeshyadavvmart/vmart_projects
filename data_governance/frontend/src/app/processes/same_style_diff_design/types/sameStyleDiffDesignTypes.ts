// src/app/processes/same_style_diff_design/types/sameStyleDiffDesignTypes.ts
import { z } from 'zod';

export const sameStyleDiffDesignRowSchema = z.record(z.string(), z.any());
export const sameStyleDiffDesignResponseSchema = z.object({
    columns: z.array(z.string()),
    data: z.array(z.array(z.any())),
    count: z.number(),
    next_cursor: z.string().nullable(),
    distinct_values: z.record(z.string(), z.array(z.union([z.string(), z.number()]))),
});

export type SameStyleDiffDesignRow = z.infer<typeof sameStyleDiffDesignRowSchema>;
export type SameStyleDiffDesignResponse = z.infer<typeof sameStyleDiffDesignResponseSchema>;
export type DistinctValues = Record<string, (string | number)[]>;

export interface DateRange {
    from_date?: string;
    to_date?: string;
}

export type FilterValue = string[] | undefined;

export interface Filters {
    site_code?: FilterValue;
    icode?: FilterValue;
    po_number?: FilterValue;
    design_no?: FilterValue;
    color_or_style?: FilterValue;
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