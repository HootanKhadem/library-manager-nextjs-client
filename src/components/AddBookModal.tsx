"use client";
/**
 * components/AddBookModal.tsx
 *
 * Modal form for adding a new book to the library.
 *
 * i18n: every field label, placeholder, select option, and button uses
 * t.addBook. Genre display names and status labels are translated via
 * t.addBook.genres and t.addBook.statuses. The internal option values
 * (e.g. "Fiction", "Owned") are kept in English since they are used as
 * data identifiers by the rest of the app — only the displayed text changes.
 */

import {useEffect, useState} from "react";
import {BookStatus} from "@/src/lib/types";
import {useLanguage} from "@/src/lib/i18n/context";

interface AddBookModalProps {
    onClose: () => void;
    onAdd: (book: NewBookFormData) => void;
}

export interface NewBookFormData {
    title: string;
    author: string;
    year: string;
    genre: string;
    status: BookStatus;
    publisher: string;
    isbn: string;
    pages: string;
    rating: string;
    description: string;
    notes: string;
}

const EMPTY_FORM: NewBookFormData = {
    title: "", author: "", year: "", genre: "", status: "Owned",
    publisher: "", isbn: "", pages: "", rating: "", description: "", notes: "",
};

export default function AddBookModal({onClose, onAdd}: AddBookModalProps) {
    const {t} = useLanguage();
    const [form, setForm] = useState<NewBookFormData>(EMPTY_FORM);

    // Close on Escape — language-agnostic
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        setForm((prev) => ({...prev, [e.target.name]: e.target.value}));
    }

    function handleSubmit() {
        if (!form.title.trim() || !form.author.trim()) return;
        onAdd(form);
        setForm(EMPTY_FORM);
        onClose();
    }

    // Genre options: value is the canonical English identifier; label is translated.
    // The value is stored in the book data and must stay consistent across languages.
    const genreOptions: { value: string; label: string }[] = [
        {value: "Fiction", label: t.addBook.genres.fiction},
        {value: "Non-fiction", label: t.addBook.genres.nonFiction},
        {value: "Mystery", label: t.addBook.genres.mystery},
        {value: "Science Fiction", label: t.addBook.genres.scienceFiction},
        {value: "Philosophy", label: t.addBook.genres.philosophy},
        {value: "Art Theory", label: t.addBook.genres.artTheory},
        {value: "Poetry", label: t.addBook.genres.poetry},
        {value: "History", label: t.addBook.genres.history},
        {value: "Biography", label: t.addBook.genres.biography},
        {value: "Psychology", label: t.addBook.genres.psychology},
        {value: "Other", label: t.addBook.genres.other},
    ];

    // Status options: same pattern — canonical value, translated label.
    const statusOptions: { value: BookStatus; label: string }[] = [
        {value: "Owned", label: t.addBook.statuses.owned},
        {value: "Lent Out", label: t.addBook.statuses.lentOut},
        {value: "Wishlist", label: t.addBook.statuses.wishlist},
        {value: "Read", label: t.addBook.statuses.read},
    ];

    // Rating options: value is the numeric string; label is the translated star string.
    const ratingOptions: { value: string; label: string }[] = [
        {value: "5", label: t.addBook.ratings.r5},
        {value: "4", label: t.addBook.ratings.r4},
        {value: "3", label: t.addBook.ratings.r3},
        {value: "2", label: t.addBook.ratings.r2},
        {value: "1", label: t.addBook.ratings.r1},
    ];

    return (
        <div
            className="fixed inset-0 bg-[rgba(26,15,0,0.6)] z-[200] flex items-center justify-center backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-modal-title"
            data-testid="add-book-modal"
        >
            <div
                className="bg-[#f5f0e8] border border-[rgba(61,28,2,0.15)] rounded-lg w-[min(660px,95vw)] max-h-[88vh] overflow-y-auto shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#5c2d0a] to-[#3d1c02] px-8 py-7 relative">
                    <h2 id="add-modal-title" className="font-playfair text-2xl font-bold text-[#f5f0e8]">
                        {t.addBook.title}
                    </h2>
                    <p className="text-[rgba(245,240,232,0.65)] text-sm mt-1">{t.addBook.subtitle}</p>
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center bg-[rgba(245,240,232,0.15)] border border-[rgba(245,240,232,0.2)] text-[#f5f0e8] hover:bg-[rgba(245,240,232,0.25)] transition-colors"
                        aria-label={t.common.close}
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="px-8 py-7">
                    <div className="grid grid-cols-2 gap-4">
                        <FormGroup label={t.addBook.fieldTitle} className="col-span-2">
                            <input name="title" value={form.title} onChange={handleChange}
                                   placeholder={t.addBook.fieldTitlePlaceholder} className={inputCls}/>
                        </FormGroup>
                        <FormGroup label={t.addBook.fieldAuthor}>
                            <input name="author" value={form.author} onChange={handleChange}
                                   placeholder={t.addBook.fieldAuthorPlaceholder} className={inputCls}/>
                        </FormGroup>
                        <FormGroup label={t.addBook.fieldYear}>
                            <input name="year" type="number" value={form.year} onChange={handleChange}
                                   placeholder={t.addBook.fieldYearPlaceholder} className={inputCls}/>
                        </FormGroup>
                        <FormGroup label={t.addBook.fieldGenre}>
                            <select name="genre" value={form.genre} onChange={handleChange} className={inputCls}>
                                <option value="">{t.addBook.fieldGenreDefault}</option>
                                {genreOptions.map(({value, label}) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </FormGroup>
                        <FormGroup label={t.addBook.fieldStatus}>
                            <select name="status" value={form.status} onChange={handleChange} className={inputCls}>
                                {statusOptions.map(({value, label}) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </FormGroup>
                        <FormGroup label={t.addBook.fieldPublisher}>
                            <input name="publisher" value={form.publisher} onChange={handleChange}
                                   placeholder={t.addBook.fieldPublisherPlaceholder} className={inputCls}/>
                        </FormGroup>
                        <FormGroup label={t.addBook.fieldIsbn}>
                            <input name="isbn" value={form.isbn} onChange={handleChange}
                                   placeholder={t.addBook.fieldIsbnPlaceholder} className={inputCls}/>
                        </FormGroup>
                        <FormGroup label={t.addBook.fieldPages}>
                            <input name="pages" type="number" value={form.pages} onChange={handleChange}
                                   placeholder={t.addBook.fieldPagesPlaceholder} className={inputCls}/>
                        </FormGroup>
                        <FormGroup label={t.addBook.fieldRating}>
                            <select name="rating" value={form.rating} onChange={handleChange} className={inputCls}>
                                <option value="">{t.addBook.fieldRatingDefault}</option>
                                {ratingOptions.map(({value, label}) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </FormGroup>
                        <FormGroup label={t.addBook.fieldDescription} className="col-span-2">
              <textarea name="description" value={form.description} onChange={handleChange}
                        placeholder={t.addBook.fieldDescriptionPlaceholder} rows={3}
                        className={`${inputCls} resize-y leading-relaxed`}/>
                        </FormGroup>
                        <FormGroup label={t.addBook.fieldNotes} className="col-span-2">
              <textarea name="notes" value={form.notes} onChange={handleChange}
                        placeholder={t.addBook.fieldNotesPlaceholder} rows={3}
                        className={`${inputCls} resize-y leading-relaxed`}/>
                        </FormGroup>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-[rgba(61,28,2,0.1)] flex gap-2.5 justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded font-mono text-[0.7rem] tracking-[0.08em] uppercase cursor-pointer bg-transparent text-[#6b4c2a] border border-[rgba(61,28,2,0.18)] hover:bg-[#ede5d5] transition-colors"
                    >
                        {t.addBook.btnCancel}
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-5 py-2 rounded font-mono text-[0.7rem] tracking-[0.08em] uppercase cursor-pointer bg-[#3d1c02] text-[#f5f0e8] hover:bg-[#5c2d0a] transition-colors"
                    >
                        {t.addBook.btnAdd}
                    </button>
                </div>
            </div>
        </div>
    );
}

const inputCls = "bg-[#ede5d5] border border-[rgba(61,28,2,0.15)] rounded px-3 py-2 font-serif text-[0.82rem] text-[#1a0f00] outline-none focus:border-[#c4742a] focus:shadow-[0_0_0_3px_rgba(196,116,42,0.1)] w-full transition-all";

function FormGroup({label, children, className = ""}: {
    label: string;
    children: React.ReactNode;
    className?: string
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label className="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#6b4c2a]">
                {label}
            </label>
            {children}
        </div>
    );
}
