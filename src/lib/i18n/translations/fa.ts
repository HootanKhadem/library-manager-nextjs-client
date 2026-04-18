/**
 * lib/i18n/translations/fa.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Persian / Farsi (RTL) translations.
 *
 * FARSI & RTL NOTES
 * ─────────────────
 * • Farsi is written right-to-left.  Setting `dir="rtl"` on the root element
 *   causes the browser to mirror the layout automatically for block-level
 *   elements, flex rows, table columns, and most CSS.
 *
 * • Tailwind CSS v4 (like v3) respects the `dir` attribute natively when
 *   using logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `border-s-*`,
 *   `border-e-*`).  Physical directional classes (`ml-*`, `pl-*`, etc.) do NOT
 *   flip — avoid them in layout code and prefer their logical equivalents.
 *
 * • The Vazirmatn font is used for Farsi text (loaded via next/font/google in
 *   app/layout.tsx).  Latin text inside Farsi UI falls back gracefully.
 *
 * • Persian numerals are kept as Arabic-script digits (۱، ۲، ۳…) in pure
 *   Farsi content, but EN-1234 style numbers (ISBN, years) stay Latin since
 *   they are identifiers rather than human-readable counts.
 *
 * • Template placeholders such as {count}, {title}, {person} work identically
 *   to English — the `interpolate()` helper in `context.tsx` replaces them.
 *
 * HOW TO ADD ANOTHER RTL LANGUAGE (e.g. Arabic "ar")
 * ────────────────────────────────────────────────────
 * 1. Copy this file to `lib/i18n/translations/ar.ts`.
 * 2. Translate every string value.
 * 3. Add `"ar"` to the `Language` union in `lib/i18n/types.ts`.
 * 4. Register it in `TRANSLATIONS` and `LANGUAGE_META` in `lib/i18n/context.tsx`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {Translations} from "@/src/lib/i18n/types";

const fa: Translations = {
    common: {
        search: "جستجو",
        searchPlaceholder: "جستجوی کتاب، نویسنده…",
        close: "بستن",
        cancel: "لغو",
        save: "ذخیره تغییرات",
        reset: "بازنشانی",
        delete: "حذف",
        add: "افزودن",
        all: "همه",
        loading: "در حال بارگذاری…",
        noResults: "نتیجه‌ای یافت نشد.",
        overdue: "تأخیر دارد",
        dash: "—",
    },

    sidebar: {
        appSubtitle: "مدیر کتابخانه شخصی",
        statsBooks: "کتاب",
        statsLent: "امانت",
        statsAuthors: "نویسنده",
        navSectionLibrary: "کتابخانه",
        navSectionCatalog: "فهرست",
        navSectionSettings: "تنظیمات",
        navDashboard: "داشبورد",
        navAllBooks: "همه کتاب‌ها",
        navCurrentlyLent: "امانت‌های جاری",
        navAuthors: "نویسندگان",
        navPreferences: "تنظیمات",
        addNewBook: "＋ افزودن کتاب جدید",
        languageSwitcherLabel: "زبان",
    },

    topbar: {
        toggleMenu: "نمایش/مخفی منو",
        pages: {
            dashboard: ["داشبورد", "نمای کلی"],
            books: ["همه کتاب‌ها", "مجموعه کامل شما"],
            lent: ["امانت‌های جاری", "کتاب‌های نزد دیگران"],
            authors: ["نویسندگان", "نویسندگان مجموعه شما"],
            settings: ["تنظیمات", "پیکربندی"],
        },
    },

    dashboard: {
        greeting: "عصر بخیر،",
        greetingName: "کتاب‌دوست",
        greetingSubtitle: "نگاهی به وضعیت کتابخانه شخصی‌تان.",
        kpiTotalBooks: "مجموع کتاب‌ها",
        kpiTotalSub: "۳ کتاب در این ماه اضافه شد",
        kpiLent: "امانت جاری",
        kpiLentSub: "نزد ۵ نفر",
        kpiOverdue: "تأخیر دارد",
        kpiOverdueSub: "گذشته از تاریخ توافق‌شده",
        recentlyAdded: "اخیراً اضافه‌شده",
        viewAll: "مشاهده همه",
        recentActivity: "فعالیت اخیر",
        colTitleAuthor: "عنوان و نویسنده",
        colGenre: "ژانر",
        colStatus: "وضعیت",
        colRating: "امتیاز",
        activityLent: "{title} به {person} امانت داده شد",
        activityAdded: "{title} به مجموعه اضافه شد",
        activityReturned: "{person} کتاب {title} را برگرداند",
    },

    books: {
        title: "همه کتاب‌ها",
        subtitle: "کتابخانه شخصی شما — {count} جلد فهرست‌شده",
        filterAll: "همه",
        filterOwned: "موجود",
        filterLentOut: "امانت‌رفته",
        filterWishlist: "فهرست آرزو",
        colNumber: "#",
        colTitle: "عنوان",
        colAuthor: "نویسنده",
        colYear: "سال",
        colGenre: "ژانر",
        colStatus: "وضعیت",
        colLentTo: "امانت به",
        colRating: "امتیاز",
    },

    lent: {
        title: "امانت‌های جاری",
        subtitle: "{count} کتاب نزد دوستان و خانواده",
        filterAll: "همه امانت‌ها",
        filterOverdue: "فقط تأخیردار",
        labelLentTo: "امانت به",
        labelDateLent: "تاریخ امانت",
        labelDueBack: "تاریخ بازگشت",
        markReturned: "ثبت بازگشت",
        remind: "یادآوری",
        overdueWarning: "⚠ {date} — تأخیر دارد",
        emptyState: "در حال حاضر هیچ کتابی امانت داده نشده است.",
    },

    authors: {
        title: "نویسندگان",
        subtitle: "{count} نویسنده در مجموعه شما",
        filterAll: "همه",
        filterFiction: "داستان",
        filterNonfiction: "غیرداستان",
        booksInCollection: "{count} کتاب در مجموعه",
        completeWorksTitle: "خورخه لوئیس بورخس — آثار کامل در مجموعه",
        changeAuthor: "تغییر نویسنده",
        colTitle: "عنوان",
        colYear: "سال",
        colGenre: "ژانر",
        colStatus: "وضعیت",
        colRating: "امتیاز",
        colNotes: "یادداشت",
    },

    settings: {
        title: "تنظیمات",
        subtitle: "تجربه کتابخانه خود را شخصی‌سازی کنید",
        generalTitle: "تنظیمات عمومی",
        fieldLibraryName: "نام کتابخانه",
        fieldOwnerName: "نام مالک",
        fieldLoanDuration: "مدت پیش‌فرض امانت",
        fieldDateFormat: "قالب تاریخ",
        fieldMotto: "توضیح / شعار کتابخانه",
        exportTitle: "صادرات و پشتیبان‌گیری",
        exportCsv: "📄 خروجی CSV",
        exportJson: "📋 خروجی JSON",
        printCatalogue: "🖨 چاپ فهرست",
        loan30: "۳۰ روز",
        loan60: "۶۰ روز",
        loan90: "۹۰ روز",
    },

    bookDetail: {
        labelStatus: "وضعیت",
        labelGenre: "ژانر",
        labelRating: "امتیاز",
        labelPublisher: "ناشر",
        labelIsbn: "شابک",
        labelPages: "صفحات",
        labelDescription: "توضیحات",
        labelNotes: "یادداشت‌های من",
        labelLendingHistory: "تاریخچه امانت",
        notesPlaceholder: "یادداشت‌ها، نظرات یا تجربه‌های شخصی خود را بنویسید…",
        colLentTo: "امانت به",
        colDateOut: "تاریخ خروج",
        colDateReturned: "تاریخ بازگشت",
        colCondition: "وضعیت",
        btnDelete: "حذف",
        btnClose: "بستن",
        btnLend: "امانت دادن",
    },

    addBook: {
        title: "افزودن کتاب جدید",
        subtitle: "یک جلد جدید به کتابخانه‌تان اضافه کنید",
        fieldTitle: "عنوان *",
        fieldTitlePlaceholder: "مثلاً: برادران کارامازوف",
        fieldAuthor: "نویسنده *",
        fieldAuthorPlaceholder: "مثلاً: فئودور داستایفسکی",
        fieldYear: "سال انتشار",
        fieldYearPlaceholder: "مثلاً: ۱۸۸۰",
        fieldGenre: "ژانر",
        fieldGenreDefault: "انتخاب ژانر…",
        fieldStatus: "وضعیت",
        fieldPublisher: "ناشر",
        fieldPublisherPlaceholder: "مثلاً: نشر ثالث",
        fieldIsbn: "شابک",
        fieldIsbnPlaceholder: "978-…",
        fieldPages: "تعداد صفحات",
        fieldPagesPlaceholder: "مثلاً: ۸۲۴",
        fieldRating: "امتیاز",
        fieldRatingDefault: "— بدون امتیاز —",
        fieldDescription: "توضیحات / خلاصه",
        fieldDescriptionPlaceholder: "توضیح مختصر یا خلاصه کتاب…",
        fieldNotes: "یادداشت‌های شخصی",
        fieldNotesPlaceholder: "نظرات، یادداشت‌های خواندن، پیشنهادات…",
        btnAdd: "افزودن به کتابخانه",
        btnCancel: "لغو",
        genres: {
            fiction: "داستان",
            nonFiction: "غیرداستان",
            mystery: "رمز و راز",
            scienceFiction: "علمی‌تخیلی",
            philosophy: "فلسفه",
            artTheory: "نظریه هنر",
            poetry: "شعر",
            history: "تاریخ",
            biography: "زندگی‌نامه",
            psychology: "روان‌شناسی",
            other: "سایر",
        },
        statuses: {
            owned: "موجود",
            lentOut: "امانت‌رفته",
            wishlist: "فهرست آرزو",
            read: "خوانده‌شده",
        },
        ratings: {
            r5: "★★★★★ (۵)",
            r4: "★★★★☆ (۴)",
            r3: "★★★☆☆ (۳)",
            r2: "★★☆☆☆ (۲)",
            r1: "★☆☆☆☆ (۱)",
        },
    },

    badge: {
        owned: "موجود",
        lentOut: "امانت‌رفته",
        wishlist: "آرزو",
        read: "خوانده‌شده",
    },

    barcodeScanner: {
        title: "اسکن بارکد",
        subtitle: "دوربین را به بارکد پشت جلد کتاب بگیرید",
        scanning: "در حال اسکن — بارکد را ثابت نگه دارید…",
        permissionDenied: "دسترسی به دوربین رد شد. لطفاً مجوز دوربین را فعال کنید.",
        error: "خواندن بارکد ممکن نشد. دوباره امتحان کنید.",
    },
};

export default fa;
