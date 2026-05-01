/** @jest-environment node */
import {NextRequest} from 'next/server';
import {POST} from '@/src/app/api/auth/logout/route';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeReq(accessToken?: string) {
    const req = new NextRequest('http://localhost/api/auth/logout', {method: 'POST'});
    if (accessToken) {
        req.cookies.set('access_token', accessToken);
    }
    return req;
}

describe('POST /api/auth/logout', () => {
    beforeEach(() => {
        mockFetch.mockResolvedValue(new Response(null, {status: 200}));
        process.env.API_BASE_URL = 'https://api.example.com';
    });
    afterEach(() => jest.clearAllMocks());

    it('returns 200 with { ok: true }', async () => {
        const res = await POST(makeReq());
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ok: true});
    });

    it('clears the access_token cookie', async () => {
        const res = await POST(makeReq());
        const setCookie = res.headers.get('set-cookie') ?? '';
        expect(setCookie).toMatch(/access_token/i);
        const isExpired = /max-age=0/i.test(setCookie) || /Expires=Thu, 01 Jan 1970/i.test(setCookie);
        expect(isExpired).toBe(true);
    });

    it('clears the refresh_token cookie', async () => {
        const res = await POST(makeReq());
        const setCookies = res.headers.getSetCookie?.() ?? [res.headers.get('set-cookie') ?? ''];
        expect(setCookies.join(' ')).toMatch(/refresh_token/i);
    });

    it('calls the external revocation endpoint with the access_token', async () => {
        await POST(makeReq('tok_abc'));
        expect(mockFetch).toHaveBeenCalledWith(
            'https://api.example.com/auth/logout',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({Authorization: 'Bearer tok_abc'}),
            }),
        );
    });

    it('skips the external call when no access_token cookie is present', async () => {
        await POST(makeReq());
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('still clears cookies even when the external revocation call fails', async () => {
        mockFetch.mockRejectedValue(new Error('network error'));
        const res = await POST(makeReq('tok_abc'));
        expect(res.status).toBe(200);
        const setCookie = res.headers.get('set-cookie') ?? '';
        expect(setCookie).toMatch(/access_token/i);
    });
});
