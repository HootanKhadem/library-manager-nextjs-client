/**
 * Drop-in replacement for `fetch` for calls to our own Next.js Route Handlers.
 * Dispatches `librax:unauthorized` on 401 so AuthContext can clear the stale
 * session flag and redirect the user to the login page.
 */
export async function fetchWithAuth(
    input: RequestInfo | URL,
    init?: RequestInit,
): Promise<Response> {
    const res = await fetch(input, init);
    if (res.status === 401) {
        window.dispatchEvent(new Event('librax:unauthorized'));
    }
    return res;
}
