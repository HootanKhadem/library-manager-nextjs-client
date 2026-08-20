import {NextRequest, NextResponse} from 'next/server';

// Only these app routes require an authenticated session. Everything else
// (marketing pages, the landing page at "/", /login) is public by default,
// so unauthenticated visitors always see the landing page first.
const PROTECTED_PATHS = ['/dashboard', '/books', '/lent', '/authors', '/settings'];

export function proxy(req: NextRequest) {
    const {pathname} = req.nextUrl;

    if (!PROTECTED_PATHS.some(p => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // access_token is a short-lived session cookie; refresh_token can still be
    // valid for up to 7 days after it's gone (e.g. after a browser restart).
    // Only redirect when there's no session signal at all — a page rendered
    // with just refresh_token still works, since its data-fetching API calls
    // forward both cookies and the backend transparently mints a fresh
    // access_token (see src/app/api/_authFetch.ts).
    const hasAccessToken = req.cookies.has('access_token');
    const hasRefreshToken = req.cookies.has('refresh_token');
    if (!hasAccessToken && !hasRefreshToken) {
        const loginUrl = new URL('/login', req.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all paths except:
         * - _next/static  (Next.js static files)
         * - _next/image   (Next.js image optimisation)
         * - favicon.ico
         * - /api routes   (Route Handlers handle their own auth)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/).*)',
    ],
};
