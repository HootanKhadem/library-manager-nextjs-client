/**
 * lib/i18n/types.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Central type definitions for the i18n (internationalisation) system.
 *
 * HOW THIS WORKS
 * ──────────────
 * 1. `Translations` is a plain TypeScript interface that describes every string
 *    the UI needs.  It is **nested** so related keys are grouped together
 *    (e.g. all sidebar strings live under `sidebar`).
 *
 * 2. Each supported language file (e.g. `en.ts`, `fa.ts`) must export a value
 *    that satisfies this interface.  TypeScript will flag any missing or
 *    misspelled keys at build time — so you can never ship a broken translation.
 *
 * 3. The `Language` union type lists every supported locale code.
 *    To add a new language: add its code here AND create the corresponding
 *    translation file in `lib/i18n/translations/`.
 *
 * HOW TO ADD A NEW LANGUAGE
 * ──────────────────────────
 * Step 1 – Add the locale code to the `Language` union below, e.g. "ar" | "de".
 * Step 2 – Create `lib/i18n/translations/<code>.ts` that exports `const <code>: Translations = { … }`.
 * Step 3 – Register the new file in `lib/i18n/context.tsx` inside the
 *           `TRANSLATIONS` map and the `LANGUAGE_META` list.
 * Step 4 – If the language is RTL (Arabic, Hebrew, Urdu …) set `dir: "rtl"` in
 *           `LANGUAGE_META` so the layout flips automatically.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** All locale codes supported by the app. */
export type Language = "en" | "fa";

/** Direction of text flow for a given language. */
export type TextDirection = "ltr" | "rtl";

/**
 * The complete shape of a translation object.
 * Every leaf value must be a `string`.
 * Groups are nested objects matching the component tree.
 */
export interface Translations {
    // ── Shared / common ────────────────────────────────────────────────────────
    common: {
        search: string;
        searchPlaceholder: string;
        close: string;
        cancel: string;
        save: string;
        reset: string;
        delete: string;
        add: string;
        all: string;
        loading: string;
        noResults: string;
        overdue: string;
        dash: string; // em-dash placeholder "—"
    };

    // ── Sidebar ─────────────────────────────────────────────────────────────────
    sidebar: {
        appSubtitle: string;
        statsBooks: string;
        statsLent: string;
        statsAuthors: string;
        navSectionLibrary: string;
        navSectionCatalog: string;
        navSectionSettings: string;
        navDashboard: string;
        navAllBooks: string;
        navCurrentlyLent: string;
        navAuthors: string;
        navPreferences: string;
        addNewBook: string;
        languageSwitcherLabel: string;
    };

    // ── Topbar ──────────────────────────────────────────────────────────────────
    topbar: {
        toggleMenu: string;
        pages: {
            dashboard: [string, string]; // [title, subtitle]
            books: [string, string];
            lent: [string, string];
            authors: [string, string];
            settings: [string, string];
        };
    };

    // ── Dashboard page ──────────────────────────────────────────────────────────
    dashboard: {
        greeting: string;
        greetingName: string;
        greetingSubtitle: string;
        kpiTotalBooks: string;
        kpiTotalSub: string;
        kpiLent: string;
        kpiLentSub: string;
        kpiOverdue: string;
        kpiOverdueSub: string;
        recentlyAdded: string;
        viewAll: string;
        recentActivity: string;
        colTitleAuthor: string;
        colGenre: string;
        colStatus: string;
        colRating: string;
        activityLent: string;      // "Lent {title} to {person}"
        activityAdded: string;     // "Added {title} to collection"
        activityReturned: string;  // "{person} returned {title}"
    };

    // ── All Books page ──────────────────────────────────────────────────────────
    books: {
        title: string;
        subtitle: string;
        filterAll: string;
        filterOwned: string;
        filterLentOut: string;
        filterWishlist: string;
        colNumber: string;
        colTitle: string;
        colAuthor: string;
        colYear: string;
        colGenre: string;
        colStatus: string;
        colLentTo: string;
        colRating: string;
    };

    // ── Lent page ───────────────────────────────────────────────────────────────
    lent: {
        title: string;
        subtitle: string;
        filterAll: string;
        filterOverdue: string;
        labelLentTo: string;
        labelDateLent: string;
        labelDueBack: string;
        markReturned: string;
        remind: string;
        overdueWarning: string;
        emptyState: string;
    };

    // ── Authors page ─────────────────────────────────────────────────────────────
    authors: {
        title: string;
        subtitle: string;
        filterAll: string;
        filterFiction: string;
        filterNonfiction: string;
        booksInCollection: string;
        completeWorksTitle: string;
        changeAuthor: string;
        colTitle: string;
        colYear: string;
        colGenre: string;
        colStatus: string;
        colRating: string;
        colNotes: string;
    };

    // ── Settings page ────────────────────────────────────────────────────────────
    settings: {
        title: string;
        subtitle: string;
        generalTitle: string;
        fieldLibraryName: string;
        fieldOwnerName: string;
        fieldLoanDuration: string;
        fieldDateFormat: string;
        fieldMotto: string;
        exportTitle: string;
        exportCsv: string;
        exportJson: string;
        printCatalogue: string;
        loan30: string;
        loan60: string;
        loan90: string;
    };

    // ── Book detail modal ────────────────────────────────────────────────────────
    bookDetail: {
        labelStatus: string;
        labelGenre: string;
        labelRating: string;
        labelPublisher: string;
        labelIsbn: string;
        labelPages: string;
        labelDescription: string;
        labelNotes: string;
        labelLendingHistory: string;
        notesPlaceholder: string;
        colLentTo: string;
        colDateOut: string;
        colDateReturned: string;
        colCondition: string;
        btnDelete: string;
        btnClose: string;
        btnLend: string;
    };

    // ── Add book modal ────────────────────────────────────────────────────────────
    addBook: {
        title: string;
        subtitle: string;
        fieldTitle: string;
        fieldTitlePlaceholder: string;
        fieldAuthor: string;
        fieldAuthorPlaceholder: string;
        fieldYear: string;
        fieldYearPlaceholder: string;
        fieldGenre: string;
        fieldGenreDefault: string;
        fieldStatus: string;
        fieldPublisher: string;
        fieldPublisherPlaceholder: string;
        fieldIsbn: string;
        fieldIsbnPlaceholder: string;
        fieldPages: string;
        fieldPagesPlaceholder: string;
        fieldRating: string;
        fieldRatingDefault: string;
        fieldDescription: string;
        fieldDescriptionPlaceholder: string;
        fieldNotes: string;
        fieldNotesPlaceholder: string;
        btnAdd: string;
        btnCancel: string;
        genres: {
            fiction: string;
            nonFiction: string;
            mystery: string;
            scienceFiction: string;
            philosophy: string;
            artTheory: string;
            poetry: string;
            history: string;
            biography: string;
            psychology: string;
            other: string;
        };
        statuses: {
            owned: string;
            lentOut: string;
            wishlist: string;
            read: string;
        };
        ratings: {
            r5: string;
            r4: string;
            r3: string;
            r2: string;
            r1: string;
        };
    };

    // ── Badge component ─────────────────────────────────────────────────────────
    badge: {
        owned: string;
        lentOut: string;
        wishlist: string;
        read: string;
    };
}
