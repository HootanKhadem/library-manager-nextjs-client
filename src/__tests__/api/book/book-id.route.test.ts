/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/book/[id]/route";

function makeReq(token?: string): NextRequest {
    return new NextRequest("http://localhost/api/book/42", {
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

function ctx(id: string) {
    return { params: Promise.resolve({ id }) };
}

describe("GET /api/book/[id]", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await GET(makeReq(), ctx("42"));
        expect(res.status).toBe(401);
    });

    it("requests the backend path with the given id and Bearer header", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 42, name: "Dune" }) });
        await GET(makeReq("tok"), ctx("42"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/book/42");
        expect(opts.headers.Authorization).toBe("Bearer tok");
    });

    it("proxies the 200 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 42, name: "Dune" }) });
        const res = await GET(makeReq("tok"), ctx("42"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ id: 42, name: "Dune" });
    });

    it("propagates a 404 from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({ message: "Book not found" }) });
        const res = await GET(makeReq("tok"), ctx("999"));
        expect(res.status).toBe(404);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("tok"), ctx("42"));
        expect(res.status).toBe(503);
    });
});
