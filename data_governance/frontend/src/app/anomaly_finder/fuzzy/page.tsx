// app/anomaly_finder/fuzzy/page.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { FilterPanel } from './components/FilterPanel';
import { ResultsTable } from './components/ResultsTable';
import { fetchFuzzyPairs } from './api/fetchFuzzyPairs';
import { FuzzyPair } from './types/fuzzyTypes';

export default function FuzzyMatchingPage() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [pairs, setPairs] = useState<FuzzyPair[]>([]);
    const [currentColumn, setCurrentColumn] = useState<string>('');
    const [currentThreshold, setCurrentThreshold] = useState<number>(90);
    const [currentFilters, setCurrentFilters] = useState<{
        division?: string[];
        section?: string[];
        department?: string[];
    }>({});
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = useCallback(async (params: {
        column: string;
        threshold: number;
        division?: string[];
        section?: string[];
        department?: string[];
    }) => {
        setIsAnalyzing(true);
        setError(null);
        try {
            const response = await fetchFuzzyPairs(params);
            setPairs(response.pairs);
            setCurrentColumn(response.column);
            setCurrentThreshold(response.threshold);
            setCurrentFilters(response.filters || {});
        } catch (err) {
            console.error('Analysis failed:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
            setPairs([]);
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8 px-4 sm:px-6 lg:px-8">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-200/50 mb-4">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Fuzzy Matching
                        </span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-amber-800 to-orange-900 mb-3">
                        Fuzzy String Matcher
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                        Detect near‑duplicate values in a selected column using fuzzy string matching.
                        Optionally filter by division, section, or department to narrow the dataset.
                    </p>
                </div>

                {/* Filter Panel */}
                <div className="mb-6">
                    <FilterPanel onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Results Table */}
                {pairs.length > 0 && (
                    <ResultsTable
                        pairs={pairs}
                        column={currentColumn}
                        threshold={currentThreshold}
                        filters={currentFilters}
                    />
                )}

                {/* Empty State */}
                {!isAnalyzing && pairs.length === 0 && !error && (
                    <div className="bg-white/50 rounded-xl p-12 text-center border border-dashed border-gray-300">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No analysis yet</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Select a column and threshold, then click "Analyze" to find fuzzy matches.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}