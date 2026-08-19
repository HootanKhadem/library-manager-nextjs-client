/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/lending/active/route";

const MOCK_LENDINGS = [{
    id: 1, bookId: 5, memberId: 3, userId: 42,
    lentDate: "2026-06-01", expectedReturnDate: "2026-07-01",
    actualReturnDate: null, status: "ACTIVE",
}];

function makeReq(cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/lending/active", {
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("GET /api/lending/active", () => {
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
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(MOCK_LENDINGS) });
        const res = await GET(makeReq("access_token=tok")); expect(res.status).toBe(200); expect(await res.json()).toEqual(MOCK_LENDINGS);
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
    it("propagates non-200 status from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 400, json: () => Promise.resolve({ message: "Bad request" }) });
        const res = await GET(makeReq("access_token=tok")); expect(res.status).toBe(400);
    });
});
