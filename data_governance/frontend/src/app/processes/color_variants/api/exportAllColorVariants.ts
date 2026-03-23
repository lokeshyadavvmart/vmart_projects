// src/app/processes/color_variants/api/exportAllColorVariants.ts
import { api } from '@/app/api/base';
import { Filters } from '../types/colorVariantsTypes';

export async function exportAllColorVariants(filters?: Filters): Promise<void> {
    try {
        // Build query params from filters (optional)
        const params = new URLSearchParams();
        if (filters?.vendor?.[0]) params.append('vendor', filters.vendor[0]);
        if (filters?.site_code?.[0]) params.append('site_code', filters.site_code[0]);
        if (filters?.fabric?.[0]) params.append('fabric', filters.fabric[0]);
        // Add more as needed

        const response = await api.get(
            `/api/color-variants/export-full-report?${params.toString()}`,
            { responseType: 'blob' } as any
        );

        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `color_variants_full_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Full export failed:', error);
        throw error;
    }
}