// app/anomaly_finder/fuzzy/types/fuzzyTypes.ts
import { z } from 'zod';

export const fuzzyFiltersSchema = z.object({
    division: z.array(z.string()).optional(),
    section: z.array(z.string()).optional(),
    department: z.array(z.string()).optional(),
}).optional();

export const fuzzyPairSchema = z.object({
    value1: z.string(),
    count1: z.number(),
    value2: z.string(),
    count2: z.number(),
    score: z.number(),
});

export const fuzzyResponseSchema = z.object({
    column: z.string(),
    threshold: z.number(),
    filters: fuzzyFiltersSchema,
    pairs_found: z.number(),
    pairs: z.array(fuzzyPairSchema),
});

export type FuzzyPair = z.infer<typeof fuzzyPairSchema>;
export type FuzzyResponse = z.infer<typeof fuzzyResponseSchema>;