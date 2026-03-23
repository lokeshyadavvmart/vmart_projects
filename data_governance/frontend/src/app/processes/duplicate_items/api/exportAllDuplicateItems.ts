// src/app/processes/duplicate_items/api/exportAllDuplicateItems.ts
import { api } from '@/app/api/base';

export async function exportAllDuplicateItems(): Promise<void> {
    try {
        // Use GET instead of POST
        const response = await api.get('/api/duplicate-items/export-full-report', {
            responseType: 'blob',
        } as any);

        // Create a blob URL and trigger download
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `duplicate_items_full_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Full export failed:', error);
        throw error; // Let the caller handle it
    }
}