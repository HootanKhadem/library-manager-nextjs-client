import {NextRequest} from 'next/server';

// 7 days — applied to refresh_token when "remember me" is checked
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

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
