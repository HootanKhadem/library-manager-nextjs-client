"use client";

import { Book } from "@/src/lib/types";
import { useLanguage } from "@/src/lib/i18n/context";
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalCloseButton } from "@/src/components/ui/Modal";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { StarRating } from "@/src/components/ui/StarRating";
import { GenreTag } from "@/src/components/ui/GenreTag";
import { Button } from "@/src/components/ui/Button";
import { DataTable, DataTableHead, DataTableBody, DataTableRow, Th, Td } from "@/src/components/ui/DataTable";

interface BookDetailModalProps {
    book: Book | null;
    onClose: () => void;
}

export default function BookDetailModal({ book, onClose }: BookDetailModalProps) {
    const { t } = useLanguage();

    if (!book) return null;

    return (
        <Modal
            open
            onClose={onClose}
            className="max-w-[min(640px,95vw)] max-h-[90vh] overflow-y-auto"
            data-testid="book-detail-modal"
        >
            <ModalHeader>
                <div>
                    <h2 className="text-base font-semibold text-[var(--foreground)] leading-tight" id="modal-title">
                        {book.title}
                    </h2>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{book.author} · {book.year}</p>
                </div>
                <ModalCloseButton onClose={onClose} aria-label={t.common.close} />
            </ModalHeader>

            <ModalBody>
                {/* Meta grid */}
                <div className="grid grid-cols-3 gap-4 mb-5">
                    <MetaItem label={t.bookDetail.labelStatus}>
                        <StatusBadge status={book.status} overdue={book.overdue} />
                    </MetaItem>
                    <MetaItem label={t.bookDetail.labelGenre}>
                        <GenreTag genre={book.genre} />
                    </MetaItem>
                    <MetaItem label={t.bookDetail.labelRating}>
                        {book.rating
                            ? <StarRating value={book.rating} />
                            : <span className="text-sm text-[var(--muted)]">—</span>
                        }
                    </MetaItem>
                    {book.publisher && (
                        <MetaItem label={t.bookDetail.labelPublisher}>
                            <span className="text-sm font-medium text-[var(--foreground)]">{book.publisher}</span>
                        </MetaItem>
                    )}
                    {book.isbn && (
                        <MetaItem label={t.bookDetail.labelIsbn}>
                            <span className="text-xs font-mono text-[var(--foreground)]">{book.isbn}</span>
                        </MetaItem>
                    )}
                    {book.pages && (
                        <MetaItem label={t.bookDetail.labelPages}>
                            <span className="text-sm font-medium text-[var(--foreground)]">{book.pages}</span>
                        </MetaItem>
                    )}
                </div>

                <hr className="border-[var(--border)] my-4" />

                {book.description && (
                    <div className="mb-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
                            {t.bookDetail.labelDescription}
                        </p>
                        <p className="text-sm text-[var(--foreground)] leading-relaxed border-s-2 border-[var(--accent)] ps-3 italic">
                            {book.description}
                        </p>
                    </div>
                )}

                <div className="mb-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
                        {t.bookDetail.labelNotes}
                    </p>
                    <textarea
                        defaultValue={book.notes ?? ""}
                        placeholder={t.bookDetail.notesPlaceholder}
                        rows={3}
                        aria-label={t.bookDetail.labelNotes}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none resize-y transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 hover:border-[var(--border-strong)]"
                    />
                </div>

                {book.lendingHistory && book.lendingHistory.length > 0 && (
                    <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
                            {t.bookDetail.labelLendingHistory}
                        </p>
                        <DataTable>
                            <DataTableHead>
                                <tr>
                                    <Th>{t.bookDetail.colLentTo}</Th>
                                    <Th>{t.bookDetail.colDateOut}</Th>
                                    <Th>{t.bookDetail.colDateReturned}</Th>
                                    <Th>{t.bookDetail.colCondition}</Th>
                                </tr>
                            </DataTableHead>
                            <DataTableBody>
                                {book.lendingHistory.map((record, i) => (
                                    <DataTableRow key={i}>
                                        <Td>{record.lentTo}</Td>
                                        <Td>{record.dateOut}</Td>
                                        <Td>{record.dateReturned ?? "—"}</Td>
                                        <Td>{record.condition ?? "—"}</Td>
                                    </DataTableRow>
                                ))}
                            </DataTableBody>
                        </DataTable>
                    </div>
                )}
            </ModalBody>

            <ModalFooter>
                <Button variant="danger"    size="sm">{t.bookDetail.btnDelete}</Button>
                <Button variant="secondary" size="sm" onClick={onClose}>{t.bookDetail.btnClose}</Button>
                <Button variant="primary"   size="sm">{t.bookDetail.btnLend}</Button>
            </ModalFooter>
        </Modal>
    );
}

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)] mb-1">{label}</p>
            <div>{children}</div>
        </div>
    );
}
