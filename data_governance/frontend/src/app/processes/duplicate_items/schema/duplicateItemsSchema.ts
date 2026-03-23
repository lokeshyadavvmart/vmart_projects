import { z } from "zod";

export const duplicateItemsSchema = z.object({
    columns: z.array(z.string()),         // e.g., ["group_id", "site_code", ...]
    data: z.array(z.array(z.any())),      // array of rows
    count: z.number(),
    next_cursor: z.string().nullable(),
});