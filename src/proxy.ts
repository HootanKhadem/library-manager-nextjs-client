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

    const token = req.cookies.get('access_token');
    if (!token) {
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
