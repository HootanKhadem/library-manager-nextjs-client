import {NextRequest, NextResponse} from 'next/server';
import {cookieBase, extractCookieValue} from '@/src/app/api/auth/_cookies';

// The backend's transparent-refresh logic reads access_token/refresh_token
// as cookies on the incoming request — not as an Authorization header. Build
// a raw Cookie header from whichever of the two are present so the backend
// gets a chance to run that logic. access_token alone expires after 1 hour
// and the browser purges it itself once it does, so we must not require it:
// return null (→ 401 upstream) only when there is truly no session at all.
export function buildAuthCookieHeader(req: NextRequest): string | null {
    const access = req.cookies.get('access_token')?.value;
    const refresh = req.cookies.get('refresh_token')?.value;
    if (!access && !refresh) return null;
    return [
        access ? `access_token=${access}` : null,
        refresh ? `refresh_token=${refresh}` : null,
    ].filter((part): part is string => part !== null).join('; ');
}

// The backend transparently mints a new access_token (via its own
// Set-Cookie response header) whenever the incoming one was expired but the
// refresh_token was still valid. Relay that onto our own response so the
// browser's session extends automatically — this is what makes the
// backend's "no explicit refresh call" design actually work end-to-end.
// Tolerant of a Response-like object with no headers.getSetCookie (plain
// test mocks that don't care about this) — that just means nothing to relay.
export function relayRefreshedAccessToken(req: NextRequest, backendRes: Response, outgoing: NextResponse): void {
    const setCookieHeaders = backendRes.headers?.getSetCookie?.() ?? [];
    const refreshed = extractCookieValue(setCookieHeaders, 'access_token');
    if (refreshed) {
        outgoing.cookies.set('access_token', refreshed, cookieBase(req));
    }
}
