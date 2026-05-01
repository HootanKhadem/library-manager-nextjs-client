import {NextRequest, NextResponse} from 'next/server';

export async function POST(req: NextRequest) {
    const accessToken = req.cookies.get('access_token')?.value;

    // Best-effort revocation — we always clear local cookies regardless of outcome
    // so the user is logged out even if the upstream call fails.
    if (accessToken) {
        try {
            await fetch(`${process.env.API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
            });
        } catch {
            // Intentionally swallowed — local logout must succeed unconditionally.
        }
    }

    const response = NextResponse.json({ok: true});
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    return response;
}
