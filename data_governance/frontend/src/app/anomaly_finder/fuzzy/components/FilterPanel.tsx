// app/anomaly_finder/fuzzy/components/FilterPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { fetchColumns } from '../api/fetchColumns';
import { fetchFilters } from '../api/fetchFilters';

interface FilterPanelProps {
    onAnalyze: (params: {
        column: string;
        threshold: number;
        division?: string[];
        section?: string[];
        department?: string[];
    }) => void;
    isAnalyzing?: boolean;
}

type FilterType = 'division' | 'section' | 'department';

export const FilterPanel: React.FC<FilterPanelProps> = ({ onAnalyze, isAnalyzing = false }) => {
    const [columns, setColumns] = useState<string[]>([]);
    const [column, setColumn] = useState('');
    const [threshold, setThreshold] = useState(90);

    // Filter values from API
    const [filterOptions, setFilterOptions] = useState<Record<FilterType, string[]>>({
        division: [],
        section: [],
        department: [],
    });

    // Selected values for each filter
    const [selectedFilters, setSelectedFilters] = useState<Record<FilterType, string[]>>({
        division: [],
        section: [],
        department: [],
    });

    // UI state for dropdowns
    const [openDropdown, setOpenDropdown] = useState<FilterType | null>(null);
    const dropdownRefs = useRef<Record<FilterType, HTMLDivElement | null>>({
        division: null,
        section: null,
        department: null,
    });

    const [loadingColumns, setLoadingColumns] = useState(true);
    const [loadingFilters, setLoadingFilters] = useState(true);
    const [columnsError, setColumnsError] = useState<string | null>(null);
    const [filtersError, setFiltersError] = useState<string | null>(null);

    // Load columns and filter options
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingColumns(true);
                const colsData = await fetchColumns();
                setColumns(colsData.columns);
                if (colsData.columns.length > 0) setColumn(colsData.columns[0]);
                setColumnsError(null);
            } catch (err) {
                console.error('Failed to load columns:', err);
                setColumnsError('Could not load columns. Please try again.');
            } finally {
                setLoadingColumns(false);
            }

            try {
                setLoadingFilters(true);
                const filtersData = await fetchFilters();
                setFilterOptions(filtersData.filters);
                setFiltersError(null);
            } catch (err) {
                console.error('Failed to load filter values:', err);
                setFiltersError('Could not load filter values. Using fallback.');
                // Fallback values are already handled in fetchFilters, but if it still fails, we have fallback
            } finally {
                setLoadingFilters(false);
            }
        };
        loadData();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openDropdown && dropdownRefs.current[openDropdown] && !dropdownRefs.current[openDropdown]?.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdown]);

    const toggleDropdown = (filter: FilterType) => {
        setOpenDropdown(openDropdown === filter ? null : filter);
    };

    const handleCheckboxChange = (filter: FilterType, value: string, checked: boolean) => {
        setSelectedFilters(prev => {
            const current = prev[filter];
            if (checked) {
                return { ...prev, [filter]: [...current, value] };
            } else {
                return { ...prev, [filter]: current.filter(v => v !== value) };
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!column) return;
        onAnalyze({
            column,
            threshold,
            division: selectedFilters.division.length ? selectedFilters.division : undefined,
            section: selectedFilters.section.length ? selectedFilters.section : undefined,
            department: selectedFilters.department.length ? selectedFilters.department : undefined,
        });
    };

    const clearFilters = () => {
        setSelectedFilters({ division: [], section: [], department: [] });
    };

    // Helper to render filter dropdown
    const renderFilterDropdown = (filter: FilterType, label: string) => {
        const options = filterOptions[filter];
        const selected = selectedFilters[filter];
        const isOpen = openDropdown === filter;

        return (
            <div className="flex-1 min-w-[150px] relative" ref={el => { dropdownRefs.current[filter] = el; }}>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    {label}
                </label>
                <button
                    type="button"
                    onClick={() => toggleDropdown(filter)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-1.5 text-xs text-left flex items-center justify-between hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    suppressHydrationWarning
                >
                    <span className="truncate">
                        {selected.length === 0 ? `All ${label}` : `${selected.length} selected`}
                    </span>
                    <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto p-2">
                        {loadingFilters ? (
                            <div className="text-xs text-gray-400 animate-pulse p-2">Loading options...</div>
                        ) : options.length === 0 ? (
                            <div className="text-xs text-gray-400 p-2">No options</div>
                        ) : (
                            options.map(opt => (
                                <label key={opt} className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded cursor-pointer text-xs">
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(opt)}
                                        onChange={(e) => handleCheckboxChange(filter, opt, e.target.checked)}
                                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <span className="text-gray-700">{opt}</span>
                                </label>
                            ))
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-100/80 p-4 transition-all">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-wrap items-end gap-4">
                    {/* Column Selector */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                            Attribute
                        </label>
                        {loadingColumns ? (
                            <div className="w-full rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-400 animate-pulse">
                                Loading columns...
                            </div>
                        ) : columnsError ? (
                            <div className="w-full rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                                {columnsError}
                            </div>
                        ) : (
                            <select
                                value={column}
                                onChange={(e) => setColumn(e.target.value)}
                                className="w-full rounded-lg border-gray-200 bg-gray-50/80 px-3 py-2 text-sm text-gray-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-100 appearance-none"
                                suppressHydrationWarning
                            >
                                {columns.map((col) => (
                                    <option key={col} value={col}>
                                        {col}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Threshold Slider */}
                    <div className="flex-1 min-w-[250px]">
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Threshold ({threshold}%)
                            </label>
                            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                {threshold}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="50"
                            max="100"
                            value={threshold}
                            onChange={(e) => setThreshold(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            suppressHydrationWarning
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                            <span>50% (loose)</span>
                            <span>100% (exact)</span>
                        </div>
                    </div>

                    {/* Analyze Button */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            suppressHydrationWarning
                        >
                            Clear
                        </button>
                        <button
                            type="submit"
                            disabled={isAnalyzing || loadingColumns || !column}
                            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg hover:from-amber-600 hover:to-orange-600 focus:ring-2 focus:ring-amber-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            suppressHydrationWarning
                        >
                            {isAnalyzing ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Analyzing...
                                </span>
                            ) : (
                                'Analyze'
                            )}
                        </button>
                    </div>
                </div>

                {/* Multi‑select filter dropdowns */}
                <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200/50">
                    {renderFilterDropdown('division', 'Division')}
                    {renderFilterDropdown('section', 'Section')}
                    {renderFilterDropdown('department', 'Department')}
                </div>
                {filtersError && (
                    <p className="text-[10px] text-red-500">{filtersError}</p>
                )}
            </form>
        </div>
    );
};