"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { BackendAuthor } from "@/src/lib/types";
import { interpolate, useLanguage } from "@/src/lib/i18n/context";
import { Input } from "@/src/components/ui/Input";

export interface AuthorSelection {
    name: string;
    /** Id of an existing author the user picked (or that was auto-matched). Empty when none. */
    authorId: string;
    /** The user explicitly asked for a new author even though one with this name exists. */
    newAuthor: boolean;
}

interface AuthorPickerProps {
    value: AuthorSelection;
    onChange: (next: AuthorSelection) => void;
    label: string;
    placeholder: string;
}

async function searchAuthors(query: string): Promise<BackendAuthor[]> {
    try {
        const res = await fetch(`/api/author/search?query=${encodeURIComponent(query)}`);
        if (!res.ok) return [];
        const data: unknown = await res.json().catch(() => []);
        return Array.isArray(data) ? (data as BackendAuthor[]) : [];
    } catch {
        return [];
    }
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Author field with suggestions from the user's own authors. Typing an existing name and leaving
 * the field selects that author automatically, so the same person never ends up as two authors by
 * accident. If two authors really do share a name, "create a separate author" opts out.
 */
export function AuthorPicker({ value, onChange, label, placeholder }: AuthorPickerProps) {
    const { t } = useLanguage();
    const listId = useId();
    const [focused, setFocused] = useState(false);
    const [results, setResults] = useState<BackendAuthor[]>([]);

    // Lets the async blur-match check whether the user kept typing while it was in flight.
    const latestName = useRef(value.name);
    useEffect(() => { latestName.current = value.name; }, [value.name]);

    const query = value.name.trim();

    // Debounced suggestions while the field is focused.
    useEffect(() => {
        if (!focused || !query) return;
        let cancelled = false;
        const handle = setTimeout(() => {
            searchAuthors(query).then((list) => { if (!cancelled) setResults(list); });
        }, 250);
        return () => { cancelled = true; clearTimeout(handle); };
    }, [focused, query]);

    const suggestions = focused && query ? results : [];
    const exactMatches = suggestions.filter((a) => sameName(a.name, value.name));
    const canCreateSeparate = exactMatches.length > 0 && !value.newAuthor;

    function select(author: BackendAuthor) {
        onChange({ name: author.name, authorId: String(author.id), newAuthor: false });
        setFocused(false);
    }

    function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
        // Any edit drops the previous choice: it was about the old text.
        onChange({ name: e.target.value, authorId: "", newAuthor: false });
    }

    async function handleBlur() {
        setFocused(false);
        const typed = value.name;
        if (!typed.trim() || value.authorId || value.newAuthor) return;
        // Don't rely on the debounced list being fresh: ask now, then auto-select a unique exact match.
        const matches = (await searchAuthors(typed.trim())).filter((a) => sameName(a.name, typed));
        if (matches.length === 1 && latestName.current === typed) select(matches[0]);
    }

    return (
        <div className="relative">
            <Input
                label={label}
                name="author"
                value={value.name}
                onChange={handleInput}
                onFocus={() => setFocused(true)}
                onBlur={handleBlur}
                placeholder={placeholder}
                autoComplete="off"
                role="combobox"
                aria-expanded={suggestions.length > 0}
                aria-controls={listId}
                aria-autocomplete="list"
            />

            {value.authorId && (
                <p className="mt-1 text-xs text-[var(--muted)]">{t.addBook.authorExisting}</p>
            )}
            {value.newAuthor && (
                <p className="mt-1 text-xs text-[var(--muted)]">{t.addBook.authorWillCreate}</p>
            )}

            {suggestions.length > 0 && (
                // onMouseDown keeps focus in the input so choosing an option doesn't trigger blur first.
                <ul
                    id={listId}
                    role="listbox"
                    aria-label={t.addBook.authorSuggestions}
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute start-0 end-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg"
                >
                    {suggestions.map((author) => (
                        <li key={author.id} role="option" aria-selected={String(author.id) === value.authorId}>
                            <button
                                type="button"
                                onClick={() => select(author)}
                                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-start text-sm text-[var(--foreground)] hover:bg-stone-100 cursor-pointer"
                            >
                                <span className="truncate">{author.name}</span>
                                {author.bookCount !== undefined && (
                                    <span className="shrink-0 text-xs text-[var(--muted)]">
                                        {interpolate(t.addBook.authorBooksCount, { count: String(author.bookCount) })}
                                    </span>
                                )}
                            </button>
                        </li>
                    ))}
                    {canCreateSeparate && (
                        <li role="presentation" className="border-t border-[var(--border)] mt-1 pt-1">
                            <button
                                type="button"
                                onClick={() => {
                                    onChange({ name: value.name.trim(), authorId: "", newAuthor: true });
                                    setFocused(false);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm text-[var(--accent)] hover:bg-stone-100 cursor-pointer"
                            >
                                <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                {interpolate(t.addBook.authorCreateSeparate, { name: value.name.trim() })}
                            </button>
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}
