/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/author/search/route";

function makeReq(query: string, token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/author/search?query=${encodeURIComponent(query)}`, {
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

describe("GET /api/author/search", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await GET(makeReq("borges"));
        expect(res.status).toBe(401);
    });

    it("forwards the query param and Authorization header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        await GET(makeReq("borges", "tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/author/search?query=borges");
        expect(opts.headers.Authorization).toBe("Bearer tok");
    });

    it("proxies the 200 response from the backend", async () => {
        const authors = [{ id: 1, name: "Jorge Luis Borges" }];
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(authors) });
        const res = await GET(makeReq("borges", "tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(authors);
    });

    it("defaults to an empty query string when none is given", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        await GET(makeReq("", "tok"));
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/author/search?query=");
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("borges", "tok"));
        expect(res.status).toBe(503);
    });
});
