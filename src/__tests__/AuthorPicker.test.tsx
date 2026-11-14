import { useEffect, useState } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthorPicker, AuthorSelection } from "@/src/components/AuthorPicker";

const AUTHORS = [
    { id: 1, name: "جی دی سلینجر", image: "", bookCount: 1 },
    { id: 2, name: "J. D. Salinger", image: "", bookCount: 3 },
];

function mockSearch(results: unknown[] | ((q: string) => unknown[])) {
    global.fetch = jest.fn((url: string) => {
        const q = decodeURIComponent(url.split("query=")[1] ?? "");
        const body = typeof results === "function" ? results(q) : results;
        return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
    }) as jest.Mock;
}

let latest: AuthorSelection;
function Harness({ initial = { name: "", authorId: "", newAuthor: false } }: { initial?: AuthorSelection }) {
    const [value, setValue] = useState<AuthorSelection>(initial);
    useEffect(() => { latest = value; }, [value]);
    return <AuthorPicker value={value} onChange={setValue} label="Author" placeholder="name" />;
}

const input = () => screen.getByRole("combobox");

async function type(text: string) {
    fireEvent.focus(input());
    fireEvent.change(input(), { target: { value: text } });
    await act(async () => { await new Promise((r) => setTimeout(r, 300)); }); // debounce
}

describe("AuthorPicker", () => {
    afterEach(() => jest.resetAllMocks());

    it("suggests the user's authors as they type, with book counts", async () => {
        mockSearch(AUTHORS);
        render(<Harness />);
        await type("sal");
        expect(await screen.findByRole("option", { name: /J\. D\. Salinger/ })).toBeInTheDocument();
        expect(screen.getByText("3 books")).toBeInTheDocument();
        expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe("/api/author/search?query=sal");
    });

    it("selects a suggestion by id", async () => {
        mockSearch(AUTHORS);
        render(<Harness />);
        await type("sal");
        fireEvent.click(await screen.findByRole("option", { name: /J\. D\. Salinger/ }).then((o) => o.querySelector("button")!));
        expect(latest).toEqual({ name: "J. D. Salinger", authorId: "2", newAuthor: false });
        expect(screen.getByText("Existing author")).toBeInTheDocument();
    });

    it("auto-selects the existing author on blur when the name matches exactly once", async () => {
        mockSearch([AUTHORS[0]]);
        render(<Harness />);
        fireEvent.focus(input());
        fireEvent.change(input(), { target: { value: "  جی دی سلینجر " } });
        await act(async () => { fireEvent.blur(input()); });
        await waitFor(() => expect(latest.authorId).toBe("1"));
        expect(latest.name).toBe("جی دی سلینجر");
    });

    it("does not auto-select when only a partial match exists", async () => {
        mockSearch([{ id: 2, name: "J. D. Salinger", image: "", bookCount: 3 }]);
        render(<Harness />);
        fireEvent.focus(input());
        fireEvent.change(input(), { target: { value: "Salinger" } });
        await act(async () => { fireEvent.blur(input()); });
        expect(latest.authorId).toBe("");
    });

    it("does not auto-select when several authors share the exact name", async () => {
        mockSearch([AUTHORS[0], { ...AUTHORS[0], id: 9 }]);
        render(<Harness />);
        fireEvent.focus(input());
        fireEvent.change(input(), { target: { value: "جی دی سلینجر" } });
        await act(async () => { fireEvent.blur(input()); });
        expect(latest.authorId).toBe("");
    });

    it("offers to create a separate author when the name already exists, and honours it", async () => {
        mockSearch([AUTHORS[0]]);
        render(<Harness initial={{ name: "جی دی سلینجر", authorId: "1", newAuthor: false }} />);
        await type("جی دی سلینجر");
        fireEvent.click(await screen.findByRole("button", { name: /Create a separate author/ }));
        expect(latest).toEqual({ name: "جی دی سلینجر", authorId: "", newAuthor: true });
        expect(screen.getByText("A new author with this name will be created")).toBeInTheDocument();

        // leaving the field must not undo the choice by auto-matching again
        await act(async () => { fireEvent.blur(input()); });
        expect(latest.newAuthor).toBe(true);
        expect(latest.authorId).toBe("");
    });

    it("does not offer a separate author when the name is new", async () => {
        mockSearch([]);
        render(<Harness />);
        await type("Brand New");
        expect(screen.queryByRole("button", { name: /Create a separate author/ })).not.toBeInTheDocument();
    });

    it("editing the name drops a previous selection", async () => {
        mockSearch([]);
        render(<Harness initial={{ name: "Old", authorId: "5", newAuthor: false }} />);
        fireEvent.change(input(), { target: { value: "Older" } });
        expect(latest).toEqual({ name: "Older", authorId: "", newAuthor: false });
    });
});
