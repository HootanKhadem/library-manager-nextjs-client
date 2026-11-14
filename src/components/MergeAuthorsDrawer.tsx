"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Search, X } from "lucide-react";
import { BackendAuthor } from "@/src/lib/types";
import { interpolate, useLanguage } from "@/src/lib/i18n/context";
import { Avatar } from "@/src/components/ui/Avatar";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";

interface MergeAuthorsDrawerProps {
    /** The author that survives; the picked authors are merged into it. */
    author: BackendAuthor;
    open: boolean;
    onClose: () => void;
    onMerged: (result: { count: number; name: string }) => void;
}

interface MergePreview {
    bookCount: number;
    duplicateTitles: string[];
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

// Authors of the same person usually share a surname, so the longest word is the best search seed.
function nameSeed(name: string): string {
    const words = name.match(/\p{L}{3,}/gu) ?? [];
    return words.reduce((best, w) => (w.length > best.length ? w : best), "");
}

export function MergeAuthorsDrawer(props: MergeAuthorsDrawerProps) {
    // Mounted only while open, so every opening starts from a clean state.
    return props.open ? <DrawerBody {...props} /> : null;
}

function DrawerBody({ author, onClose, onMerged }: MergeAuthorsDrawerProps) {
    const { t } = useLanguage();
    const [suggested, setSuggested] = useState<BackendAuthor[]>([]);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<BackendAuthor[]>([]);
    const [picked, setPicked] = useState<Map<number, BackendAuthor>>(new Map());
    const [name, setName] = useState(author.name);
    const [preview, setPreview] = useState<MergePreview | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [failed, setFailed] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => { searchRef.current?.focus(); }, []);

    useEffect(() => {
        const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handle);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handle);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    useEffect(() => {
        const seed = nameSeed(author.name);
        if (!seed) return;
        let cancelled = false;
        searchAuthors(seed).then((list) => { if (!cancelled) setSuggested(list.filter((a) => a.id !== author.id)); });
        return () => { cancelled = true; };
    }, [author.id, author.name]);

    const trimmedQuery = query.trim();
    useEffect(() => {
        if (!trimmedQuery) return;
        let cancelled = false;
        const handle = setTimeout(() => {
            searchAuthors(trimmedQuery).then((list) => { if (!cancelled) setResults(list); });
        }, 250);
        return () => { cancelled = true; clearTimeout(handle); };
    }, [trimmedQuery]);

    const suggestedIds = useMemo(() => new Set(suggested.map((a) => a.id)), [suggested]);
    const found = trimmedQuery ? results.filter((a) => a.id !== author.id && !suggestedIds.has(a.id)) : [];
    const pickedList = [...picked.values()];
    const sourceIds = pickedList.map((a) => a.id);
    const sourceKey = sourceIds.join(",");

