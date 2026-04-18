import { HTMLAttributes, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";

function DataTable({ className = "", children, ...props }: HTMLAttributes<HTMLTableElement>) {
    return (
        <div className="w-full overflow-x-auto rounded-xl border border-[var(--border)]" style={{ boxShadow: "var(--shadow-card)" }}>
            <table
                className={["w-full text-sm text-[var(--foreground)] bg-[var(--card)]", className].join(" ")}
                {...props}
            >
                {children}
            </table>
        </div>
    );
}

function DataTableHead({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <thead className="border-b border-[var(--border)] bg-stone-50/80" {...props}>
            {children}
        </thead>
    );
}

function DataTableBody({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <tbody className="divide-y divide-[var(--border)]" {...props}>
            {children}
        </tbody>
    );
}

function DataTableRow({ className = "", children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
    return (
        <tr
            className={["transition-colors hover:bg-stone-50/60", className].join(" ")}
            {...props}
        >
            {children}
        </tr>
    );
}

function Th({ className = "", children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
    return (
        <th
            className={["px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)] whitespace-nowrap", className].join(" ")}
            {...props}
        >
            {children}
        </th>
    );
}

function Td({ className = "", children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
    return (
        <td
            className={["px-4 py-3 align-middle", className].join(" ")}
            {...props}
        >
            {children}
        </td>
    );
}

export { DataTable, DataTableHead, DataTableBody, DataTableRow, Th, Td };
