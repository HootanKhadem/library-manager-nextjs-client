import {NextRequest, NextResponse} from 'next/server';
import {cookieBase, extractCookieValue, REFRESH_MAX_AGE} from '../_cookies';

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);

    if (
        !body ||
        typeof body.name !== 'string' || !body.name.trim() ||
        typeof body.email !== 'string' || !body.email.trim() ||
        typeof body.password !== 'string' || !body.password.trim()
    ) {
        return NextResponse.json({message: 'Name, email, and password are required.'}, {status: 400});
    }

    const {name, email, password} = body;

    let apiRes: Response;
    try {
        apiRes = await fetch(`${process.env.API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, email, password}),
        });
    } catch {
        return NextResponse.json(
            {message: 'Unable to reach the authentication server. Please try again.'},
            {status: 503}
        );
    }

    if (!apiRes.ok) {
        const data = await apiRes.json().catch(() => ({}));
        return NextResponse.json(
            {message: data.message ?? 'Unable to create account.'},
            {status: apiRes.status}
        );
    }

    const setCookieHeaders = apiRes.headers.getSetCookie();
    const access_token = extractCookieValue(setCookieHeaders, 'access_token');
    const refresh_token = extractCookieValue(setCookieHeaders, 'refresh_token');

    if (!access_token || !refresh_token) {
        return NextResponse.json(
            {message: 'Unable to create account.'},
            {status: 502}
        );
    }

    const base = cookieBase(req);
    const response = NextResponse.json({ok: true}, {status: 201});

    // access_token: always a session cookie (no maxAge) — expires when the
    // browser closes. The server controls its actual expiry via the JWT claim.
    response.cookies.set('access_token', access_token, base);

    // refresh_token: signup always implies "stay logged in" (there's no
    // remember-me checkbox on this form, and AuthContext.signup() persists
    // the session to localStorage unconditionally), so this must be a
    // persistent cookie to match — otherwise the client believes the user
    // is authenticated after a browser restart when the server-side session
    // has already expired.
    response.cookies.set('refresh_token', refresh_token, {...base, maxAge: REFRESH_MAX_AGE});

    return response;
}
