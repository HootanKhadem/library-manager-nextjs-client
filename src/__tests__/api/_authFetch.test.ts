/** @jest-environment node */
import {NextRequest, NextResponse} from 'next/server';
import {buildAuthCookieHeader, relayRefreshedAccessToken} from '@/src/app/api/_authFetch';

function makeReq(cookieHeader?: string): NextRequest {
    return new NextRequest('http://localhost/api/book', {
        headers: cookieHeader ? {Cookie: cookieHeader} : {},
    });
}

describe('buildAuthCookieHeader', () => {
    it('returns null when neither cookie is present', () => {
        expect(buildAuthCookieHeader(makeReq())).toBeNull();
    });

    it('includes only access_token when refresh_token is absent', () => {
        expect(buildAuthCookieHeader(makeReq('access_token=abc'))).toBe('access_token=abc');
    });

    it('includes only refresh_token when access_token is absent', () => {
        expect(buildAuthCookieHeader(makeReq('refresh_token=xyz'))).toBe('refresh_token=xyz');
    });

    it('includes both when both are present', () => {
        expect(buildAuthCookieHeader(makeReq('access_token=abc; refresh_token=xyz'))).toBe('access_token=abc; refresh_token=xyz');
    });
});

describe('relayRefreshedAccessToken', () => {
    it('sets a new access_token cookie on the outgoing response when the backend refreshed one', () => {
        const req = makeReq('refresh_token=xyz');
        const backendRes = {
            headers: {getSetCookie: () => ['access_token=newtok; Path=/; Secure; HttpOnly; SameSite=None']},
        } as unknown as Response;
        const outgoing = NextResponse.json({ok: true});

        relayRefreshedAccessToken(req, backendRes, outgoing);

        expect(outgoing.cookies.get('access_token')?.value).toBe('newtok');
    });

    it('does nothing when the backend response has no Set-Cookie headers', () => {
        const req = makeReq('access_token=abc');
        const backendRes = {headers: {getSetCookie: () => []}} as unknown as Response;
        const outgoing = NextResponse.json({ok: true});

        relayRefreshedAccessToken(req, backendRes, outgoing);

        expect(outgoing.cookies.get('access_token')).toBeUndefined();
    });

    it('does nothing when the backend response mock has no headers.getSetCookie at all', () => {
        const req = makeReq('access_token=abc');
        const backendRes = {} as unknown as Response;
        const outgoing = NextResponse.json({ok: true});

        expect(() => relayRefreshedAccessToken(req, backendRes, outgoing)).not.toThrow();
        expect(outgoing.cookies.get('access_token')).toBeUndefined();
    });
});
