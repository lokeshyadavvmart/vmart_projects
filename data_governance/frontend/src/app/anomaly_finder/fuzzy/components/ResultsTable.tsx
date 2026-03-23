// app/anomaly_finder/fuzzy/components/ResultsTable.tsx
import React from 'react';
import { FuzzyPair } from '../types/fuzzyTypes';

interface ResultsTableProps {
    pairs: FuzzyPair[];
    column: string;
    threshold: number;
    filters?: {
        division?: string[];
        section?: string[];
        department?: string[];
    };
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ pairs, column, threshold, filters }) => {
    if (pairs.length === 0) {
        return (
            <div className="bg-white/80 rounded-xl p-8 text-center">
                <p className="text-gray-500 text-sm">No fuzzy pairs found for the selected column and threshold.</p>
            </div>
        );
    }

    const filterParts = [];
    if (filters?.division?.length) filterParts.push(`Division: ${filters.division.join(', ')}`);
    if (filters?.section?.length) filterParts.push(`Section: ${filters.section.join(', ')}`);
    if (filters?.department?.length) filterParts.push(`Department: ${filters.department.join(', ')}`);
    const filterText = filterParts.length ? ` (filters: ${filterParts.join(' | ')})` : '';

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white flex flex-wrap justify-between items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Fuzzy Matches in "{column}" (threshold ≥ {threshold}%){filterText}
                </h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    {pairs.length} pair{pairs.length !== 1 ? 's' : ''} found
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value 1</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value 2</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {pairs.map((pair, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3 text-sm text-gray-900 font-mono">{pair.value1}</td>
                                <td className="px-6 py-3 text-sm text-gray-600">{pair.count1}</td>
                                <td className="px-6 py-3 text-sm text-gray-900 font-mono">{pair.value2}</td>
                                <td className="px-6 py-3 text-sm text-gray-600">{pair.count2}</td>
                                <td className="px-6 py-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pair.score >= 95 ? 'bg-red-100 text-red-800' :
                                            pair.score >= 90 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-blue-100 text-blue-800'
                                        }`}>
                                        {pair.score}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};