import {NextRequest, NextResponse} from 'next/server';

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

    const {access_token, refresh_token} = await apiRes.json();

    const base = cookieBase(req);
    const response = NextResponse.json({ok: true}, {status: 201});

    response.cookies.set('access_token', access_token, base);
    response.cookies.set('refresh_token', refresh_token, base);

    return response;
}
