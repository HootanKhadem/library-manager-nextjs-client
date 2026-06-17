/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/src/app/api/lending/active/route";

const MOCK_LENDINGS = [{
    id: 1, bookId: 5, memberId: 3, userId: 42,
    lentDate: "2026-06-01", expectedReturnDate: "2026-07-01",
    actualReturnDate: null, status: "ACTIVE",
}];

function makeReq(token?: string): NextRequest {
    return new NextRequest("http://localhost/api/lending/active", {
        headers: token ? { Cookie: `access_token=${token}` } : {},
    });
}

describe("GET /api/lending/active", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when access_token cookie is absent", async () => {
        const res = await GET(makeReq()); expect(res.status).toBe(401);
    });
    it("proxies 200 response from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(MOCK_LENDINGS) });
        const res = await GET(makeReq("tok")); expect(res.status).toBe(200); expect(await res.json()).toEqual(MOCK_LENDINGS);
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
    it("propagates non-200 status from backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({ message: "Unauthorized" }) });
        const res = await GET(makeReq("bad-tok")); expect(res.status).toBe(401);
    });
});
