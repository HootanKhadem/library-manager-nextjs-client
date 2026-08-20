/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST } from "@/src/app/api/lending/route";

function makeReq(body: object, cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/lending", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(cookies ? { Cookie: cookies } : {}),
        },
        body: JSON.stringify(body),
    });
}

describe("POST /api/lending", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await POST(makeReq({ bookId: 1, memberId: 2, lentDate: "2026-08-05" }));
        expect(res.status).toBe(401);
    });

    it("proceeds when only refresh_token is present", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 9, bookId: 1, memberId: 2, status: "ACTIVE" }) });
        const res = await POST(makeReq({ bookId: 1, memberId: 2, lentDate: "2026-08-05" }, "refresh_token=rtok"));
        expect(res.status).toBe(201);
    });

    it("forwards the request body and Cookie header to the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: 9, bookId: 1, memberId: 2, status: "ACTIVE" }) });
        await POST(makeReq({ bookId: 1, memberId: 2, lentDate: "2026-08-05" }, "access_token=tok"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/lending");
        expect(opts.method).toBe("POST");
        expect(opts.headers.Cookie).toBe("access_token=tok");
        expect(JSON.parse(opts.body)).toEqual({ bookId: 1, memberId: 2, lentDate: "2026-08-05" });
    });

    it("proxies the 201 response from the backend", async () => {
        const lending = { id: 9, bookId: 1, memberId: 2, status: "ACTIVE" };
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve(lending) });
        const res = await POST(makeReq({ bookId: 1, memberId: 2, lentDate: "2026-08-05" }, "access_token=tok"));
        expect(res.status).toBe(201);
        expect(await res.json()).toEqual(lending);
    });

    it("propagates a non-2xx status from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 400, json: () => Promise.resolve({ message: "Invalid lending" }) });
        const res = await POST(makeReq({ bookId: 0, memberId: 0, lentDate: "" }, "access_token=tok"));
        expect(res.status).toBe(400);
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await POST(makeReq({ bookId: 1, memberId: 2, lentDate: "2026-08-05" }, "access_token=tok"));
        expect(res.status).toBe(503);
    });
});
