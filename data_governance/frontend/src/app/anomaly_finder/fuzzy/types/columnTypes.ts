// app/anomaly_finder/fuzzy/types/columnTypes.ts
import { z } from 'zod';

export const columnsResponseSchema = z.object({
    table: z.string(),
    columns_count: z.number(),
    columns: z.array(z.string()),
});

export type ColumnsResponse = z.infer<typeof columnsResponseSchema>;