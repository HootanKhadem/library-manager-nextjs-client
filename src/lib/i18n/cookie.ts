import {Language} from "@/src/lib/i18n/types";

/** Mirrors the user's language so the server can render the right one on the very first paint. */
export const LANG_COOKIE = "toumaar-lang";

export function isLanguage(value: unknown): value is Language {
    return value === "en" || value === "fa";
}
