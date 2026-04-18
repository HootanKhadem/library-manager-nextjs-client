/**
 * lib/i18n/translations/en.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * English (LTR) translations.
 *
 * CONVENTIONS
 * ───────────
 * • Keys mirror the shape defined in `lib/i18n/types.ts`.
 * • Template-style strings use {placeholder} notation — components are
 *   responsible for replacing them (see `lib/i18n/context.tsx` → `interpolate`).
 * • Keep every value a plain string; no JSX allowed here.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {Translations} from "@/src/lib/i18n/types";

const en: Translations = {
    common: {
        search: "Search",
        searchPlaceholder: "Search books, authors…",
        close: "Close",
        cancel: "Cancel",
        save: "Save Changes",
        reset: "Reset",
        delete: "Delete",
        add: "Add",
        all: "All",
        loading: "Loading…",
        noResults: "No results found.",
        overdue: "Overdue",
        dash: "—",
    },

    sidebar: {
        appSubtitle: "Personal Library Manager",
        statsBooks: "Books",
        statsLent: "Lent",
        statsAuthors: "Authors",
        navSectionLibrary: "Library",
        navSectionCatalog: "Catalog",
        navSectionSettings: "Settings",
        navDashboard: "Dashboard",
        navAllBooks: "All Books",
        navCurrentlyLent: "Currently Lent",
        navAuthors: "Authors",
        navPreferences: "Preferences",
        addNewBook: "＋ Add New Book",
        languageSwitcherLabel: "Language",
    },

    topbar: {
        toggleMenu: "Toggle menu",
        pages: {
            dashboard: ["Dashboard", "Overview"],
            books: ["All Books", "Your Complete Collection"],
            lent: ["Currently Lent", "Books Out with Others"],
            authors: ["Authors", "Writers in Your Collection"],
            settings: ["Preferences", "Settings"],
        },
    },

    dashboard: {
        greeting: "Good Evening,",
        greetingName: "Bibliophile",
        greetingSubtitle: "Here is a snapshot of your personal library collection.",
        kpiTotalBooks: "Total Books",
        kpiTotalSub: "3 added this month",
        kpiLent: "Currently Lent",
        kpiLentSub: "Across 5 people",
        kpiOverdue: "Overdue",
        kpiOverdueSub: "Past agreed return date",
        recentlyAdded: "Recently Added",
        viewAll: "View All",
        recentActivity: "Recent Activity",
        colTitleAuthor: "Title & Author",
        colGenre: "Genre",
        colStatus: "Status",
        colRating: "Rating",
        // Template strings — components call interpolate(t, "{title}", actualTitle)
        activityLent: "Lent {title} to {person}",
        activityAdded: "Added {title} to collection",
        activityReturned: "{person} returned {title}",
    },

    books: {
        title: "All Books",
        subtitle: "Your complete personal library — {count} volumes catalogued",
        filterAll: "All",
        filterOwned: "Owned",
        filterLentOut: "Lent Out",
        filterWishlist: "Wishlist",
        colNumber: "#",
        colTitle: "Title",
        colAuthor: "Author",
        colYear: "Year",
        colGenre: "Genre",
        colStatus: "Status",
        colLentTo: "Lent To",
        colRating: "Rating",
    },

    lent: {
        title: "Currently Lent",
        subtitle: "{count} books currently out with friends & family",
        filterAll: "All Lent",
        filterOverdue: "Overdue Only",
        labelLentTo: "Lent To",
        labelDateLent: "Date Lent",
        labelDueBack: "Due Back",
        markReturned: "Mark Returned",
        remind: "Remind",
        overdueWarning: "⚠ {date} — Overdue",
        emptyState: "No books are currently lent out.",
    },

    authors: {
        title: "Authors",
        subtitle: "{count} authors represented in your collection",
        filterAll: "All",
        filterFiction: "Fiction",
        filterNonfiction: "Non-fiction",
        booksInCollection: "{count} book(s) in collection",
        completeWorksTitle: "Jorge Luis Borges — Complete Works in Collection",
        changeAuthor: "Change Author",
        colTitle: "Title",
        colYear: "Year",
        colGenre: "Genre",
        colStatus: "Status",
        colRating: "Rating",
        colNotes: "Notes",
    },

    settings: {
        title: "Preferences",
        subtitle: "Customize your library experience",
        generalTitle: "General Settings",
        fieldLibraryName: "Library Name",
        fieldOwnerName: "Owner Name",
        fieldLoanDuration: "Default Loan Duration",
        fieldDateFormat: "Date Format",
        fieldMotto: "Library Description / Motto",
        exportTitle: "Export & Backup",
        exportCsv: "📄 Export as CSV",
        exportJson: "📋 Export as JSON",
        printCatalogue: "🖨 Print Catalogue",
        loan30: "30 days",
        loan60: "60 days",
        loan90: "90 days",
    },

    bookDetail: {
        labelStatus: "Status",
        labelGenre: "Genre",
        labelRating: "Rating",
        labelPublisher: "Publisher",
        labelIsbn: "ISBN",
        labelPages: "Pages",
        labelDescription: "Description",
        labelNotes: "My Notes & Comments",
        labelLendingHistory: "Lending History",
        notesPlaceholder: "Add personal notes, thoughts, or comments about this book…",
        colLentTo: "Lent To",
        colDateOut: "Date Out",
        colDateReturned: "Date Returned",
        colCondition: "Condition",
        btnDelete: "Delete",
        btnClose: "Close",
        btnLend: "Lend This Book",
    },

    addBook: {
        title: "Add New Book",
        subtitle: "Catalogue a new volume to your library",
        fieldTitle: "Title *",
        fieldTitlePlaceholder: "e.g. The Brothers Karamazov",
        fieldAuthor: "Author *",
        fieldAuthorPlaceholder: "e.g. Fyodor Dostoevsky",
        fieldYear: "Year Published",
        fieldYearPlaceholder: "e.g. 1880",
        fieldGenre: "Genre",
        fieldGenreDefault: "Select genre…",
        fieldStatus: "Status",
        fieldPublisher: "Publisher",
        fieldPublisherPlaceholder: "e.g. Penguin Classics",
        fieldIsbn: "ISBN",
        fieldIsbnPlaceholder: "978-…",
        fieldPages: "Pages",
        fieldPagesPlaceholder: "e.g. 824",
        fieldRating: "Rating",
        fieldRatingDefault: "— unrated —",
        fieldDescription: "Description / Synopsis",
        fieldDescriptionPlaceholder: "Brief description or synopsis of the book…",
        fieldNotes: "Personal Notes & Comments",
        fieldNotesPlaceholder: "Your personal thoughts, reading notes, recommendations…",
        btnAdd: "Add to Library",
        btnCancel: "Cancel",
        genres: {
            fiction: "Fiction",
            nonFiction: "Non-fiction",
            mystery: "Mystery",
            scienceFiction: "Science Fiction",
            philosophy: "Philosophy",
            artTheory: "Art Theory",
            poetry: "Poetry",
            history: "History",
            biography: "Biography",
            psychology: "Psychology",
            other: "Other",
        },
        statuses: {
            owned: "Owned",
            lentOut: "Lent Out",
            wishlist: "Wishlist",
            read: "Read",
        },
        ratings: {
            r5: "★★★★★ (5)",
            r4: "★★★★☆ (4)",
            r3: "★★★☆☆ (3)",
            r2: "★★☆☆☆ (2)",
            r1: "★☆☆☆☆ (1)",
        },
    },

    badge: {
        owned: "Owned",
        lentOut: "Lent Out",
        wishlist: "Wishlist",
        read: "Read",
    },
};

export default en;
