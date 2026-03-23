// src/app/processes/color_variants/components/FilterPanel.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { Filters, DateRange } from '../types/colorVariantsTypes';

interface FilterPanelProps {
    onApply: (filters: Filters, dateRange: DateRange) => void;
    distinctValues?: Record<string, (string | number)[]>;
}

const FILTER_FIELDS: { key: keyof Filters; label: string }[] = [
    { key: 'division', label: 'Division' },
    { key: 'section', label: 'Section' },
    { key: 'department', label: 'Department' },
    { key: 'site_code', label: 'Site Code' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'fabric', label: 'Fabric' },
];

const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const presets = [
    { label: 'Today', days: 0 },
    { label: 'Yesterday', days: 1 },
    { label: '7d', days: 7 },
    { label: '30d', days: 30 },
    { label: '6m', days: 180 },
    { label: '1y', days: 365 },
];

export const FilterPanel: React.FC<FilterPanelProps> = ({ onApply, distinctValues = {} }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [filters, setFilters] = useState<Partial<Record<keyof Filters, string>>>({});
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const activeFilterCount = useMemo(() => {
        const textFiltersActive = Object.values(filters).filter(v => v && v.trim() !== '').length;
        const dateActive = (fromDate ? 1 : 0) + (toDate ? 1 : 0);
        return textFiltersActive + dateActive;
    }, [filters, fromDate, toDate]);

    const applyPreset = useCallback((days: number) => {
        const today = new Date();
        if (days === 0) {
            setFromDate(formatDate(today));
            setToDate(formatDate(today));
        } else if (days === 1) {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            setFromDate(formatDate(yesterday));
            setToDate(formatDate(yesterday));
        } else {
            const endDate = new Date(today);
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - days);
            setFromDate(formatDate(startDate));
            setToDate(formatDate(endDate));
        }
    }, []);

    const handleInputChange = (key: keyof Filters, rawValue: string) => {
        setFilters((prev) => ({ ...prev, [key]: rawValue }));
    };

    const clearFilter = (key: keyof Filters) => {
        setFilters((prev) => {
            const newFilters = { ...prev };
            delete newFilters[key];
            return newFilters;
        });
    };

    const handleApply = () => {
        const parsedFilters: Filters = {};
        for (const { key } of FILTER_FIELDS) {
            const rawValue = filters[key];
            if (rawValue) {
                parsedFilters[key] = [rawValue];
            } else {
                parsedFilters[key] = [];
            }
        }

        onApply(parsedFilters, {
            from_date: fromDate,
            to_date: toDate,
        });
    };

    const handleReset = () => {
        setFilters({});
        setFromDate('');
        setToDate('');
        onApply({}, { from_date: '', to_date: '' });
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-100/80 p-3 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center space-x-1 group"
                    suppressHydrationWarning
                >
                    <svg
                        className={`w-4 h-4 text-purple-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Filters</span>
                </button>
                <div className="flex items-center space-x-2">
                    {activeFilterCount > 0 && (
                        <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                            {activeFilterCount}
                        </span>
                    )}
                    <button
                        onClick={handleReset}
                        className="text-[10px] text-gray-400 hover:text-gray-600 uppercase tracking-wider"
                        suppressHydrationWarning
                    >
                        Reset
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="mt-2 space-y-2">
                    {/* Date range – compact row */}
                    <div className="flex flex-wrap items-center gap-1">
                        <div className="flex items-center gap-1">
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-32 rounded border-gray-200 bg-gray-50/80 px-2 py-1 text-xs text-gray-700 focus:border-purple-400 focus:ring-1 focus:ring-purple-100"
                                placeholder="From"
                                suppressHydrationWarning
                            />
                            <span className="text-gray-300 text-xs">–</span>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-32 rounded border-gray-200 bg-gray-50/80 px-2 py-1 text-xs text-gray-700 focus:border-purple-400 focus:ring-1 focus:ring-purple-100"
                                placeholder="To"
                                suppressHydrationWarning
                            />
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {presets.map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => applyPreset(preset.days)}
                                    className="px-2 py-0.5 text-[10px] font-medium bg-gray-100/80 hover:bg-gray-200 text-gray-600 rounded transition-colors"
                                    suppressHydrationWarning
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filter dropdowns – compact grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                        {FILTER_FIELDS.map(({ key, label }) => {
                            const rawValue = filters[key] || '';
                            const fieldOptions = (distinctValues[key] || []).map(v => String(v));
                            return (
                                <div key={key} className="relative">
                                    <select
                                        value={rawValue}
                                        onChange={(e) => handleInputChange(key, e.target.value)}
                                        className="w-full rounded border-gray-200 bg-gray-50/80 pl-2 pr-6 py-1 text-xs text-gray-700 focus:border-purple-400 focus:ring-1 focus:ring-purple-100 appearance-none truncate"
                                        title={label}
                                        suppressHydrationWarning
                                    >
                                        <option value="" className="text-gray-400">{label}</option>
                                        {fieldOptions.map((opt) => (
                                            <option key={opt} value={opt} className="text-gray-700">
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                                        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                    {rawValue && (
                                        <button
                                            onClick={() => clearFilter(key)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[10px]"
                                            aria-label={`Clear ${label}`}
                                            suppressHydrationWarning
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Apply button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleApply}
                            className="px-4 py-1 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-500 rounded hover:from-purple-600 hover:to-indigo-600 focus:ring-1 focus:ring-purple-300 shadow-sm"
                            suppressHydrationWarning
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};