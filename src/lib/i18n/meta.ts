import {Language, TextDirection} from "@/src/lib/i18n/types";

// Deliberately NOT in context.tsx: that file is a "use client" module, and a server component
// (the root layout) importing a plain object from it only gets a client reference, not the data.
export interface LanguageMeta {
    dir: TextDirection;
    nativeName: string;
    /** Optional class applied to <body> for language-specific font selection. */
    fontClass?: string;
}

export const LANGUAGE_META: Record<Language, LanguageMeta> = {
    en: {dir: "ltr", nativeName: "English"},
    fa: {dir: "rtl", nativeName: "فارسی", fontClass: "font-vazirmatn"},
};
