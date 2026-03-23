import React, { useRef, useMemo, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, IDatasource, IGetRowsParams, ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

ModuleRegistry.registerModules([AllCommunityModule]);

import { fetchDuplicateItems } from '../api/fetchDuplicateItems';
import { Filters, DateRange, DuplicateItemRow } from '../types/duplicateItemsTypes';

// The shape returned by our fetch function (matches FetchResult in api)
interface FetchResult {
    data: DuplicateItemRow[];
    count: number;
    nextCursor: string | null;
    columns: string[];
    distinct_values: Record<string, (string | number)[]>;
}

export interface DuplicateItemsTableHandle {
    exportCurrentView: () => void;
}

interface DuplicateItemsTableProps {
    filters: Filters;
    dateRange: DateRange;
    onDataLoaded?: (distinctValues: Record<string, (string | number)[]>) => void;
}

interface BlockCache {
    rows: DuplicateItemRow[];
    nextCursor: string | null;
}

export const DuplicateItemsTable = forwardRef<DuplicateItemsTableHandle, DuplicateItemsTableProps>(({
    filters,
    dateRange,
    onDataLoaded,
}, ref) => {
    const gridRef = useRef<AgGridReact>(null);
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
    const columnsSetRef = useRef(false);
    const blockCache = useRef<Map<number, BlockCache>>(new Map());
    const abortControllerRef = useRef<AbortController | null>(null);

    // Expose export method via ref
    useImperativeHandle(ref, () => ({
        exportCurrentView: () => {
            if (gridRef.current?.api) {
                gridRef.current.api.exportDataAsCsv({
                    fileName: `duplicate_items_current_${new Date().toISOString().slice(0, 10)}.csv`,
                });
            }
        },
    }));

    // Clear cache and reset columns when filters change
    useEffect(() => {
        blockCache.current.clear();
        columnsSetRef.current = false;
        setColumnDefs([]);
    }, [filters, dateRange]);

    const getRows = useCallback(
        async (params: IGetRowsParams) => {
            const { startRow, endRow } = params;
            const blockSize = endRow - startRow;
            const blockIndex = Math.floor(startRow / blockSize);

            // Cancel any ongoing request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Check cache
            const cached = blockCache.current.get(blockIndex);
            if (cached) {
                const lastRow = cached.nextCursor ? -1 : startRow + cached.rows.length;
                params.successCallback(cached.rows, lastRow);
                return;
            }

            // Determine cursor for this block
            let cursor: string | null = null;
            if (blockIndex > 0) {
                const prevBlock = blockCache.current.get(blockIndex - 1);
                cursor = prevBlock ? prevBlock.nextCursor : null;
                if (!cursor) {
                    // No cursor available – cannot fetch this block. Assume end.
                    params.successCallback([], startRow);
                    return;
                }
            }

            abortControllerRef.current = new AbortController();
            const { signal } = abortControllerRef.current;

            try {
                // Fetch data – response is already transformed into objects
                const response: FetchResult = await fetchDuplicateItems(
                    {
                        date_range: dateRange,
                        filters,
                        cursor,
                        limit: blockSize,
                    },
                    signal
                );

                const rows = response.data;               // already objects
                const nextCursor = response.nextCursor;   // camelCase from fetch result
                const columns = response.columns;

                // Store in cache
                blockCache.current.set(blockIndex, { rows, nextCursor });

                // Set column definitions on first successful load
                if (!columnsSetRef.current && columns.length > 0) {
                    setColumnDefs(
                        columns.map((col) => ({
                            field: col,
                            sortable: true,
                            filter: true,
                            resizable: true,
                        }))
                    );
                    columnsSetRef.current = true;
                }

                // Pass distinct values to parent (only for the first block)
                if (blockIndex === 0 && response.distinct_values && onDataLoaded) {
                    onDataLoaded(response.distinct_values);
                }

                const lastRow = nextCursor ? -1 : startRow + rows.length;
                params.successCallback(rows, lastRow);
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    return;
                }
                console.error('Error fetching rows:', error);
                params.failCallback();
            } finally {
                if (abortControllerRef.current?.signal === signal) {
                    abortControllerRef.current = null;
                }
            }
        },
        [filters, dateRange, onDataLoaded]
    );

    const datasource = useMemo<IDatasource>(
        () => ({ getRows }),
        [getRows]
    );

    const defaultColDef = useMemo<ColDef>(
        () => ({
            flex: 1,
            minWidth: 120,
            resizable: true,
            sortable: true,
            filter: true,
        }),
        []
    );

    // Refresh datasource when filters change
    useEffect(() => {
        if (gridRef.current?.api) {
            gridRef.current.api.setGridOption('datasource', datasource);
        }
    }, [datasource]);

    return (
        <>
            <style>{`
                .beautiful-grid {
                    border-radius: 16px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05);
                    background: white;
                    overflow: hidden;
                    transition: box-shadow 0.3s ease;
                    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .beautiful-grid:hover {
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                }
                .beautiful-grid .ag-header {
                    background: linear-gradient(145deg, #f8fafc 0%, #eef2f6 100%);
                    border-bottom: 2px solid #d1d9e6;
                    font-weight: 600;
                    color: #1e293b;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                    font-size: 0.85rem;
                }
                .beautiful-grid .ag-header-cell {
                    transition: background-color 0.2s;
                }
                .beautiful-grid .ag-header-cell:hover {
                    background-color: rgba(255, 255, 255, 0.5);
                }
                .beautiful-grid .ag-row {
                    border-bottom: 1px solid #e9eef2;
                    transition: background-color 0.2s, transform 0.1s;
                }
                .beautiful-grid .ag-row-even {
                    background-color: #ffffff;
                }
                .beautiful-grid .ag-row-odd {
                    background-color: #f9fcff;
                }
                .beautiful-grid .ag-row:hover {
                    background-color: #e6f0fa;
                    cursor: pointer;
                }
                .beautiful-grid .ag-cell {
                    padding: 12px 16px;
                    line-height: 1.5;
                    color: #1e293b;
                    font-size: 0.95rem;
                    border-right: 1px solid #e2e8f0;
                    user-select: text;
                }
                .beautiful-grid .ag-cell:last-child {
                    border-right: none;
                }
                .beautiful-grid .ag-icon {
                    color: #5f6b7a;
                }
                .beautiful-grid .ag-filter-toolpanel {
                    background-color: #ffffff;
                }
                .beautiful-grid .ag-body-viewport::-webkit-scrollbar {
                    width: 10px;
                    height: 10px;
                }
                .beautiful-grid .ag-body-viewport::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .beautiful-grid .ag-body-viewport::-webkit-scrollbar-thumb {
                    background: #b9c4d1;
                    border-radius: 10px;
                    border: 2px solid #f1f5f9;
                }
                .beautiful-grid .ag-body-viewport::-webkit-scrollbar-thumb:hover {
                    background: #9aa6b5;
                }
                .beautiful-grid .ag-overlay-loading-center,
                .beautiful-grid .ag-overlay-no-rows-center {
                    background: rgba(255,255,255,0.9);
                    border-radius: 40px;
                    padding: 16px 32px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                    font-size: 1rem;
                    font-weight: 500;
                    color: #334155;
                    border: 1px solid #e2e8f0;
                    backdrop-filter: blur(4px);
                }
                .beautiful-grid .ag-overlay-loading-center {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .beautiful-grid .ag-overlay-loading-center::before {
                    content: "⏳";
                    font-size: 1.4rem;
                    animation: pulse 1.5s infinite;
                }
                .beautiful-grid .ag-overlay-no-rows-center::before {
                    content: "📭 ";
                    font-size: 1.4rem;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .copy-hint {
                    margin-top: 0.5rem;
                    font-size: 0.85rem;
                    color: #6b7280;
                    text-align: right;
                }
            `}</style>

            <div className="ag-theme-quartz beautiful-grid w-full h-[600px]">
                <AgGridReact
                    ref={gridRef}
                    theme="legacy"
                    rowModelType="infinite"
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    infiniteInitialRowCount={100}
                    cacheBlockSize={100}
                    maxConcurrentDatasourceRequests={1}
                    onGridReady={(params) => {
                        params.api.setGridOption('datasource', datasource);
                    }}
                    overlayLoadingTemplate={
                        '<span class="ag-overlay-loading-center">Loading data...</span>'
                    }
                    overlayNoRowsTemplate={
                        '<span class="ag-overlay-no-rows-center">No duplicate items found</span>'
                    }
                    enableCellTextSelection={true}
                    ensureDomOrder={true}
                />
            </div>
            <div className="copy-hint">
                💡 Click a cell, select text, and press <kbd>Ctrl+C</kbd> to copy
            </div>
        </>
    );
});

DuplicateItemsTable.displayName = 'DuplicateItemsTable';