/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/books/count/route";

function makeReq(token?: string): NextRequest {
    return new NextRequest("http://localhost/api/books/count", {
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

describe("GET /api/books/count", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await GET(makeReq());
        expect(res.status).toBe(401);
    });

    it("requests the backend count-user-books path with a Bearer header", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(12) });
        await GET(makeReq("tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/count-user-books");
        expect(opts.headers.Authorization).toBe("Bearer tok");
    });

    it("proxies the 200 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(12) });
        const res = await GET(makeReq("tok"));
        expect(res.status).toBe(200);
        expect(await res.json()).toBe(12);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("tok"));
        expect(res.status).toBe(503);
    });
});
