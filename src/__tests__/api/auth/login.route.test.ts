/** @jest-environment node */
import {NextRequest} from 'next/server';
import {POST} from '@/src/app/api/auth/login/route';

const MOCK_TOKENS = {access_token: 'access-abc', refresh_token: 'refresh-xyz'};

function makeRequest(body: object): NextRequest {
    return new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
    });
}

describe('POST /api/auth/login', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    // ── Success path ──────────────────────────────────────────────────────────

    it('returns 200 with { ok: true } when the API accepts the credentials', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(MOCK_TOKENS),
        });

        const res = await POST(makeRequest({email: 'a@b.com', password: 'pass', remember: false}));

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ok: true});
    });

    it('forwards only email and password to the external API (not remember)', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(MOCK_TOKENS),
        });

        await POST(makeRequest({email: 'a@b.com', password: 'pass', remember: true}));

        const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain('/auth/login');
        const body = JSON.parse(options.body as string);
        expect(body).toEqual({email: 'a@b.com', password: 'pass'});
        expect(body).not.toHaveProperty('remember');
    });

    it('sets access_token as an httpOnly cookie on success', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(MOCK_TOKENS),
        });

        const res = await POST(makeRequest({email: 'a@b.com', password: 'pass', remember: false}));

        expect(res.cookies.get('access_token')?.value).toBe('access-abc');
    });

    it('sets refresh_token as an httpOnly cookie on success', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(MOCK_TOKENS),
        });

        const res = await POST(makeRequest({email: 'a@b.com', password: 'pass', remember: false}));

        expect(res.cookies.get('refresh_token')?.value).toBe('refresh-xyz');
    });

    it('sets maxAge on cookies when remember=true', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(MOCK_TOKENS),
        });

        const res = await POST(makeRequest({email: 'a@b.com', password: 'pass', remember: true}));

        const setCookieHeader = res.headers.get('set-cookie') ?? '';
        expect(setCookieHeader).toMatch(/max-age=\d+/i);
    });

    it('does not set maxAge on cookies when remember=false', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(MOCK_TOKENS),
        });

        const res = await POST(makeRequest({email: 'a@b.com', password: 'pass', remember: false}));

        const accessCookie = res.cookies.get('access_token');
        expect(accessCookie?.maxAge).toBeUndefined();
    });

    // ── Authentication failure ────────────────────────────────────────────────

    it('returns 401 when the API rejects the credentials', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: () => Promise.resolve({message: 'Invalid credentials.'}),
        });

        const res = await POST(makeRequest({email: 'a@b.com', password: 'wrong', remember: false}));

        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({message: 'Invalid credentials.'});
    });

    it('falls back to a default message when the API error has no message', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: () => Promise.resolve({}),
        });

        const res = await POST(makeRequest({email: 'a@b.com', password: 'wrong', remember: false}));

        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.message).toBeTruthy();
    });

    it('does not set any auth cookies on failure', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: () => Promise.resolve({message: 'Invalid credentials.'}),
        });

        const res = await POST(makeRequest({email: 'a@b.com', password: 'wrong', remember: false}));

        expect(res.cookies.get('access_token')).toBeUndefined();
        expect(res.cookies.get('refresh_token')).toBeUndefined();
    });

    // ── Network failure ───────────────────────────────────────────────────────

    it('returns 503 when the external API is unreachable', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('fetch failed'));

        const res = await POST(makeRequest({email: 'a@b.com', password: 'pass', remember: false}));

        expect(res.status).toBe(503);
        const body = await res.json();
        expect(body.message).toMatch(/unable to reach/i);
    });
});
