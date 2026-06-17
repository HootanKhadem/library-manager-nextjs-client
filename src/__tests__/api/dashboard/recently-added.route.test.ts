/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/dashboard/recently-added/route";

const MOCK_BOOKS = [
    { id: 1, name: "Dune", author: "Herbert", genre: "Sci-Fi", status: "OWNED", rating: 5 },
];

function makeReq(token?: string): NextRequest {
    return new NextRequest("http://localhost/api/dashboard/recently-added", {
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

describe("GET /api/dashboard/recently-added", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await GET(makeReq()); expect(res.status).toBe(401);
    });
    it("proxies 200 response from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(MOCK_BOOKS) });
        const res = await GET(makeReq("tok")); expect(res.status).toBe(200); expect(await res.json()).toEqual(MOCK_BOOKS);
    });
    it("forwards limit=5 query param to backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        await GET(makeReq("tok"));
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("limit=5");
    });
    it("sends Authorization: Bearer header to backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) });
        await GET(makeReq("my-token"));
        const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(opts.headers.Authorization).toBe("Bearer my-token");
    });
    it("returns 503 when backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("tok")); expect(res.status).toBe(503);
        expect((await res.json()).message).toMatch(/unable to reach/i);
    });
});
