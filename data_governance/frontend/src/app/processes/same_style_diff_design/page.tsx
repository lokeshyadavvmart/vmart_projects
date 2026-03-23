// src/app/processes/same_style_diff_design/page.tsx
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { FilterPanel } from './components/FilterPanel';
import { SameStyleDiffDesignTable, SameStyleDiffDesignTableHandle } from './components/SameStyleDiffDesignTable';
import { ExportButton } from './components/ExportButton';
import { Filters, DateRange } from './types/sameStyleDiffDesignTypes';
import { exportAllSameStyleDiffDesign } from './api/exportAllSameStyleDiffDesign';

export default function SameStyleDiffDesignPage() {
    const tableRef = useRef<SameStyleDiffDesignTableHandle>(null);
    const [appliedFilters, setAppliedFilters] = useState<Filters>({});
    const [appliedDateRange, setAppliedDateRange] = useState<DateRange>({
        from_date: '',
        to_date: '',
    });
    const [distinctValues, setDistinctValues] = useState<Record<string, (string | number)[]>>({});

    const handleApplyFilters = useCallback((filters: Filters, dateRange: DateRange) => {
        setAppliedFilters(filters);
        setAppliedDateRange(dateRange);
    }, []);

    const handleDataLoaded = useCallback((newDistinctValues: Record<string, (string | number)[]>) => {
        setDistinctValues(newDistinctValues);
    }, []);

    const handleExportCurrent = useCallback(() => {
        if (tableRef.current) {
            tableRef.current.exportCurrentView();
        }
    }, []);

    const handleExportFull = useCallback(async () => {
        await exportAllSameStyleDiffDesign(appliedFilters);
    }, [appliedFilters]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8 px-4 sm:px-6 lg:px-8">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500" />

            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-200/50 mb-4">
                            <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                            <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Same Style Diff Design Analysis
                            </span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-teal-800 to-cyan-900 mb-3">
                            Same Style Diff Design Explorer
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                            This looks for products of the same style and color in the same month that have different design numbers. It helps ensure the designs are correctly tracked.
                        </p>
                    </div>
                    <ExportButton
                        onExportCurrent={handleExportCurrent}
                        onExportFull={handleExportFull}
                    />
                </div>

                {/* FilterPanel now directly placed without extra card */}
                <div className="mb-6">
                    <FilterPanel
                        onApply={handleApplyFilters}
                        distinctValues={distinctValues}
                    />
                </div>

                {/* Table card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white flex justify-between items-center">
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                            <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Same Style Diff Design Records
                        </h2>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                            Click cells to copy
                        </span>
                    </div>
                    <div className="p-6">
                        <SameStyleDiffDesignTable
                            ref={tableRef}
                            filters={appliedFilters}
                            dateRange={appliedDateRange}
                            onDataLoaded={handleDataLoaded}
                        />
                    </div>
                </div>

                <div className="mt-6 text-center text-xs text-gray-400">
                    <span>Powered by AG Grid • Data updates in real‑time</span>
                </div>
            </div>
        </div>
    );
}