    // Dry run on the server: total books afterwards and titles that collide across the merged authors.
    useEffect(() => {
        if (!sourceKey) return;
        let cancelled = false;
        fetch("/api/author/merge/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetId: author.id, sourceIds: sourceKey.split(",").map(Number) }),
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data: MergePreview | null) => { if (!cancelled) setPreview(data); })
            .catch(() => { if (!cancelled) setPreview(null); });
        return () => { cancelled = true; };
    }, [author.id, sourceKey]);

    const toggle = (a: BackendAuthor) => {
        setFailed(false);
        setPreview(null);
        setPicked((prev) => {
            const next = new Map(prev);
            if (next.has(a.id)) next.delete(a.id);
            else next.set(a.id, a);
            return next;
        });
    };

    const selectAll = () => {
        setFailed(false);
        setPreview(null);
        setPicked((prev) => new Map([...prev, ...suggested.map((a) => [a.id, a] as [number, BackendAuthor])]));
    };

    const finalName = name.trim();
    const canMerge = pickedList.length > 0 && finalName.length > 0 && !submitting;
    const chipNames = [...new Set([author.name, ...pickedList.map((a) => a.name)])];

    const merge = async () => {
        setSubmitting(true);
        setFailed(false);
        try {
            const res = await fetch("/api/author/merge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetId: author.id,
                    sourceIds,
                    ...(finalName !== author.name ? { name: finalName } : {}),
                }),
            });
            if (!res.ok) throw new Error(String(res.status));
            onMerged({ count: pickedList.length, name: finalName });
        } catch {
            setFailed(true);
            setSubmitting(false);
        }
    };

    const row = (a: BackendAuthor) => {
        const on = picked.has(a.id);
        return (
            <label
                key={a.id}
                className={[
                    "mb-2 flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                    on ? "border-[var(--accent)] bg-[var(--accent-subtle)]" : "border-[var(--border)] hover:bg-stone-50",
                ].join(" ")}
            >
                <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(a)}
                    className="h-4 w-4 accent-[var(--accent)]"
                    aria-label={a.name}
                />
                <Avatar name={a.name} size="sm" />
                <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-semibold text-[var(--foreground)]">{a.name}</span>
                    <span className="text-xs text-[var(--muted)]">
                        {interpolate(t.authors.mergeBooksCount, { count: String(a.bookCount ?? 0) })}
                    </span>
                </span>
            </label>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end" data-testid="merge-authors-drawer">
            <div className="absolute inset-0 bg-black/40 animate-fadeIn" onClick={onClose} aria-hidden="true" />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="merge-drawer-title"
                className="relative z-10 flex h-full w-full max-w-md flex-col border-s border-[var(--border)] bg-[var(--card)]"
                style={{ boxShadow: "var(--shadow-modal)" }}
            >
                <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
                    <div>
                        <h2 id="merge-drawer-title" className="text-base font-semibold text-[var(--foreground)]">
                            {interpolate(t.authors.mergeTitle, { name: author.name })}
                        </h2>
                        <p className="mt-0.5 text-sm text-[var(--muted)]">{t.authors.mergeDesc}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t.authors.mergeClose}
                        className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg text-[var(--muted)] hover:bg-stone-100"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 pb-4">
                    {suggested.length > 0 && (
                        <section>
                            <div className="mb-2 mt-2 flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{t.authors.mergeSuggested}</h3>
                                <button type="button" onClick={selectAll} className="cursor-pointer text-xs font-semibold text-[var(--accent)] underline underline-offset-2">
                                    {t.authors.mergeSelectAll}
                                </button>
                            </div>
                            {suggested.map(row)}
                        </section>
                    )}

                    <section className="mt-4">
                        <label htmlFor="merge-search" className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                            {t.authors.mergeFind}
                        </label>
                        <div className="relative">
                            <Search className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" aria-hidden="true" />
                            <Input
                                id="merge-search"
                                ref={searchRef}
                                className="ps-9"
                                placeholder={t.authors.mergeSearchPlaceholder}
                                value={query}
                                onChange={(e) => { setQuery(e.target.value); if (!e.target.value.trim()) setResults([]); }}
                                autoComplete="off"
                            />
                        </div>
                        <div className="mt-2">
                            {found.map(row)}
                            {trimmedQuery && found.length === 0 && (
                                <p className="px-0.5 text-sm text-[var(--muted)]">{interpolate(t.authors.mergeNoMatch, { query: trimmedQuery })}</p>
                            )}
                        </div>
                    </section>

                    {pickedList.length > 0 && (
                        <section className="mt-4">
                            <Input
                                label={t.authors.mergeFinalName}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="off"
                            />
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {chipNames.map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => setName(n)}
                                        className={[
                                            "cursor-pointer rounded-full border px-3 py-1 text-xs",
                                            n === name ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]" : "border-[var(--border-strong)] hover:bg-stone-50",
                                        ].join(" ")}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-4 grid gap-2 rounded-xl border border-[var(--border)] bg-stone-50 p-3 text-sm">
                                {preview && (
                                    <p className="font-semibold text-[var(--foreground)]">
                                        {interpolate(t.authors.mergeResult, { count: String(preview.bookCount) })}
                                    </p>
                                )}
                                {preview && preview.duplicateTitles.length > 0 && (
                                    <p className="flex gap-2 text-[var(--warning)]" data-testid="merge-duplicate-titles">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                                        <span>
                                            {interpolate(t.authors.mergeDuplicateTitles, {
                                                count: String(preview.duplicateTitles.length),
                                                titles: preview.duplicateTitles.join(", "),
                                            })}
                                        </span>
                                    </p>
                                )}
                                <p className="flex gap-2 text-[var(--destructive)]">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                                    <span>{interpolate(t.authors.mergeDeleteWarning, { names: pickedList.map((a) => a.name).join(", ") })}</span>
                                </p>
                            </div>
                        </section>
                    )}

                    {failed && <p role="alert" className="mt-3 text-sm text-[var(--destructive)]">{t.authors.mergeError}</p>}
                </div>

                <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
                    <Button variant="secondary" onClick={onClose}>{t.authors.mergeCancel}</Button>
                    <Button onClick={merge} disabled={!canMerge} loading={submitting}>
                        {pickedList.length > 0
                            ? interpolate(t.authors.mergeConfirm, { count: String(pickedList.length) })
                            : t.authors.mergeSelectToMerge}
                    </Button>
                </div>
            </div>
        </div>
    );
}
