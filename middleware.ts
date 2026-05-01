import {NextRequest, NextResponse} from 'next/server';

const PUBLIC_PATHS = ['/login'];

export function middleware(req: NextRequest) {
    const {pathname} = req.nextUrl;

    if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
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
