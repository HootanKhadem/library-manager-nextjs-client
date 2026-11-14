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
        errorHeading: string;
        errorDescription: string;
        retry: string;
        prev: string;
        next: string;
        mainNavigation: string;
        openNavigation: string;
        pagination: string;
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
        brand: string;
    };

    // ── Topbar ──────────────────────────────────────────────────────────────────
    topbar: {
        toggleMenu: string;
        account: string;
        logout: string;
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
        kpiErrorShort: string;
        recentlyAddedEmpty: string;
        recentlyAddedEmptyDesc: string;
        activityEmpty: string;
        activityEmptyDesc: string;
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
        colLanguage: string;
        emptyFiltered: string;
        emptyFilteredDesc: string;
        emptyAll: string;
        emptyAllDesc: string;
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
        emptyOverdue: string;
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
        backToAuthors: string;
        notFound: string;
        statBooks: string;
        statOwned: string;
        statLentOut: string;
        statAvgRating: string;
        selectAuthor: string;
        selectAuthorDesc: string;
        colTitle: string;
        colYear: string;
        colGenre: string;
        colStatus: string;
        colRating: string;
        colName: string;
        colBooks: string;
        colLanguage: string;
        colNotes: string;
        emptyAuthors: string;
        emptyAuthorsDesc: string;
        emptyWorks: string;
        emptyWorksDesc: string;
        mergeButton: string;
        mergeTitle: string;
        mergeDesc: string;
        mergeSuggested: string;
        mergeSelectAll: string;
        mergeFind: string;
        mergeSearchPlaceholder: string;
        mergeNoMatch: string;
        mergeFinalName: string;
        mergeResult: string;
        mergeDuplicateTitles: string;
        mergeDeleteWarning: string;
        mergeCancel: string;
        mergeConfirm: string;
        mergeSelectToMerge: string;
        mergeError: string;
        mergeSuccess: string;
        mergeClose: string;
        mergeBooksCount: string;
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
        saveError: string;
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
        btnConfirmDelete: string;
        btnEdit: string;
        errorDeleteConflict: string;
        btnClose: string;
        btnLend: string;
        labelLendTo: string;
        selectMember: string;
        noMembers: string;
        labelLanguage: string;
        labelTranslator: string;
        labelQuantity: string;
        labelYear: string;
        labelCovers: string;
        frontCover: string;
        backCover: string;
        noCover: string;
        backToBooks: string;
        notFound: string;
    };

    // ── Add book modal ────────────────────────────────────────────────────────────
    addBook: {
        title: string;
        titleEdit: string;
        subtitle: string;
        fieldTitle: string;
        fieldTitlePlaceholder: string;
        fieldAuthor: string;
        fieldAuthorPlaceholder: string;
        authorBooksCount: string;
        authorExisting: string;
        authorWillCreate: string;
        authorCreateSeparate: string;
        authorSuggestions: string;
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
        fieldQuantity: string;
        fieldRating: string;
        fieldRatingDefault: string;
        fieldDescription: string;
        fieldDescriptionPlaceholder: string;
        fieldNotes: string;
        fieldNotesPlaceholder: string;
        fieldTranslator: string;
        fieldTranslatorPlaceholder: string;
        fieldLanguage: string;
        fieldLanguagePlaceholder: string;
        fieldFrontCover: string;
        fieldBackCover: string;
        chooseImage: string;
        removeImage: string;
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

    // ── Barcode scanner modal ────────────────────────────────────────────────────
    barcodeScanner: {
        title: string;
        subtitle: string;
        scanning: string;
        insecureContext: string;
        permissionDenied: string;
        error: string;
        camera: string;
        cameraAuto: string;
    };

    // ── Install prompt banner ───────────────────────────────────────────────────
    auth: {
        brandTagline1: string;
        brandTagline2: string;
        brandTagline3: string;
        brandBlurb: string;
        featuresLabel: string;
        featureBooksStrong: string;
        featureBooksRest: string;
        featureLoansStrong: string;
        featureLoansRest: string;
        featureAuthorsStrong: string;
        featureAuthorsRest: string;
        emailLabel: string;
        passwordLabel: string;
        togglePassword: string;
        welcomeBack: string;
        signInSubtitle: string;
        rememberMe: string;
        forgotPassword: string;
        signIn: string;
        signingIn: string;
        orContinueWith: string;
        noAccount: string;
        createOne: string;
        errEnterCredentials: string;
        errInvalidCredentials: string;
        errGeneric: string;
        createTitle: string;
        createSubtitle: string;
        nameLabel: string;
        namePlaceholder: string;
        confirmPasswordLabel: string;
        toggleConfirmPassword: string;
        requirementsLabel: string;
        reqLength: string;
        reqUppercase: string;
        reqDigit: string;
        createAccount: string;
        creatingAccount: string;
        haveAccount: string;
        errFillAll: string;
        errPasswordRules: string;
        errPasswordMismatch: string;
    };

    marketing: {
        navHome: string;
        navAbout: string;
        navTerms: string;
        signUp: string;
        signIn: string;
        primaryNav: string;
        footerNav: string;
        sectionsNav: string;
        themeToLight: string;
        themeToDark: string;
        footerTagline: string;
        footerCopyright: string; // {year}
        footerTerms: string;
        homeHeroTitle: string;
        homeHeroBody: string;
        homeCtaSignIn: string;
        homeCtaHow: string;
        homeWhyTitle: string;
        homeWhyP1: string;
        homeWhyP2: string;
        homeHowTitle: string;
        stateWishlistTitle: string;
        stateWishlistCopy: string;
        stateOwnedTitle: string;
        stateOwnedCopy: string;
        stateLentTitle: string;
        stateLentCopy: string;
        stateOverdueTitle: string;
        stateOverdueCopy: string;
        homeCaptureTitle: string;
        homeCaptureBody: string;
        homeClosingTitle: string;
        homeClosingBody: string;
        aboutTitle: string;
        aboutWhyTitle: string;
        aboutP1Pre: string;
        aboutP1Em: string;
        aboutP2: string;
        aboutBelieveTitle: string;
        aboutB1Title: string;
        aboutB1Body: string;
        aboutB2Title: string;
        aboutB2Body: string;
        aboutB3Title: string;
        aboutB3Body: string;
        aboutNameLabel: string;
        aboutNameBody: string;
        termsTitle: string;
        termsIntro: string;
        termsS1Title: string;
        termsS1Body: string;
        termsS2Title: string;
        termsS2Body: string;
        termsS3Title: string;
        termsS3Intro: string;
        termsS3AccountLabel: string;
        termsS3AccountBody: string;
        termsS3CollectionLabel: string;
        termsS3CollectionBody: string;
        termsS3PrefsLabel: string;
        termsS3PrefsBody: string;
        termsS3Outro: string;
        termsS4Title: string;
        termsS4Body: string;
        termsS5Title: string;
        termsS5Body: string;
        termsS6Title: string;
        termsS6Body: string;
        termsS6Updated: string;
        termsS7Title: string;
        termsS7Body: string;
        termsBackHome: string;
    };

    installPrompt: {
        title: string;
        androidSubtitle: string;
        iosSubtitle: string;
        iosStep1: string;
        iosStep2: string;
        install: string;
        dismiss: string;
    };
}
