/** @jest-environment node */
import { NextRequest } from "next/server";
import { PUT } from "@/src/app/api/lending/[id]/return/route";

function ctx(id: string) {
    return { params: Promise.resolve({ id }) };
}

function makeReq(cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/lending/9/return", {
        method: "PUT",
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("PUT /api/lending/[id]/return", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await PUT(makeReq(), ctx("9"));
        expect(res.status).toBe(401);
    });

    it("proceeds when only refresh_token is present", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 9, status: "RETURNED" }) });
        const res = await PUT(makeReq("refresh_token=rtok"), ctx("9"));
        expect(res.status).toBe(200);
    });

    it("requests the correct backend path with a Cookie header", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 9, status: "RETURNED" }) });
        await PUT(makeReq("access_token=tok"), ctx("9"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/lending/9/return");
        expect(opts.method).toBe("PUT");
        expect(opts.headers.Cookie).toBe("access_token=tok");
    });

    it("proxies the 200 response from the backend", async () => {
        const lending = { id: 9, status: "RETURNED" };
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(lending) });
        const res = await PUT(makeReq("access_token=tok"), ctx("9"));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(lending);
    });

    it("propagates a 404 from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({ message: "Lending not found" }) });
        const res = await PUT(makeReq("access_token=tok"), ctx("999"));
        expect(res.status).toBe(404);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await PUT(makeReq("access_token=tok"), ctx("9"));
        expect(res.status).toBe(503);
    });
});
