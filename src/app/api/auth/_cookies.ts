import {NextRequest} from 'next/server';

// 7 days — applied to refresh_token when "remember me" is checked
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

// The backend never returns tokens in its JSON response body — only via raw
// Set-Cookie response headers (library-manager-backend's refresh-token-flow
// design: cookies are the only place tokens live). Pull the token value back
// out of the backend's own Set-Cookie header instead, so this route can still
// apply its own cookie attributes (sameSite, maxAge/remember-me) on top.
export function extractCookieValue(setCookieHeaders: string[], name: string): string | undefined {
    const prefix = `${name}=`;
    for (const header of setCookieHeaders) {
        if (header.startsWith(prefix)) {
            return header.slice(prefix.length).split(';')[0];
        }
    }
    return undefined;
}

export function cookieBase(req: NextRequest) {
    // Use HTTPS as the signal, not NODE_ENV. This works correctly in staging
    // environments served over HTTPS with NODE_ENV !== 'production'.
    const isHttps = req.url.startsWith('https://');
    return {
        httpOnly: true,
        secure: isHttps,
        sameSite: 'lax' as const,
        path: '/',
    };
}
