/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/author/search/route";

function makeReq(query: string, cookies?: string): NextRequest {
    return new NextRequest(`http://localhost/api/author/search?query=${encodeURIComponent(query)}`, {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("GET /api/author/search", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await GET(makeReq("borges"));
        expect(res.status).toBe(401);
    });

    it("proceeds when only refresh_token is present", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        const res = await GET(makeReq("borges", "refresh_token=rtok"));
        expect(res.status).toBe(200);
    });

    it("forwards the query param and Cookie header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        await GET(makeReq("borges", "access_token=tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/author/search?query=borges");
        expect(opts.headers.Cookie).toBe("access_token=tok");
    });

    it("proxies the 200 response from the backend", async () => {
        const authors = [{ id: 1, name: "Jorge Luis Borges" }];
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(authors) });
        const res = await GET(makeReq("borges", "access_token=tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(authors);
    });

    it("defaults to an empty query string when none is given", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        await GET(makeReq("", "access_token=tok"));
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/author/search?query=");
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("borges", "access_token=tok"));
        expect(res.status).toBe(503);
    });
});
