// app/anomaly_finder/fuzzy/types/filtersTypes.ts
import { z } from 'zod';

export const filterValuesResponseSchema = z.object({
    filters: z.object({
        division: z.array(z.string()),
        section: z.array(z.string()),
        department: z.array(z.string()),
    }),
});

export type FilterValuesResponse = z.infer<typeof filterValuesResponseSchema>;