/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/dashboard/recently-added/route";

const MOCK_BOOKS = [
    { id: 1, name: "Dune", author: "Herbert", genre: "Sci-Fi", status: "OWNED", rating: 5 },
];

function makeReq(cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/dashboard/recently-added", {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("GET /api/dashboard/recently-added", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await GET(makeReq()); expect(res.status).toBe(401);
    });
    it("proceeds when only refresh_token is present", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        const res = await GET(makeReq("refresh_token=rtok")); expect(res.status).toBe(200);
    });
    it("proxies 200 response from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(MOCK_BOOKS) });
        const res = await GET(makeReq("access_token=tok")); expect(res.status).toBe(200); expect(await res.json()).toEqual(MOCK_BOOKS);
    });
    it("forwards limit=5 query param to backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        await GET(makeReq("access_token=tok"));
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("limit=5");
    });
    it("sends a Cookie header to backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        await GET(makeReq("access_token=my-token"));
        const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(opts.headers.Cookie).toBe("access_token=my-token");
    });
    it("returns 503 when backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("access_token=tok")); expect(res.status).toBe(503);
        expect((await res.json()).message).toMatch(/unable to reach/i);
    });
});
