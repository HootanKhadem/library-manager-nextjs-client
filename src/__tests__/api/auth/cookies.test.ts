import {extractCookieValue} from '@/src/app/api/auth/_cookies';

describe('extractCookieValue', () => {
    it('extracts the value from a matching raw Set-Cookie header', () => {
        const headers = ['access_token=abc123; Path=/; Secure; HttpOnly; SameSite=None'];
        expect(extractCookieValue(headers, 'access_token')).toBe('abc123');
    });

    it('finds the right header among multiple Set-Cookie entries', () => {
        const headers = [
            'access_token=abc123; Path=/; Secure; HttpOnly; SameSite=None',
            'refresh_token=xyz789; Expires=Wed, 26 Aug 2026 12:43:45 GMT; Path=/; Secure; HttpOnly; SameSite=None',
        ];
        expect(extractCookieValue(headers, 'refresh_token')).toBe('xyz789');
    });

    it('returns undefined when no header matches the name', () => {
        const headers = ['access_token=abc123; Path=/; Secure; HttpOnly; SameSite=None'];
        expect(extractCookieValue(headers, 'refresh_token')).toBeUndefined();
    });

    it('returns undefined for an empty header list', () => {
        expect(extractCookieValue([], 'access_token')).toBeUndefined();
    });

    it('does not false-match a name that is a substring of another cookie name', () => {
        const headers = ['access_token_v2=wrong; Path=/'];
        expect(extractCookieValue(headers, 'access_token')).toBeUndefined();
    });

    it('stops at the first semicolon, ignoring cookie attributes', () => {
        const headers = ['access_token=abc123; Path=/; Secure'];
        expect(extractCookieValue(headers, 'access_token')).toBe('abc123');
    });
});
