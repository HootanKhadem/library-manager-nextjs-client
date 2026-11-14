"use client";

import { ReactNode, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { DataTable, DataTableBody, DataTableHead, DataTableRow, Td, Th } from "./DataTable";

export interface SortState {
    id: string;
    dir: "asc" | "desc";
}

export interface DataGridColumn<T> {
    /** Stable id. In server-sorted mode this is the `sort` value sent to the backend. */
    id: string;
    header: ReactNode;
    cell: (row: T, index: number) => ReactNode;
    /** Show sort controls on this header. In client-sorted mode `sortValue` is also required. */
    sortable?: boolean;
    /** Client-sorted mode only: value to compare. null/undefined always sort last. */
    sortValue?: (row: T) => string | number | null | undefined;
    className?: string;
}

interface DataGridProps<T> {
    columns: DataGridColumn<T>[];
    rows: T[];
    rowKey: (row: T, index: number) => string | number;
    onRowClick?: (row: T) => void;
    /** Pass `onSortChange` (+ `sort`) when the server sorts (paginated lists); omit both to sort rows in the browser. */
    sort?: SortState | null;
    onSortChange?: (sort: SortState | null) => void;
    className?: string;
}

// asc -> desc -> unsorted
function nextSort(current: SortState | null | undefined, id: string): SortState | null {
    if (!current || current.id !== id) return { id, dir: "asc" };
    return current.dir === "asc" ? { id, dir: "desc" } : null;
}

function compare(a: string | number | null | undefined, b: string | number | null | undefined): number {
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b), undefined, { sensitivity: "base", numeric: true });
}

export function DataGrid<T>({ columns, rows, rowKey, onRowClick, sort, onSortChange, className }: DataGridProps<T>) {
    const controlled = onSortChange !== undefined;
    const [localSort, setLocalSort] = useState<SortState | null>(null);
    const active = controlled ? (sort ?? null) : localSort;

    const visibleRows = useMemo(() => {
        if (controlled || !active) return rows;
        const col = columns.find((c) => c.id === active.id);
        if (!col?.sortValue) return rows;
        const sign = active.dir === "asc" ? 1 : -1;
        const getValue = col.sortValue;
        // Nulls stay last in both directions, so the sign is applied only to non-null pairs.
        return [...rows].sort((a, b) => {
            const av = getValue(a);
            const bv = getValue(b);
            if (av == null || bv == null) return compare(av, bv);
            return sign * compare(av, bv);
        });
    }, [rows, columns, active, controlled]);

    const handleSort = (id: string) => {
        const next = nextSort(active, id);
        if (onSortChange) onSortChange(next);
        else setLocalSort(next);
    };

    return (
        <DataTable className={className}>
            <DataTableHead>
                <tr>
                    {columns.map((col) => {
                        const isActive = active?.id === col.id;
                        const Icon = !isActive ? ArrowUpDown : active.dir === "asc" ? ArrowUp : ArrowDown;
                        return (
                            <Th
                                key={col.id}
                                aria-sort={isActive ? (active.dir === "asc" ? "ascending" : "descending") : undefined}
                            >
                                {col.sortable ? (
                                    <button
                                        type="button"
                                        onClick={() => handleSort(col.id)}
                                        className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-[var(--foreground)] transition-colors"
                                    >
                                        {col.header}
                                        <Icon
                                            className={["h-3 w-3", isActive ? "text-[var(--foreground)]" : "opacity-40"].join(" ")}
                                            aria-hidden="true"
                                        />
                                    </button>
                                ) : (
                                    col.header
                                )}
                            </Th>
                        );
                    })}
                </tr>
            </DataTableHead>
            <DataTableBody>
                {visibleRows.map((row, i) => (
                    <DataTableRow
                        key={rowKey(row, i)}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        className={onRowClick ? "cursor-pointer" : undefined}
                    >
                        {columns.map((col) => (
                            <Td key={col.id} className={col.className}>{col.cell(row, i)}</Td>
                        ))}
                    </DataTableRow>
                ))}
            </DataTableBody>
        </DataTable>
    );
}
