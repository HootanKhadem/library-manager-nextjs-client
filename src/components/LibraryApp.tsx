"use client";

import { useState } from "react";
import { Book, PageId } from "@/src/lib/types";
import { AUTHORS, BOOKS, BORGES_WORKS, getLentBooks } from "@/src/lib/data";
import { LanguageProvider } from "@/src/lib/i18n/context";
import Sidebar from "@/src/components/Sidebar";
import Topbar from "@/src/components/Topbar";
import DashboardPage from "@/src/components/pages/DashboardPage";
import BooksPage from "@/src/components/pages/BooksPage";
import LentPage from "@/src/components/pages/LentPage";
import AuthorsPage from "@/src/components/pages/AuthorsPage";
import SettingsPage from "@/src/components/pages/SettingsPage";
import BookDetailModal from "@/src/components/BookDetailModal";
import AddBookModal, { NewBookFormData } from "@/src/components/AddBookModal";

export default function LibraryApp() {
    const [activePage, setActivePage] = useState<PageId>("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [books, setBooks] = useState<Book[]>(BOOKS);

    const filteredBooks = searchQuery.trim()
        ? books.filter(
              (b) =>
                  b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  b.author.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : books;

    function handleAddBook(data: NewBookFormData) {
        const newBook: Book = {
            id: `book-${Date.now()}`,
            title: data.title,
            author: data.author,
            year: parseInt(data.year) || new Date().getFullYear(),
            genre: data.genre || "Other",
            status: data.status,
            publisher: data.publisher || undefined,
            isbn: data.isbn || undefined,
            pages: data.pages ? parseInt(data.pages) : undefined,
            rating: data.rating ? parseInt(data.rating) : undefined,
            description: data.description || undefined,
            notes: data.notes || undefined,
        };
        setBooks((prev) => [newBook, ...prev]);
    }

    return (
        <LanguageProvider>
            <div className="min-h-screen bg-[var(--background)]">
                <Sidebar
                    activePage={activePage}
                    onNavigate={(page) => { setActivePage(page); setSidebarOpen(false); }}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    onAddBook={() => setShowAddModal(true)}
                />

                {/* lg:ml-[60px] — matches the 60px collapsed sidebar width */}
                <main className="lg:ms-[60px] min-h-screen flex flex-col">
                    <Topbar
                        activePage={activePage}
                        onMenuToggle={() => setSidebarOpen((o) => !o)}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                    />

                    <div className="flex-1 p-6 lg:p-8">
                        {activePage === "dashboard" && (
                            <DashboardPage
                                books={filteredBooks}
                                onBookClick={setSelectedBook}
                                onViewAll={() => setActivePage("books")}
                            />
                        )}
                        {activePage === "books" && (
                            <BooksPage
                                books={filteredBooks}
                                onBookClick={setSelectedBook}
                                onAddBook={() => setShowAddModal(true)}
                            />
                        )}
                        {activePage === "lent" && (
                            <LentPage
                                lentBooks={getLentBooks().filter((b) =>
                                    searchQuery
                                        ? b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                          b.author.toLowerCase().includes(searchQuery.toLowerCase())
                                        : true
                                )}
                            />
                        )}
                        {activePage === "authors" && (
                            <AuthorsPage authors={AUTHORS} borgesWorks={BORGES_WORKS} />
                        )}
                        {activePage === "settings" && <SettingsPage />}
                    </div>
                </main>

                {selectedBook && (
                    <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />
                )}
                {showAddModal && (
                    <AddBookModal onClose={() => setShowAddModal(false)} onAdd={handleAddBook} />
                )}
            </div>
        </LanguageProvider>
    );
}
