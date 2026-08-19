/** @jest-environment node */
import { NextRequest } from "next/server";
import { PUT, DELETE } from "@/src/app/api/member/[id]/route";

function ctx(id: string) {
    return { params: Promise.resolve({ id }) };
}

function makePutReq(body: object, cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/member/1", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...(cookies ? { Cookie: cookies } : {}),
        },
        body: JSON.stringify(body),
    });
}

function makeDeleteReq(cookies?: string): NextRequest {
    return new NextRequest("http://localhost/api/member/1", {
        method: "DELETE",
        headers: cookies ? { Cookie: cookies } : {},
    });
}

describe("PUT /api/member/[id]", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await PUT(makePutReq({ name: "Lucas Martinez" }), ctx("1"));
        expect(res.status).toBe(401);
    });

    it("forwards the body and Cookie header to the correct backend path", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ id: 1, name: "Lucas Martinez" }) });
        await PUT(makePutReq({ name: "Lucas Martinez" }, "access_token=tok"), ctx("1"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/member/1");
        expect(opts.method).toBe("PUT");
        expect(opts.headers.Cookie).toBe("access_token=tok");
    });

    it("propagates a 404 from the backend", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({ message: "Member not found" }) });
        const res = await PUT(makePutReq({ name: "Lucas Martinez" }, "access_token=tok"), ctx("999"));
        expect(res.status).toBe(404);
    });
});

describe("DELETE /api/member/[id]", () => {
    beforeEach(() => { process.env.API_BASE_URL = "http://backend"; global.fetch = jest.fn(); });
    afterEach(() => { jest.resetAllMocks(); });

    it("returns 401 when both access_token and refresh_token cookies are absent", async () => {
        const res = await DELETE(makeDeleteReq(), ctx("1"));
        expect(res.status).toBe(401);
    });

    it("returns 204 with no body on successful deletion", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 204 });
        const res = await DELETE(makeDeleteReq("access_token=tok"), ctx("1"));
        expect(res.status).toBe(204);
    });

    it("requests the correct backend path with a Cookie header", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 204 });
        await DELETE(makeDeleteReq("access_token=tok"), ctx("1"));
        const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe("http://backend/api/member/1");
        expect(opts.method).toBe("DELETE");
        expect(opts.headers.Cookie).toBe("access_token=tok");
    });

    it("returns 503 when the backend is unreachable", async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fetch failed"));
        const res = await DELETE(makeDeleteReq("access_token=tok"), ctx("1"));
        expect(res.status).toBe(503);
    });
});
