/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/book/isbn/[isbn]/route";

function makeReq(cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/book/isbn/0140328726", {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

function ctx(isbn: string) {
    return { params: Promise.resolve({ isbn }) };
}

describe("GET /api/book/isbn/[isbn]", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await GET(makeReq(), ctx("0140328726"));
        expect(res.status).toBe(401);
    });

    it("requests the backend isbn path with a Cookie header", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ title: "Fantastic Mr. Fox" }) });
        await GET(makeReq("access_token=tok"), ctx("0140328726"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/book/isbn/0140328726");
        expect(opts.headers.Cookie).toBe("access_token=tok");
    });

    it("proxies the 200 response from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ title: "Fantastic Mr. Fox", author: "Roald Dahl" }) });
        const res = await GET(makeReq("access_token=tok"), ctx("0140328726"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ title: "Fantastic Mr. Fox", author: "Roald Dahl" });
    });

    it("propagates a 404 from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({ message: "No book found for this ISBN" }) });
        const res = await GET(makeReq("access_token=tok"), ctx("0000000000"));
        expect(res.status).toBe(404);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await GET(makeReq("access_token=tok"), ctx("0140328726"));
        expect(res.status).toBe(503);
    });
});
