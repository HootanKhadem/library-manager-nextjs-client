import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MergeAuthorsDrawer } from "@/src/components/MergeAuthorsDrawer";
import { LanguageProvider } from "@/src/lib/i18n/context";

const target = { id: 1, name: "J.R.R. Tolkien", image: "" };
const jrr = { id: 2, name: "JRR Tolkien", image: "", bookCount: 2 };
const other = { id: 3, name: "Tolkien, J.R.R.", image: "", bookCount: 1 };

function json(status: number, body: unknown) {
    return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });
}

function setupFetch(opts: { merge?: () => Promise<unknown>; preview?: unknown } = {}) {
    const fetchMock = jest.fn((url: string) => {
        if (url.startsWith("/api/author/search")) return json(200, [target, jrr, other]);
        if (url === "/api/author/merge/preview") return json(200, opts.preview ?? { bookCount: 7, duplicateTitles: [] });
        if (url === "/api/author/merge") return opts.merge ? opts.merge() : json(200, { ...target, bookCount: 7 });
        return Promise.reject(new Error(url));
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    return fetchMock;
}

function renderDrawer(onMerged = jest.fn(), onClose = jest.fn()) {
    render(<LanguageProvider><MergeAuthorsDrawer author={target} open onClose={onClose} onMerged={onMerged} /></LanguageProvider>);
    return { onMerged, onClose };
}

const bodyOf = (fetchMock: jest.Mock, url: string) => {
    const calls = fetchMock.mock.calls.filter(([u]) => u === url);
    return JSON.parse(calls[calls.length - 1][1].body);
};

describe("MergeAuthorsDrawer", () => {
    afterEach(() => jest.resetAllMocks());

    it("renders nothing when closed", () => {
        render(<LanguageProvider><MergeAuthorsDrawer author={target} open={false} onClose={jest.fn()} onMerged={jest.fn()} /></LanguageProvider>);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("suggests other authors by name, never the author itself, and selects nothing by default", async () => {
        setupFetch();
        renderDrawer();
        expect(await screen.findByRole("checkbox", { name: "JRR Tolkien" })).not.toBeChecked();
        expect(screen.getByRole("checkbox", { name: "Tolkien, J.R.R." })).not.toBeChecked();
        expect(screen.queryByRole("checkbox", { name: "J.R.R. Tolkien" })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Select authors to merge" })).toBeDisabled();
    });

    it("shows the preview and a warning for titles that collide", async () => {
        setupFetch({ preview: { bookCount: 7, duplicateTitles: ["The Hobbit"] } });
        renderDrawer();
        await userEvent.click(await screen.findByRole("checkbox", { name: "JRR Tolkien" }));
        expect(await screen.findByText("Result: 7 book(s) under one author")).toBeInTheDocument();
        expect(screen.getByTestId("merge-duplicate-titles")).toHaveTextContent("The Hobbit");
        expect(screen.getByText(/JRR Tolkien will be deleted/)).toBeInTheDocument();
    });

    it("merges the picked authors and keeps the name unless it was changed", async () => {
        const fetchMock = setupFetch();
        const { onMerged } = renderDrawer();
        await userEvent.click(await screen.findByText("Select all"));
        await userEvent.click(screen.getByRole("button", { name: "Merge 2 author(s)" }));

        await waitFor(() => expect(onMerged).toHaveBeenCalledWith({ count: 2, name: "J.R.R. Tolkien" }));
        expect(bodyOf(fetchMock, "/api/author/merge")).toEqual({ targetId: 1, sourceIds: [2, 3] });
    });

    it("sends the new name when the user picks another one", async () => {
        const fetchMock = setupFetch();
        const { onMerged } = renderDrawer();
        await userEvent.click(await screen.findByRole("checkbox", { name: "JRR Tolkien" }));
        const chips = screen.getAllByRole("button", { name: "JRR Tolkien" });
        await userEvent.click(chips[chips.length - 1]);
        await userEvent.click(screen.getByRole("button", { name: "Merge 1 author(s)" }));

        await waitFor(() => expect(onMerged).toHaveBeenCalledWith({ count: 1, name: "JRR Tolkien" }));
        expect(bodyOf(fetchMock, "/api/author/merge")).toEqual({ targetId: 1, sourceIds: [2], name: "JRR Tolkien" });
    });

    it("blocks the merge when the final name is blank", async () => {
        setupFetch();
        renderDrawer();
        await userEvent.click(await screen.findByRole("checkbox", { name: "JRR Tolkien" }));
        await userEvent.clear(screen.getByLabelText("Final name"));
        expect(screen.getByRole("button", { name: "Merge 1 author(s)" })).toBeDisabled();
    });

    it("shows an error and stays open when the merge fails", async () => {
        setupFetch({ merge: () => json(500, {}) });
        const { onMerged } = renderDrawer();
        await userEvent.click(await screen.findByRole("checkbox", { name: "JRR Tolkien" }));
        await userEvent.click(screen.getByRole("button", { name: "Merge 1 author(s)" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("The merge failed");
        expect(onMerged).not.toHaveBeenCalled();
    });

    it("closes on Escape and on Cancel", async () => {
        setupFetch();
        const { onClose } = renderDrawer();
        await userEvent.keyboard("{Escape}");
        await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(onClose).toHaveBeenCalledTimes(2);
    });
});
