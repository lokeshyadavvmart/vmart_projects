// src/app/processes/same_style_diff_design/api/exportAllSameStyleDiffDesign.ts
import { api } from '@/app/api/base';
import { Filters } from '../types/sameStyleDiffDesignTypes';

export async function exportAllSameStyleDiffDesign(filters?: Filters): Promise<void> {
    try {
        const params = new URLSearchParams();
        if (filters?.vendor?.[0]) params.append('vendor', filters.vendor[0]);
        if (filters?.site_code?.[0]) params.append('site_code', filters.site_code[0]);
        if (filters?.color_or_style?.[0]) params.append('color_or_style', filters.color_or_style[0]);
        // Add more as needed

        const response = await api.get(
            `/api/same-style-diff-design/export-full-report?${params.toString()}`,
            { responseType: 'blob' } as any
        );

        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `same_style_diff_design_full_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Full export failed:', error);
        throw error;
    }
}