"use client";

import Link from "next/link";
import { Author } from "@/src/lib/types";
import { interpolate, useLanguage } from "@/src/lib/i18n/context";
import { PageHeader } from "@/src/components/ui/Topbar";
import { Card, CardBody } from "@/src/components/ui/Card";
import { GenreTag } from "@/src/components/ui/GenreTag";
import { Avatar } from "@/src/components/ui/Avatar";
import { Users } from "lucide-react";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import Pagination from "@/src/components/ui/Pagination";

interface AuthorsPageProps {
    authors: Author[];
    isError?: boolean;
    onRetry?: () => void;
    isLoading?: boolean;
    page?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
}

export default function AuthorsPage({
    authors, isError, onRetry,
    isLoading = false, page = 1, totalPages = 1, onPageChange = () => {},
}: AuthorsPageProps) {
    const { t } = useLanguage();

    return (
        <div data-testid="authors-page">
            <PageHeader
                title={t.authors.title}
                subtitle={interpolate(t.authors.subtitle, { count: String(authors.length) })}
            />

            {isError ? (
                <ErrorState
                    heading={t.common.errorHeading}
                    description={t.common.errorDescription}
                    retryLabel={t.common.retry}
                    onRetry={onRetry}
                />
            ) : isLoading && authors.length === 0 ? (
                <p className="py-16 text-center text-sm text-[var(--muted)]">{t.common.loading}</p>
            ) : authors.length === 0 ? (
                <EmptyState
                    heading={t.authors.emptyAuthors}
                    description={t.authors.emptyAuthorsDesc}
                    icon={<Users className="h-6 w-6" />}
                />
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4">
                        {authors.map((author) => (
                            <AuthorCard key={author.id} author={author} />
                        ))}
                    </div>
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                        prevLabel={t.common.prev}
                        nextLabel={t.common.next}
                    />
                </>
            )}
        </div>
    );
}

function AuthorCard({ author }: { author: Author }) {
    const { t } = useLanguage();
    return (
        <Link href={`/authors/${author.id}`} className="block">
            <Card className="text-center p-5 hover:-translate-y-0.5 transition-transform">
                <CardBody className="flex flex-col items-center gap-2 p-0">
                    <Avatar name={author.name} size="lg" />
                    <div>
                        <p className="text-sm font-semibold text-[var(--foreground)] leading-tight">{author.name}</p>
                        <p className="text-xs text-[var(--muted)] mt-0.5">
                            {interpolate(t.authors.booksInCollection, { count: String(author.bookCount) })}
                        </p>
                    </div>
                    {author.genre && <GenreTag genre={author.genre} />}
                </CardBody>
            </Card>
        </Link>
    );
}
