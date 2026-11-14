import { render, screen, fireEvent, within } from "@testing-library/react";
import { DataGrid, DataGridColumn } from "@/src/components/ui/DataGrid";

interface Row { id: number; name: string; pages: number | null }
const ROWS: Row[] = [
    { id: 1, name: "Beta", pages: 300 },
    { id: 2, name: "alpha", pages: null },
    { id: 3, name: "Gamma", pages: 100 },
];
const COLUMNS: DataGridColumn<Row>[] = [
    { id: "name", header: "Name", sortable: true, sortValue: (r) => r.name, cell: (r) => r.name },
    { id: "pages", header: "Pages", sortable: true, sortValue: (r) => r.pages, cell: (r) => r.pages ?? "-" },
    { id: "plain", header: "Plain", cell: () => "x" },
];

const names = () => screen.getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("cell")[0].textContent);

describe("DataGrid", () => {
    it("renders rows and only makes sortable headers clickable", () => {
        render(<DataGrid columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />);
        expect(names()).toEqual(["Beta", "alpha", "Gamma"]);
        expect(screen.getByRole("button", { name: "Name" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Plain" })).not.toBeInTheDocument();
    });

    it("sorts in the browser: asc, desc, then back to original order; nulls stay last", () => {
        render(<DataGrid columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />);
        const nameBtn = screen.getByRole("button", { name: "Name" });
        fireEvent.click(nameBtn);
        expect(names()).toEqual(["alpha", "Beta", "Gamma"]);
        fireEvent.click(nameBtn);
        expect(names()).toEqual(["Gamma", "Beta", "alpha"]);
        fireEvent.click(nameBtn);
        expect(names()).toEqual(["Beta", "alpha", "Gamma"]);

        const pagesBtn = screen.getByRole("button", { name: "Pages" });
        fireEvent.click(pagesBtn);
        expect(names()).toEqual(["Gamma", "Beta", "alpha"]);
        fireEvent.click(pagesBtn);
        expect(names()).toEqual(["Beta", "Gamma", "alpha"]);
    });

    it("exposes aria-sort on the active column", () => {
        render(<DataGrid columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />);
        fireEvent.click(screen.getByRole("button", { name: "Name" }));
        expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "ascending");
    });

    it("delegates to onSortChange and keeps row order when the server sorts", () => {
        const onSortChange = jest.fn();
        const { rerender } = render(
            <DataGrid columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} sort={null} onSortChange={onSortChange} />,
        );
        fireEvent.click(screen.getByRole("button", { name: "Name" }));
        expect(onSortChange).toHaveBeenLastCalledWith({ id: "name", dir: "asc" });
        expect(names()).toEqual(["Beta", "alpha", "Gamma"]);

        rerender(<DataGrid columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} sort={{ id: "name", dir: "asc" }} onSortChange={onSortChange} />);
        fireEvent.click(screen.getByRole("button", { name: "Name" }));
        expect(onSortChange).toHaveBeenLastCalledWith({ id: "name", dir: "desc" });

        rerender(<DataGrid columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} sort={{ id: "name", dir: "desc" }} onSortChange={onSortChange} />);
        fireEvent.click(screen.getByRole("button", { name: "Name" }));
        expect(onSortChange).toHaveBeenLastCalledWith(null);
    });

    it("calls onRowClick with the row", () => {
        const onRowClick = jest.fn();
        render(<DataGrid columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} onRowClick={onRowClick} />);
        fireEvent.click(screen.getByText("Gamma"));
        expect(onRowClick).toHaveBeenCalledWith(ROWS[2]);
    });
});
