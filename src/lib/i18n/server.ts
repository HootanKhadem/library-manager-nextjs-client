import {cookies} from "next/headers";
import {Language} from "@/src/lib/i18n/types";
import {isLanguage, LANG_COOKIE} from "@/src/lib/i18n/cookie";

/**
 * Resolves the language for the first server render, so the page never paints in the wrong
 * language before the client-side preference fetch lands.
 *
 * 1. The language cookie (written by LanguageProvider whenever the language changes or loads).
 * 2. No cookie but a session: ask the backend for the saved preference (first visit on this
 *    browser, or the cookie was cleared).
 * 3. Otherwise English.
 */
export async function getServerLanguage(): Promise<Language> {
    const store = await cookies();

    const saved = store.get(LANG_COOKIE)?.value;
    if (isLanguage(saved)) return saved;

    const access = store.get("access_token")?.value;
    const refresh = store.get("refresh_token")?.value;
    const base = process.env.API_BASE_URL;
    if ((!access && !refresh) || !base) return "en";

    try {
        const res = await fetch(`${base}/api/preferences`, {
            headers: {
                Cookie: [
                    access ? `access_token=${encodeURIComponent(access)}` : null,
                    refresh ? `refresh_token=${encodeURIComponent(refresh)}` : null,
                ].filter(Boolean).join("; "),
            },
            cache: "no-store",
            signal: AbortSignal.timeout(2000),
        });
        if (!res.ok) return "en";
        const data = await res.json().catch(() => null);
        return isLanguage(data?.language) ? data.language : "en";
    } catch {
        return "en"; // backend unreachable or slow: fall back rather than block the page
    }
}
