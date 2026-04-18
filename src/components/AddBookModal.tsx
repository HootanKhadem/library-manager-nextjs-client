"use client";

import { useState } from "react";
import { BookStatus } from "@/src/lib/types";
import { useLanguage } from "@/src/lib/i18n/context";
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalCloseButton } from "@/src/components/ui/Modal";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { Button } from "@/src/components/ui/Button";

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

export default function AddBookModal({ onClose, onAdd }: AddBookModalProps) {
    const { t } = useLanguage();
    const [form, setForm] = useState<NewBookFormData>(EMPTY_FORM);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    function handleSubmit() {
        if (!form.title.trim() || !form.author.trim()) return;
        onAdd(form);
        setForm(EMPTY_FORM);
        onClose();
    }

    const genreOptions: { value: string; label: string }[] = [
        { value: "Fiction",        label: t.addBook.genres.fiction },
        { value: "Non-fiction",    label: t.addBook.genres.nonFiction },
        { value: "Mystery",        label: t.addBook.genres.mystery },
        { value: "Science Fiction",label: t.addBook.genres.scienceFiction },
        { value: "Philosophy",     label: t.addBook.genres.philosophy },
        { value: "Art Theory",     label: t.addBook.genres.artTheory },
        { value: "Poetry",         label: t.addBook.genres.poetry },
        { value: "History",        label: t.addBook.genres.history },
        { value: "Biography",      label: t.addBook.genres.biography },
        { value: "Psychology",     label: t.addBook.genres.psychology },
        { value: "Other",          label: t.addBook.genres.other },
    ];

    const statusOptions: { value: BookStatus; label: string }[] = [
        { value: "Owned",    label: t.addBook.statuses.owned },
        { value: "Lent Out", label: t.addBook.statuses.lentOut },
        { value: "Wishlist", label: t.addBook.statuses.wishlist },
        { value: "Read",     label: t.addBook.statuses.read },
    ];

    const ratingOptions = [
        { value: "5", label: t.addBook.ratings.r5 },
        { value: "4", label: t.addBook.ratings.r4 },
        { value: "3", label: t.addBook.ratings.r3 },
        { value: "2", label: t.addBook.ratings.r2 },
        { value: "1", label: t.addBook.ratings.r1 },
    ];

    return (
        <Modal open onClose={onClose} className="max-w-[min(640px,95vw)] max-h-[90vh] overflow-y-auto" data-testid="add-book-modal">
            <ModalHeader>
                <div>
                    <h2 className="text-base font-semibold text-[var(--foreground)]">{t.addBook.title}</h2>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{t.addBook.subtitle}</p>
                </div>
                <ModalCloseButton onClose={onClose} aria-label={t.common.close} />
            </ModalHeader>

            <ModalBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <Input
                            label={t.addBook.fieldTitle}
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder={t.addBook.fieldTitlePlaceholder}
                        />
                    </div>
                    <Input
                        label={t.addBook.fieldAuthor}
                        name="author"
                        value={form.author}
                        onChange={handleChange}
                        placeholder={t.addBook.fieldAuthorPlaceholder}
                    />
                    <Input
                        label={t.addBook.fieldYear}
                        name="year"
                        type="number"
                        value={form.year}
                        onChange={handleChange}
                        placeholder={t.addBook.fieldYearPlaceholder}
                    />
                    <Select label={t.addBook.fieldGenre} name="genre" value={form.genre} onChange={handleChange}>
                        <option value="">{t.addBook.fieldGenreDefault}</option>
                        {genreOptions.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </Select>
                    <Select label={t.addBook.fieldStatus} name="status" value={form.status} onChange={handleChange}>
                        {statusOptions.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </Select>
                    <Input
                        label={t.addBook.fieldPublisher}
                        name="publisher"
                        value={form.publisher}
                        onChange={handleChange}
                        placeholder={t.addBook.fieldPublisherPlaceholder}
                    />
                    <Input
                        label={t.addBook.fieldIsbn}
                        name="isbn"
                        value={form.isbn}
                        onChange={handleChange}
                        placeholder={t.addBook.fieldIsbnPlaceholder}
                    />
                    <Input
                        label={t.addBook.fieldPages}
                        name="pages"
                        type="number"
                        value={form.pages}
                        onChange={handleChange}
                        placeholder={t.addBook.fieldPagesPlaceholder}
                    />
                    <Select label={t.addBook.fieldRating} name="rating" value={form.rating} onChange={handleChange}>
                        <option value="">{t.addBook.fieldRatingDefault}</option>
                        {ratingOptions.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </Select>
                    <div className="sm:col-span-2 flex flex-col gap-1">
                        <label className="text-sm font-medium text-[var(--foreground)]">{t.addBook.fieldDescription}</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder={t.addBook.fieldDescriptionPlaceholder}
                            rows={3}
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none resize-y transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 hover:border-[var(--border-strong)]"
                        />
                    </div>
                    <div className="sm:col-span-2 flex flex-col gap-1">
                        <label className="text-sm font-medium text-[var(--foreground)]">{t.addBook.fieldNotes}</label>
                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            placeholder={t.addBook.fieldNotesPlaceholder}
                            rows={3}
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none resize-y transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 hover:border-[var(--border-strong)]"
                        />
                    </div>
                </div>
            </ModalBody>

            <ModalFooter>
                <Button variant="secondary" size="sm" onClick={onClose}>{t.addBook.btnCancel}</Button>
                <Button variant="primary"   size="sm" onClick={handleSubmit}>{t.addBook.btnAdd}</Button>
            </ModalFooter>
        </Modal>
    );
}
