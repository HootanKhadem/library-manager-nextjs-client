/** @jest-environment node */
import {NextRequest} from 'next/server';
import {POST} from '@/src/app/api/auth/signup/route';

// The real backend never returns tokens in the JSON body — only via raw
// Set-Cookie response headers (library-manager-backend's refresh-token-flow
// design: cookies are the only place tokens live).
const MOCK_BODY = {name: 'Ada', email: 'ada@example.com', role: 'USER'};
const MOCK_SET_COOKIE_HEADERS = [
    'access_token=access-abc; Path=/; Secure; HttpOnly; SameSite=None',
    'refresh_token=refresh-xyz; Expires=Wed, 26 Aug 2026 12:43:45 GMT; Path=/; Secure; HttpOnly; SameSite=None',
];

function mockApiRes() {
    return {
        ok: true,
        json: () => Promise.resolve(MOCK_BODY),
        headers: {getSetCookie: () => MOCK_SET_COOKIE_HEADERS},
    };
}

function makeRequest(body: object): NextRequest {
    return new NextRequest('http://localhost/api/auth/signup', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
    });
}

describe('POST /api/auth/signup', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    // ── Success path ──────────────────────────────────────────────────────────

    it('returns 201 with { ok: true } when the API creates the account', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce(mockApiRes());

        const res = await POST(makeRequest({name: 'Ada', email: 'ada@example.com', password: 'Passw0rd'}));

        expect(res.status).toBe(201);
        expect(await res.json()).toEqual({ok: true});
    });

    it('forwards name, email, and password to the external API', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce(mockApiRes());

        await POST(makeRequest({name: 'Ada', email: 'ada@example.com', password: 'Passw0rd'}));

        const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain('/auth/signup');
        const body = JSON.parse(options.body as string);
        expect(body).toEqual({name: 'Ada', email: 'ada@example.com', password: 'Passw0rd'});
    });

    it('sets access_token as an httpOnly cookie on success', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce(mockApiRes());

        const res = await POST(makeRequest({name: 'Ada', email: 'ada@example.com', password: 'Passw0rd'}));

        expect(res.cookies.get('access_token')?.value).toBe('access-abc');
    });

    it('sets refresh_token as an httpOnly cookie on success', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce(mockApiRes());

        const res = await POST(makeRequest({name: 'Ada', email: 'ada@example.com', password: 'Passw0rd'}));

        expect(res.cookies.get('refresh_token')?.value).toBe('refresh-xyz');
    });

    it('sets maxAge on the refresh_token cookie (signup always implies "stay logged in")', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce(mockApiRes());

        const res = await POST(makeRequest({name: 'Ada', email: 'ada@example.com', password: 'Passw0rd'}));

        const setCookieHeader = res.headers.get('set-cookie') ?? '';
        expect(setCookieHeader).toMatch(/max-age=\d+/i);
        expect(res.cookies.get('refresh_token')?.maxAge).toEqual(expect.any(Number));
    });

    // ── Validation ───────────────────────────────────────────────────────────

    it('returns 400 when name is missing', async () => {
        const res = await POST(makeRequest({email: 'ada@example.com', password: 'Passw0rd'}));
        expect(res.status).toBe(400);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns 400 when email is missing', async () => {
        const res = await POST(makeRequest({name: 'Ada', password: 'Passw0rd'}));
        expect(res.status).toBe(400);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns 400 when password is missing', async () => {
        const res = await POST(makeRequest({name: 'Ada', email: 'ada@example.com'}));
        expect(res.status).toBe(400);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    // ── Backend failure ──────────────────────────────────────────────────────

    it('returns 400 and the backend message on a weak password', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: () => Promise.resolve({message: 'Password too weak.'}),
        });

        const res = await POST(makeRequest({name: 'Ada', email: 'ada@example.com', password: 'weak'}));

        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({message: 'Password too weak.'});
    });

    it('returns 409 and the backend message when the email is already registered', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 409,
            json: () => Promise.resolve({message: 'Email already registered.'}),
        });

        const res = await POST(makeRequest({name: 'Ada', email: 'ada@example.com', password: 'Passw0rd'}));

        expect(res.status).toBe(409);
        expect(await res.json()).toEqual({message: 'Email already registered.'});
    });

    it('does not set any auth cookies on failure', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 409,
            json: () => Promise.resolve({message: 'Email already registered.'}),
        });

        const res = await POST(makeRequest({name: 'Ada', email: 'ada@example.com', password: 'Passw0rd'}));

        expect(res.cookies.get('access_token')).toBeUndefined();
        expect(res.cookies.get('refresh_token')).toBeUndefined();
    });

    // ── Malformed upstream response ─────────────────────────────────────────

    it('returns 502 when the API responds ok but sends no auth cookies', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(MOCK_BODY),
            headers: {getSetCookie: () => []},
        });

        const res = await POST(makeRequest({name: 'Ada', email: 'ada@example.com', password: 'Passw0rd'}));

        expect(res.status).toBe(502);
        expect(res.cookies.get('access_token')).toBeUndefined();
        expect(res.cookies.get('refresh_token')).toBeUndefined();
    });

    // ── Network failure ───────────────────────────────────────────────────────

    it('returns 503 when the external API is unreachable', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('fetch failed'));

        const res = await POST(makeRequest({name: 'Ada', email: 'ada@example.com', password: 'Passw0rd'}));

        expect(res.status).toBe(503);
        const body = await res.json();
        expect(body.message).toMatch(/unable to reach/i);
    });
});
