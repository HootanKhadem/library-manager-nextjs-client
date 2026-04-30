import {NextRequest, NextResponse} from 'next/server';

// 7 days — applied to refresh_token when "remember me" is checked
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

function cookieBase(req: NextRequest) {
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

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);

    if (
        !body ||
        typeof body.email !== 'string' || !body.email.trim() ||
        typeof body.password !== 'string' || !body.password.trim()
    ) {
        return NextResponse.json({message: 'Email and password are required.'}, {status: 400});
    }

    const {email, password, remember} = body;

    let apiRes: Response;
    try {
        apiRes = await fetch(`${process.env.API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password}),
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
            {message: data.message ?? 'Invalid credentials.'},
            {status: apiRes.status}
        );
    }

    const {access_token, refresh_token} = await apiRes.json();

    const base = cookieBase(req);
    const response = NextResponse.json({ok: true});

    // access_token: always a session cookie (no maxAge) — expires when the
    // browser closes. The server controls its actual expiry via the JWT claim.
    response.cookies.set('access_token', access_token, base);

    // refresh_token: persistent when "remember me", session cookie otherwise.
    response.cookies.set('refresh_token', refresh_token, remember
        ? {...base, maxAge: REFRESH_MAX_AGE}
        : base
    );

    return response;
}
